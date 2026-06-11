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
  maxDistance: 1_000_000, // meters — god runs welcome, teleports not
  maxCoins: 25000,
  maxSkips: 5000,
  maxCombo: 1000,
  nameMax: 18,
  /** Max plausible average horizontal speed (m/s). Real runs have peaked
   *  at 369 m/s (1,328 km/h) with boost chains in thin air, so the average
   *  cap sits well above that. Still blocks instant-submit cheats: a 100k
   *  claim must be at least ~3.7 minutes old. */
  maxAvgSpeed: 450,
};

/**
 * Daily upgrade catalog — source of truth for costs (client mirrors this in
 * src/lib/upgrades.ts; keep them in sync). Upgrades are bought with today's
 * coins (daily balance, resets 00:00 UTC) and reset every UTC day too.
 */
export const UPGRADES = {
  dunk: { name: "Deeper Dunk", costs: [10, 40, 130, 400, 1100] },
  jetpack: { name: "Jetpack", costs: [12, 50, 160, 500, 1400] },
  power: { name: "Super Boosts", costs: [10, 40, 130, 400, 1100] },
  radar: { name: "Boost Radar", costs: [8, 30, 100, 320, 900] },
  magnet: { name: "Coin Rain", costs: [8, 30, 100, 320, 900] },
  bounce: { name: "Bouncy Ball", costs: [10, 40, 120, 380, 1000] },
  aero: { name: "Slipstream", costs: [15, 60, 200, 600, 1600] },
  greed: { name: "Golden Touch", costs: [20, 80, 260, 800, 2000] },
};

export const MAX_UPGRADE_LEVEL = 5;

/**
 * Daily challenge — deterministic from the cycle date so client and server
 * always agree (client mirror: src/lib/challenge.ts; keep in sync).
 * Qualifying runs earn bonus coins on top of what they collected.
 */
export const CHALLENGE_BONUS = 25;

export const CHALLENGES = [
  { id: "coins30", text: "Collect 30+ coins in one run", stat: "coins", min: 30 },
  { id: "skips15", text: "Land 15+ skips in one run", stat: "skips", min: 15 },
  { id: "combo5", text: "Chain a 5+ perfect-skip combo", stat: "bestCombo", min: 5 },
  { id: "dist800", text: "Fly 800m+ in one run", stat: "distance", min: 800 },
];

/** FNV-1a — must match src/components/game/weather.ts hashDay. */
export function hashDay(day) {
  let h = 2166136261;
  for (let i = 0; i < day.length; i++) {
    h ^= day.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function challengeFor(cycleId) {
  return CHALLENGES[hashDay(`${cycleId}:challenge`) % CHALLENGES.length];
}

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
          // Chat history is loaded/trimmed by id, newest first.
          db.collection("chat").createIndex({ id: -1 }),
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

/** Spendable coins: collected minus spent within the current DAILY cycle.
 *  Balances reset to 0 at 00:00 UTC along with upgrades; the 48h coin
 *  leaderboard accrues separately (net of spending) via coinCycleId. */
export async function coinBalance(db, wallet, cycleId) {
  const [collected, spent] = await Promise.all([
    db
      .collection("scores")
      .aggregate([
        { $match: { cycleId, wallet } },
        { $group: { _id: null, n: { $sum: "$coins" } } },
      ])
      .toArray(),
    db
      .collection("purchases")
      .aggregate([
        { $match: { cycleId, wallet } },
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
