/**
 * Client for the /live WebSocket — streams our ball position while flying
 * and receives everyone else's live runs to draw as ghosts.
 *
 * The server assigns us an id on connect ("hello"), so our own echo is
 * filtered exactly. Ghost positions are interpolated toward the latest
 * snapshot every frame, so they glide instead of stuttering at network rate.
 */

import { API_URL } from "@/lib/api";

export type GhostPlayer = { id: string; name: string; x: number; y: number };

export type ChatMsg = { id: number; name: string; text: string; ts: number };

const SEND_MS = 90; // ~11Hz position stream (server broadcasts at 10Hz)

type Ghost = {
  id: string;
  name: string;
  x: number; // displayed (interpolated)
  y: number;
  tx: number; // latest network target
  ty: number;
};

let ws: WebSocket | null = null;
let wanted = false;
let myId: string | null = null;
let watching = 0;
let lastSend = 0;
const ghosts = new Map<string, Ghost>();

// ---- Chat state (rolling log + subscription for React) ----
let chatLog: ChatMsg[] = [];
let chatError: string | null = null;
const chatListeners = new Set<() => void>();
const CHAT_MAX = 500;

function notifyChat() {
  for (const l of chatListeners) l();
}

export function connectLive() {
  if (typeof window === "undefined" || wanted) return;
  wanted = true;
  open();
}

export function disconnectLive() {
  wanted = false;
  ws?.close();
  ws = null;
  ghosts.clear();
}

function open() {
  if (!wanted || ws) return;
  try {
    ws = new WebSocket(`${API_URL.replace(/^http/, "ws")}/live`);
  } catch {
    ws = null;
    return;
  }
  ws.onmessage = (e) => {
    let m: {
      t?: string;
      id?: string;
      players?: GhostPlayer[];
      watching?: number;
      messages?: ChatMsg[];
      msg?: ChatMsg;
      error?: string;
    };
    try {
      m = JSON.parse(String(e.data));
    } catch {
      return;
    }
    if (m.t === "hello" && m.id) {
      myId = m.id;
    } else if (m.t === "chat-history" && Array.isArray(m.messages)) {
      chatLog = m.messages.slice(-CHAT_MAX);
      notifyChat();
    } else if (m.t === "chat" && m.msg) {
      chatLog = [...chatLog, m.msg].slice(-CHAT_MAX);
      chatError = null;
      notifyChat();
    } else if (m.t === "chat-err" && m.error) {
      chatError = m.error;
      notifyChat();
    } else if (m.t === "state" && Array.isArray(m.players)) {
      watching = m.watching ?? 0;
      const seen = new Set<string>();
      for (const p of m.players) {
        if (p.id === myId) continue;
        seen.add(p.id);
        const g = ghosts.get(p.id);
        if (g) {
          g.tx = p.x;
          g.ty = p.y;
          g.name = p.name;
        } else {
          // New ghost appears exactly where it is — no fly-in from origin.
          ghosts.set(p.id, { id: p.id, name: p.name, x: p.x, y: p.y, tx: p.x, ty: p.y });
        }
      }
      // Runs that ended (or went stale on the server) drop out immediately.
      for (const id of ghosts.keys()) {
        if (!seen.has(id)) ghosts.delete(id);
      }
    }
  };
  ws.onclose = () => {
    ws = null;
    myId = null;
    ghosts.clear();
    if (wanted) setTimeout(open, 3000); // quiet auto-reconnect
  };
  ws.onerror = () => ws?.close();
}

/**
 * Advance ghost interpolation; call once per rendered frame.
 * Returns the current ghost list, positioned smoothly.
 */
export function updateGhosts(dt: number): GhostPlayer[] {
  // Exponential approach — catches a 10Hz target quickly without snapping.
  const k = 1 - Math.exp(-dt * 12);
  const out: GhostPlayer[] = [];
  for (const g of ghosts.values()) {
    g.x += (g.tx - g.x) * k;
    g.y += (g.ty - g.y) * k;
    out.push(g);
  }
  return out;
}

export function liveWatching(): number {
  return watching;
}

/** Throttled — safe to call every frame while flying. */
export function sendLivePos(name: string, x: number, y: number) {
  if (!ws || ws.readyState !== 1) return;
  const now = performance.now();
  if (now - lastSend < SEND_MS) return;
  lastSend = now;
  ws.send(JSON.stringify({ t: "pos", name, x, y }));
}

export function sendLiveEnd() {
  if (ws?.readyState === 1) ws.send(JSON.stringify({ t: "end" }));
}

// ---- Chat API (used by ChatPanel) ----

export function subscribeChat(cb: () => void): () => void {
  chatListeners.add(cb);
  return () => chatListeners.delete(cb);
}

/** Stable snapshot for useSyncExternalStore. */
export function getChatLog(): ChatMsg[] {
  return chatLog;
}

export function getChatError(): string | null {
  return chatError;
}

export function clearChatError() {
  if (chatError === null) return;
  chatError = null;
  notifyChat();
}

/** Returns false when the socket isn't ready (caller can show a hint). */
export function sendChat(name: string, wallet: string, text: string): boolean {
  if (!ws || ws.readyState !== 1) return false;
  ws.send(JSON.stringify({ t: "chat", name, wallet, text: text.slice(0, 240) }));
  return true;
}
