/**
 * Live layer — every in-flight run streams its position here and everyone
 * sees everyone else's ball as a ghost on their canvas. Pure in-memory,
 * nothing touches the database.
 *
 * Protocol (JSON):
 *   client -> server: { t: "pos", name, x, y }   (~10Hz while flying)
 *                     { t: "end" }               (run finished)
 *   server -> client: { t: "state", players: [{id,name,x,y}], watching }
 *                     (5Hz broadcast)
 */

import { WebSocketServer } from "ws";

const STALE_MS = 5000;
const BROADCAST_MS = 100;
const MAX_MSG_BYTES = 256;

export function attachLive(server) {
  const wss = new WebSocketServer({ server, path: "/live" });
  /** ws -> { name, x, y, at } for connections currently mid-run. */
  const flying = new Map();
  let nextId = 1;

  wss.on("connection", (ws) => {
    ws.liveId = String(nextId++);
    // Tell the client its own id so it can filter its echo exactly.
    ws.send(JSON.stringify({ t: "hello", id: ws.liveId }));

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
          name: String(m.name ?? "")
            .replace(/[\u0000-\u001f\u007f]/g, "")
            .slice(0, 18),
          x: Math.max(0, Math.min(60000, m.x)),
          y: Math.max(-10, Math.min(2000, m.y)),
          at: Date.now(),
        });
      } else if (m?.t === "end") {
        flying.delete(ws);
      }
    });
    ws.on("close", () => flying.delete(ws));
    ws.on("error", () => flying.delete(ws));
  });

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
