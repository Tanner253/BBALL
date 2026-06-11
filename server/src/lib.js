/**
 * Shared helpers for the bball-api: Mongo connection, daily cycle math,
 * payout table, and score validation/anti-cheat plausibility checks.
 */

import crypto from "node:crypto";
import { MongoClient } from "mongodb";

/** $BBALL paid to the top 3 distance runners of each 24h cycle (manual). */
export const PAYOUTS = [100000, 50000, 25000];

/** $BBALL paid to the single top coin collector of each 48h coin cycle.
 *  TODO(owner): confirm the amount — placeholder until then. */
export const COINS_PAYOUT = 50000;

/** Hard sanity caps — anything beyond these is a rejected run. */
export const LIMITS = {
  maxDistance: 50000, // meters
  maxCoins: 5000,
  maxSkips: 2000,
  maxCombo: 500,
  nameMax: 18,
  /** Max plausible average horizontal speed (m/s), generous headroom.
   *  Space runs ride thin air + maxed upgrades, so this is roomy. */
  maxAvgSpeed: 150,
};

/**
 * Daily upgrade catalog — source of truth for costs (client mirrors this in
 * src/lib/upgrades.ts; keep them in sync). Upgrades are bought with coins
 * from the current 48h coin-cycle balance and reset every UTC day.
 */
export const UPGRADES = {
  dunk: { name: "Deeper Dunk", costs: [10, 30, 70] },
  jetpack: { name: "Jetpack", costs: [12, 35, 90] },
  power: { name: "Super Boosts", costs: [10, 30, 70] },
  radar: { name: "Boost Radar", costs: [8, 20, 45] },
  magnet: { name: "Coin Rain", costs: [8, 20, 45] },
};

export const MAX_UPGRADE_LEVEL = 3;

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
          db.collection("scores").createIndex({ coinCycleId: 1, wallet: 1 }),
          db.collection("purchases").createIndex({ coinCycleId: 1, wallet: 1 }),
          // One doc per level — makes double-buys impossible even under races.
          db
            .collection("purchases")
            .createIndex({ wallet: 1, upgrade: 1, cycleId: 1, level: 1 }, { unique: true }),
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

const DAY_MS = 86_400_000;

/** Coin cycles are 48h buckets aligned to even UTC days since epoch.
 *  Id is the ISO date of the cycle's first day, e.g. "2026-06-10". */
export function currentCoinCycleId(d = new Date()) {
  const days = Math.floor(d.getTime() / DAY_MS);
  const start = days - (days % 2);
  return new Date(start * DAY_MS).toISOString().slice(0, 10);
}

export function coinCycleEndsAt(d = new Date()) {
  const days = Math.floor(d.getTime() / DAY_MS);
  const start = days - (days % 2);
  return new Date((start + 2) * DAY_MS).toISOString();
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

// ---------------- Player identity & upgrades ----------------

export function isValidWallet(wallet) {
  return SOL_WALLET_RE.test(wallet);
}

const PLAYER_KEY_RE = /^[0-9a-f-]{36}$/;

export function isValidPlayerKey(key) {
  return typeof key === "string" && PLAYER_KEY_RE.test(key);
}

function hashKey(key) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Soft wallet ownership: the first device to use a wallet claims it with its
 * playerKey. Purchases require a matching key so nobody can drain someone
 * else's coin balance. Returns "ok" | "mismatch" | "invalid".
 */
export async function claimWallet(db, wallet, playerKey) {
  if (!isValidPlayerKey(playerKey)) return "invalid";
  const keyHash = hashKey(playerKey);
  const players = db.collection("players");
  const existing = await players.findOne({ _id: wallet });
  if (!existing) {
    try {
      await players.insertOne({ _id: wallet, keyHash, createdAt: new Date() });
      return "ok";
    } catch {
      // Lost an insert race — fall through and compare.
    }
    const again = await players.findOne({ _id: wallet });
    return again?.keyHash === keyHash ? "ok" : "mismatch";
  }
  return existing.keyHash === keyHash ? "ok" : "mismatch";
}

/** Per-cycle upgrade levels for a wallet, e.g. { dunk: 2, radar: 1 }. */
export async function upgradeLevels(db, wallet, cycleId) {
  const rows = await db
    .collection("purchases")
    .aggregate([
      { $match: { wallet, cycleId } },
      { $group: { _id: "$upgrade", n: { $sum: 1 } } },
    ])
    .toArray();
  const levels = {};
  for (const id of Object.keys(UPGRADES)) levels[id] = 0;
  for (const r of rows) if (r._id in levels) levels[r._id] = r.n;
  return levels;
}

/** Spendable coins: collected minus spent within the current coin cycle. */
export async function coinBalance(db, wallet, coinCycleId) {
  const [collected, spent] = await Promise.all([
    db
      .collection("scores")
      .aggregate([
        { $match: { coinCycleId, wallet } },
        { $group: { _id: null, n: { $sum: "$coins" } } },
      ])
      .toArray(),
    db
      .collection("purchases")
      .aggregate([
        { $match: { coinCycleId, wallet } },
        { $group: { _id: null, n: { $sum: "$cost" } } },
      ])
      .toArray(),
  ]);
  return (collected[0]?.n ?? 0) - (spent[0]?.n ?? 0);
}

/** Total coins spent per wallet in a coin cycle — for netting leaderboards. */
export async function spentByWallet(db, coinCycleId) {
  const rows = await db
    .collection("purchases")
    .aggregate([
      ...(coinCycleId ? [{ $match: { coinCycleId } }] : []),
      { $group: { _id: { c: "$coinCycleId", w: "$wallet" }, n: { $sum: "$cost" } } },
    ])
    .toArray();
  const map = new Map();
  for (const r of rows) map.set(`${r._id.c}|${r._id.w}`, r.n);
  return map;
}
