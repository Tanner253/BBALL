/**
 * Shared helpers for the bball-api: Mongo connection, daily cycle math,
 * payout table, and score validation/anti-cheat plausibility checks.
 */

import { MongoClient } from "mongodb";

/** $BBALL paid to the top 3 of each 24h cycle (manually, by the dev). */
export const PAYOUTS = [100000, 50000, 25000];

/** Hard sanity caps — anything beyond these is a rejected run. */
export const LIMITS = {
  maxDistance: 50000, // meters
  maxCoins: 5000,
  maxSkips: 2000,
  maxCombo: 500,
  nameMax: 18,
  /** Max plausible average horizontal speed (m/s), generous headroom. */
  maxAvgSpeed: 90,
};

const SOL_WALLET_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

let clientPromise = null;

/** Lazy singleton DB connection so /healthz works even before Mongo is up. */
export async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    const err = new Error("MONGODB_URI is not configured");
    err.status = 503;
    throw err;
  }
  if (!clientPromise) {
    clientPromise = MongoClient.connect(uri)
      .then(async (client) => {
        const db = client.db(process.env.MONGODB_DB || "bball");
        await Promise.all([
          // Run tokens expire after an hour.
          db.collection("runs").createIndex({ issuedAt: 1 }, { expireAfterSeconds: 3600 }),
          db.collection("scores").createIndex({ cycleId: 1, distance: -1 }),
          db.collection("scores").createIndex({ cycleId: 1, wallet: 1 }),
        ]);
        return db;
      })
      .catch((e) => {
        clientPromise = null;
        throw e;
      });
  }
  return clientPromise;
}

/** Cycles are UTC days: "2026-06-11". Payouts reference these ids. */
export function currentCycleId(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function cycleEndsAt(d = new Date()) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1)
  ).toISOString();
}

/**
 * Validates a score submission body. Returns { error } or { value } with a
 * cleaned, typed payload safe to insert.
 */
export function validateScore(body) {
  if (!body || typeof body !== "object") return { error: "missing body" };

  const runToken = typeof body.runToken === "string" ? body.runToken : "";
  if (!/^[0-9a-f-]{36}$/.test(runToken)) return { error: "invalid run token" };

  const name = String(body.name ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, LIMITS.nameMax);
  if (!name) return { error: "name required" };

  const wallet = String(body.wallet ?? "").trim();
  if (!SOL_WALLET_RE.test(wallet)) return { error: "invalid Solana wallet address" };

  const nums = {};
  for (const [key, max] of [
    ["distance", LIMITS.maxDistance],
    ["coins", LIMITS.maxCoins],
    ["skips", LIMITS.maxSkips],
    ["bestCombo", LIMITS.maxCombo],
  ]) {
    const v = body[key];
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > max) {
      return { error: `invalid ${key}` };
    }
    nums[key] = Math.round(v);
  }
  if (nums.distance < 1) return { error: "invalid distance" };
  if (nums.bestCombo > nums.skips) return { error: "invalid combo" };

  return { value: { runToken, name, wallet, ...nums } };
}

/** Minimum seconds a run claiming `distance` meters could possibly take. */
export function minPlausibleSeconds(distance) {
  return Math.max(2, distance / LIMITS.maxAvgSpeed);
}
