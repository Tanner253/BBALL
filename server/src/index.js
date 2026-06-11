/**
 * bball-api — global leaderboard server for the Beachball Launch game.
 *
 * Flow:
 *   POST /api/runs    -> issue a one-time run token when a launch starts
 *   POST /api/scores  -> submit a finished run (token + stats + SOL wallet)
 *   GET  /api/leaderboard -> current 24h cycle top (best per wallet)
 *   GET  /api/winners -> top 3 of previous cycles (manual $BBALL payouts)
 *
 * Environments: configuration is entirely env-driven (MONGODB_URI,
 * ALLOWED_ORIGINS, PORT) so Dev/QA/Prod differ only in env vars.
 */

import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import {
  PAYOUTS,
  COINS_PAYOUT,
  getDb,
  currentCycleId,
  cycleEndsAt,
  currentCoinCycleId,
  coinCycleEndsAt,
  validateScore,
  minPlausibleSeconds,
} from "./lib.js";

const app = express();
app.set("trust proxy", 1); // Render terminates TLS in front of us
app.use(express.json({ limit: "4kb" }));

const defaultOrigins = ["https://bball.fun", "https://www.bball.fun"];
const allowed = (process.env.ALLOWED_ORIGINS ?? defaultOrigins.join(","))
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      const ok =
        !origin ||
        allowed.includes(origin) ||
        /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
        /\.vercel\.app$/.test(new URL(origin).hostname);
      cb(ok ? null : new Error("CORS: origin not allowed"), ok);
    },
  })
);

const readLimiter = rateLimit({ windowMs: 60_000, limit: 120 });
const runLimiter = rateLimit({ windowMs: 600_000, limit: 80 });
const scoreLimiter = rateLimit({ windowMs: 600_000, limit: 30 });

app.get("/healthz", (_req, res) => res.json({ ok: true }));

/** Issue a one-time run token. Called by the client at launch time. */
app.post("/api/runs", runLimiter, async (_req, res, next) => {
  try {
    const db = await getDb();
    const runToken = crypto.randomUUID();
    await db.collection("runs").insertOne({
      _id: runToken,
      issuedAt: new Date(),
      used: false,
    });
    res.json({ runToken });
  } catch (e) {
    next(e);
  }
});

/** Submit a finished run. */
app.post("/api/scores", scoreLimiter, async (req, res, next) => {
  try {
    const { error, value } = validateScore(req.body);
    if (error) return res.status(400).json({ ok: false, error });

    const db = await getDb();
    // Atomically consume the token so a run can never be submitted twice.
    const run = await db
      .collection("runs")
      .findOneAndUpdate({ _id: value.runToken, used: false }, { $set: { used: true } });
    if (!run) {
      return res.status(400).json({ ok: false, error: "run token invalid or already used" });
    }

    const elapsed = (Date.now() - run.issuedAt.getTime()) / 1000;
    if (elapsed < minPlausibleSeconds(value.distance)) {
      return res.status(400).json({ ok: false, error: "run rejected: implausible time" });
    }

    const cycleId = currentCycleId();
    const scores = db.collection("scores");
    await scores.insertOne({
      name: value.name,
      wallet: value.wallet,
      distance: value.distance,
      coins: value.coins,
      skips: value.skips,
      bestCombo: value.bestCombo,
      cycleId,
      coinCycleId: currentCoinCycleId(),
      createdAt: new Date(),
    });

    // Rank = wallets with a strictly better best distance this cycle, plus one.
    const better = await scores
      .aggregate([
        { $match: { cycleId, distance: { $gt: value.distance } } },
        { $group: { _id: "$wallet" } },
        { $count: "n" },
      ])
      .toArray();
    res.json({ ok: true, rank: (better[0]?.n ?? 0) + 1, cycleId });
  } catch (e) {
    next(e);
  }
});

/** Both boards: distance (daily, best run per wallet) and coins (48h, total
 *  collected per wallet). */
app.get("/api/leaderboard", readLimiter, async (_req, res, next) => {
  try {
    const db = await getDb();
    const scores = db.collection("scores");
    const cycleId = currentCycleId();
    const coinCycleId = currentCoinCycleId();

    const [distanceTop, coinsTop] = await Promise.all([
      scores
        .aggregate([
          { $match: { cycleId } },
          { $sort: { distance: -1, createdAt: 1 } },
          { $group: { _id: "$wallet", doc: { $first: "$$ROOT" } } },
          { $replaceRoot: { newRoot: "$doc" } },
          { $sort: { distance: -1, createdAt: 1 } },
          { $limit: 25 },
          { $project: { _id: 0, name: 1, wallet: 1, distance: 1, coins: 1, skips: 1, bestCombo: 1 } },
        ])
        .toArray(),
      scores
        .aggregate([
          { $match: { coinCycleId } },
          { $sort: { createdAt: -1 } },
          {
            $group: {
              _id: "$wallet",
              name: { $first: "$name" },
              coins: { $sum: "$coins" },
              runs: { $sum: 1 },
              bestDistance: { $max: "$distance" },
            },
          },
          { $sort: { coins: -1, bestDistance: -1 } },
          { $limit: 25 },
          { $project: { _id: 0, wallet: "$_id", name: 1, coins: 1, runs: 1, bestDistance: 1 } },
        ])
        .toArray(),
    ]);

    res.json({
      distance: { cycleId, endsAt: cycleEndsAt(), payouts: PAYOUTS, top: distanceTop },
      coins: { cycleId: coinCycleId, endsAt: coinCycleEndsAt(), payout: COINS_PAYOUT, top: coinsTop },
    });
  } catch (e) {
    next(e);
  }
});

/** Past winners for both competitions — the dev pays these out manually. */
app.get("/api/winners", readLimiter, async (_req, res, next) => {
  try {
    const db = await getDb();
    const scores = db.collection("scores");

    const [distance, coins] = await Promise.all([
      scores
        .aggregate([
          { $match: { cycleId: { $ne: currentCycleId() } } },
          { $sort: { distance: -1, createdAt: 1 } },
          { $group: { _id: { c: "$cycleId", w: "$wallet" }, doc: { $first: "$$ROOT" } } },
          { $replaceRoot: { newRoot: "$doc" } },
          { $sort: { distance: -1, createdAt: 1 } },
          {
            $group: {
              _id: "$cycleId",
              top: { $push: { name: "$name", wallet: "$wallet", distance: "$distance" } },
            },
          },
          { $project: { _id: 0, cycleId: "$_id", top: { $slice: ["$top", 3] } } },
          { $sort: { cycleId: -1 } },
          { $limit: 7 },
        ])
        .toArray(),
      scores
        .aggregate([
          { $match: { coinCycleId: { $exists: true, $ne: currentCoinCycleId() } } },
          {
            $group: {
              _id: { c: "$coinCycleId", w: "$wallet" },
              name: { $first: "$name" },
              coins: { $sum: "$coins" },
            },
          },
          { $sort: { coins: -1 } },
          {
            $group: {
              _id: "$_id.c",
              winner: { $first: { name: "$name", wallet: "$_id.w", coins: "$coins" } },
            },
          },
          { $project: { _id: 0, cycleId: "$_id", winner: 1 } },
          { $sort: { cycleId: -1 } },
          { $limit: 7 },
        ])
        .toArray(),
    ]);

    res.json({ payouts: PAYOUTS, coinsPayout: COINS_PAYOUT, distance, coins });
  } catch (e) {
    next(e);
  }
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status ?? 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ ok: false, error: status >= 500 ? "server error" : err.message });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`bball-api listening on :${port}`);
});
