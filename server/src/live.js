/**
 * Live layer — every in-flight run streams its position here and everyone
 * sees everyone else's ball as a ghost on their canvas, plus a global chat
 * for signed-in players. Positions are pure in-memory; chat is mirrored to
 * the `chat` collection so history survives restarts/redeploys.
 *
 * Protocol (JSON):
 *   client -> server: { t: "pos", name, x, y }          (~10Hz while flying)
 *                     { t: "end" }                      (run finished)
 *                     { t: "chat", name, wallet, text } (signed-in players)
 *   server -> client: { t: "hello", id }
 *                     { t: "state", players: [{id,name,x,y}], watching }
 *                     { t: "chat-history", messages }   (on connect)
 *                     { t: "chat", msg }                (broadcast)
 *                     { t: "chat-err", error }          (to sender only)
 */

import { WebSocketServer } from "ws";
import { sanitizeChat, cleanName, isSignedIn } from "./chat.js";
import { getDb } from "./lib.js";

const STALE_MS = 5000;
const BROADCAST_MS = 100;
const MAX_MSG_BYTES = 700; // chat messages are bigger than pos updates
const CHAT_HISTORY_MAX = 500;
const CHAT_COOLDOWN_MS = 1500;

export function attachLive(server) {
  const wss = new WebSocketServer({ server, path: "/live" });
  /** ws -> { name, x, y, at } for connections currently mid-run. */
  const flying = new Map();
  /** Rolling global chat log, newest last. */
  let chatLog = [];
  let nextId = 1;
  let nextMsgId = 1;

  // Warm the in-memory log from Mongo so chat history survives restarts.
  // Chat still works (memory-only) if the DB is unreachable.
  getDb()
    .then(async (db) => {
      const rows = await db
        .collection("chat")
        .find({}, { projection: { _id: 0 } })
        .sort({ id: -1 })
        .limit(CHAT_HISTORY_MAX)
        .toArray();
      rows.reverse();
      // Don't clobber messages that arrived while we were loading.
      chatLog = [...rows, ...chatLog].slice(-CHAT_HISTORY_MAX);
      nextMsgId = Math.max(nextMsgId, ...rows.map((r) => r.id + 1));
    })
    .catch((e) => console.error("chat history load failed:", e.message));

  wss.on("connection", (ws) => {
    ws.liveId = String(nextId++);
    ws.lastChatAt = 0;
    // Tell the client its own id so it can filter its echo exactly.
    ws.send(JSON.stringify({ t: "hello", id: ws.liveId }));
    ws.send(JSON.stringify({ t: "chat-history", messages: chatLog }));

    ws.on("message", (buf) => {
      if (buf.length > MAX_MSG_BYTES) return;
      let m;
      try {
        m = JSON.parse(buf.toString());
      } catch {
        return;
      }
      if (m?.t === "pos" && Number.isFinite(m.x) && Number.isFinite(m.y)) {
        flying.set(ws, {
          name: cleanName(m.name),
          x: Math.max(0, Math.min(1000000, m.x)),
          y: Math.max(-10, Math.min(5000, m.y)),
          at: Date.now(),
        });
      } else if (m?.t === "end") {
        flying.delete(ws);
      } else if (m?.t === "chat") {
        handleChat(ws, m);
      }
    });
    ws.on("close", () => flying.delete(ws));
    ws.on("error", () => flying.delete(ws));
  });

  function handleChat(ws, m) {
    if (!isSignedIn(m.name, m.wallet)) {
      ws.send(JSON.stringify({ t: "chat-err", error: "sign in with a name + wallet to chat" }));
      return;
    }
    const now = Date.now();
    if (now - ws.lastChatAt < CHAT_COOLDOWN_MS) {
      ws.send(JSON.stringify({ t: "chat-err", error: "slow down a sec ⏳" }));
      return;
    }
    const text = sanitizeChat(m.text);
    if (!text) return;
    ws.lastChatAt = now;

    const msg = { id: nextMsgId++, name: cleanName(m.name), text, ts: now };
    chatLog.push(msg);
    if (chatLog.length > CHAT_HISTORY_MAX) chatLog.shift();
    persistChat(msg);
    const payload = JSON.stringify({ t: "chat", msg });
    for (const c of wss.clients) {
      if (c.readyState === 1) c.send(payload);
    }
  }

  /** Fire-and-forget mirror to Mongo; trims old rows every 50 messages. */
  function persistChat(msg) {
    getDb()
      .then(async (db) => {
        await db.collection("chat").insertOne({ ...msg });
        if (msg.id % 50 === 0) {
          await db.collection("chat").deleteMany({ id: { $lte: msg.id - CHAT_HISTORY_MAX } });
        }
      })
      .catch((e) => console.error("chat persist failed:", e.message));
  }

  setInterval(() => {
    const now = Date.now();
    for (const [ws, p] of flying) {
      if (now - p.at > STALE_MS || ws.readyState !== 1) flying.delete(ws);
    }
    if (wss.clients.size === 0) return;
    const payload = JSON.stringify({
      t: "state",
      players: [...flying.entries()].map(([ws, p]) => ({
        id: ws.liveId,
        name: p.name,
        x: Math.round(p.x * 10) / 10,
        y: Math.round(p.y * 10) / 10,
      })),
      watching: wss.clients.size,
    });
    for (const c of wss.clients) {
      if (c.readyState === 1) c.send(payload);
    }
  }, BROADCAST_MS).unref();

  return wss;
}
