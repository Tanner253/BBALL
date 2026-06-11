/**
 * Beachball Launch — pure simulation core (demo build, no networking).
 *
 * World units are meters. +y is up, y = 0 is mean sea level.
 * Rendering and React wiring live elsewhere; this file only mutates GameState.
 */

import { GAME_WEATHER, updateWeather } from "./weather";

export type Phase = "ready" | "charging" | "flying" | "settling" | "over";

export type PickupType =
  | "coin" // +1 coin, tiny speed nudge
  | "ring" // orange boost ring (low altitude)
  | "jet" // golden jetstream ring (high altitude, bigger boost)
  | "balloon" // party balloon (mid sky) — pops for a big vertical kick
  | "bird" // seagull (low/mid sky) — obstacle, feathers everywhere
  | "storm" // grey storm cloud — sky obstacle, kills momentum
  | "sat" // satellite — space-level mega boost + bonus coins
  | "ufo" // UFO (space) — tractor beam steals speed and coins
  | "dolphin" // leaping dolphin near the surface — forward boost
  | "geyser" // water spout on the surface — vertical relaunch
  | "whale" // breaching whale — bounces the ball SUPER high
  | "candle" // red candle buoy on the water — classic momentum killer
  | "pump" // green candle buoy — number go up, straight vertical boost
  | "wick"; // white god candle — rare, massive vertical spike

export type Pickup = {
  id: number;
  type: PickupType;
  x: number;
  y: number;
  taken: boolean;
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  kind: "splash" | "spark" | "bubble" | "hit";
};

export type GameState = {
  phase: Phase;
  t: number;
  ball: { x: number; y: number; vx: number; vy: number; spin: number };
  /** 0..1 launch power — oscillates while charging (ping-pong). */
  charge: number;
  chargePhase: number;
  /** Seconds for one full power ramp; randomized per charge session. */
  chargeUp: number;
  /** Current aim angle in degrees (sweeps while charging). */
  aimDeg: number;
  aimPhase: number;
  /** Aim sweep speed multiplier; randomized per charge session. */
  aimRate: number;
  holding: boolean;
  distance: number;
  skips: number;
  combo: number;
  bestCombo: number;
  coins: number;
  maxAlt: number;
  maxSpeed: number;
  /** Set true for one step after a perfect skip (HUD flash). */
  perfectFlash: number;
  /** Text shown by the HUD flash while perfectFlash > 0. */
  flashText: string;
  /** One-shot events (sounds etc.), drained each frame by the game loop. */
  events: GameEvent[];
  /** Daily-upgrade modifiers active for this run. */
  mods: Mods;
  /** Remaining jetpack afterburner seconds. */
  jetpackLeft: number;
  /** Next distance milestone index (MILESTONES). */
  milestoneIdx: number;
  /** Remaining screen-shake seconds (renderer reads this). */
  shake: number;
  /** Pickup ids already credited with a near-miss (avoid double counting). */
  nearMissed: Set<number>;
  pickups: Pickup[];
  particles: Particle[];
  nextSpawnX: number;
  /** X position where the next coin word (LMAO / $BBALL) appears. */
  nextWordX: number;
  wordIndex: number;
  nextId: number;
};

export const BALL_R = 0.9;
export const GRAVITY = 24;

/** Run modifiers from daily upgrades (see src/lib/upgrades.ts). */
export type Mods = {
  /** Launch speed multiplier (Deeper Dunk). */
  launchMul: number;
  /** Seconds of afterburner thrust right after launch (Jetpack). */
  jetpackTime: number;
  /** Boost pickup strength multiplier (Super Boosts). */
  boostMul: number;
  /** Boost spawn chance multiplier (Boost Radar). */
  boostRateMul: number;
  /** Coin spawn chance multiplier (Coin Rain). */
  coinRateMul: number;
  /** Coin grab radius in meters (Coin Rain). */
  coinReach: number;
  /** Extra restitution added to water bounces (Bouncy Ball). */
  skipBounce: number;
  /** Air drag multiplier, <1 = slicker ball (Slipstream). */
  dragMul: number;
  /** Bonus coins added to every coin/satellite pickup (Golden Touch). */
  coinBonus: number;
};

export const DEFAULT_MODS: Mods = {
  launchMul: 1,
  jetpackTime: 0,
  boostMul: 1,
  boostRateMul: 1,
  coinRateMul: 1,
  coinReach: 1.5,
  skipBounce: 0,
  dragMul: 1,
  coinBonus: 0,
};

/** Launch speed (m/s) for a given charge — shared with the aim preview. */
export function launchSpeed(charge: number): number {
  return 26 + 62 * Math.pow(charge, 0.85);
}

/** Sound/effect events emitted by the sim, drained by the game loop. */
export type GameEvent =
  | "launch"
  | "coin"
  | "ring"
  | "jet"
  | "balloon"
  | "bird"
  | "sat"
  | "ufo"
  | "storm"
  | "candle"
  | "pump"
  | "wick"
  | "dolphin"
  | "geyser"
  | "whale"
  | "skip"
  | "perfect"
  | "bounce"
  | "splash"
  | "milestone"
  | "nearmiss";
/** Hype words for the perfect-skip flash — pure serotonin. */
const PERFECT_WORDS = [
  "PERFECT SKIP",
  "BUTTER!",
  "CLEAN!",
  "DIALED IN!",
  "SENDING IT!",
  "WAVE RIDER!",
];

/** Distance milestones with announcer lines. Space line matches SPACE_Y feel. */
export const MILESTONES: { at: number; text: string }[] = [
  { at: 250, text: "250m — WARMING UP" },
  { at: 500, text: "500m — CRUISING!" },
  { at: 1000, text: "1 KILOMETER!!" },
  { at: 2000, text: "2KM — ABSOLUTELY SENDING" },
  { at: 3500, text: "3.5KM — BEACHBALL HISTORY" },
  { at: 5000, text: "5KM — TOUCH GRASS (LATER)" },
];

/** Altitude (m) where "orbit" is announced once per run. */
const SPACE_ALT = 100;

const DIVE_ACCEL = 52;
const AIR_DRAG = 0.038;
/** Extra horizontal drag while holding — diving is a skill tool with a real
 *  cost: hold too long and the ball bleeds out and stops. */
const HOLD_DRAG = 0.55;
const MAX_DUNK_DEPTH = 3.0; // visual depth while charging (m)
const MIN_SKIP_SPEED = 7;
const SETTLE_SPEED = 0.6;

export function createInitialState(mods: Mods = DEFAULT_MODS): GameState {
  return {
    phase: "ready",
    // Wave phase is anchored to the UTC clock so every player worldwide sees
    // the same swell at the same moment (modulo a day to keep floats small).
    t: (Date.now() % 86_400_000) / 1000,
    ball: { x: 0, y: 0, vx: 0, vy: 0, spin: 0 },
    charge: 0,
    chargePhase: 0,
    chargeUp: 2.0,
    aimDeg: 45,
    aimPhase: 0,
    aimRate: 1,
    holding: false,
    distance: 0,
    skips: 0,
    combo: 0,
    bestCombo: 0,
    coins: 0,
    maxAlt: 0,
    maxSpeed: 0,
    perfectFlash: 0,
    flashText: "",
    events: [],
    mods,
    jetpackLeft: 0,
    milestoneIdx: 0,
    shake: 0,
    nearMissed: new Set(),
    pickups: [],
    particles: [],
    nextSpawnX: 25,
    nextWordX: 180,
    wordIndex: 0,
    nextId: 1,
  };
}

/** Organic water line — two layered sine waves shaped by today's weather.
 *  Same for every player worldwide (deterministic from the UTC date). */
export function waveHeight(x: number, t: number): number {
  const { waveAmp, waveFreq } = GAME_WEATHER;
  return (
    waveAmp *
    (0.64 * Math.sin(0.5 * waveFreq * x + 1.25 * t) +
      0.36 * Math.sin(1.35 * waveFreq * x - 0.7 * t))
  );
}

/** True when the surface at x sits in a wave dip (trough) right now. */
export function inWaveDip(x: number, t: number): boolean {
  return waveHeight(x, t) < -GAME_WEATHER.waveAmp * 0.18;
}

export function startCharge(s: GameState) {
  if (s.phase !== "ready") return;
  s.phase = "charging";
  s.charge = 0;
  s.chargePhase = 0;
  // Randomized per session so the rhythm can't be memorized.
  s.chargeUp = 1.5 + Math.random() * 1.0;
  s.aimRate = 1.1 + Math.random() * 0.9;
  s.aimPhase = Math.random() * Math.PI * 2;
  s.holding = true;
}

export function launch(s: GameState) {
  if (s.phase !== "charging") return;
  s.holding = false;
  s.phase = "flying";
  // Launch jitter: even a frame-perfect release has natural variance,
  // so there is no single "perfect" angle/power to grind out.
  const speed = launchSpeed(s.charge) * (0.94 + Math.random() * 0.12) * s.mods.launchMul;
  s.jetpackLeft = s.mods.jetpackTime;
  const deg = s.aimDeg + (Math.random() - 0.5) * 7;
  const rad = (deg * Math.PI) / 180;
  s.ball.x = 0;
  s.ball.y = 0.3;
  s.ball.vx = Math.cos(rad) * speed;
  s.ball.vy = Math.sin(rad) * speed;
  emit(s, "launch");
  burst(s, s.ball.x, 0, 14, "splash");
}

export function step(s: GameState, dt: number, holding: boolean) {
  // Weather drifts over the day — identical for every player (UTC-seeded).
  updateWeather();
  s.t += dt;
  s.holding = holding;
  s.perfectFlash = Math.max(0, s.perfectFlash - dt);
  s.shake = Math.max(0, s.shake - dt);

  switch (s.phase) {
    case "ready":
      s.ball.x = 0;
      s.ball.y = waveHeight(0, s.t) + 0.15 * Math.sin(s.t * 1.4);
      s.ball.spin += dt * 0.4;
      break;
    case "charging":
      stepCharging(s, dt);
      break;
    case "flying":
      stepFlying(s, dt, holding);
      break;
    case "settling":
      stepSettling(s, dt);
      break;
    case "over":
      // Gentle bob so the end screen still feels alive.
      s.ball.y = waveHeight(s.ball.x, s.t) + 0.1 * Math.sin(s.t * 1.2);
      break;
  }

  stepParticles(s, dt);
}

function stepCharging(s: GameState, dt: number) {
  // Power ping-pongs 0 → 1 → 0 forever; release timing is the whole game.
  s.chargePhase += dt / s.chargeUp;
  const tri = s.chargePhase % 2;
  s.charge = tri < 1 ? tri : 2 - tri;
  // Aim sweeps 22°..62° at a per-session randomized speed.
  s.aimPhase += dt * s.aimRate * 1.6;
  s.aimDeg = 22 + 40 * (0.5 + 0.5 * Math.sin(s.aimPhase));
  const wobble = 0.08 * Math.sin(s.t * 18) * s.charge;
  s.ball.x = 0;
  s.ball.y = -(0.4 + (MAX_DUNK_DEPTH - 0.4) * s.charge) + wobble;
  s.ball.spin -= dt * (1 + 3 * s.charge);
  // Pressure bubbles while submerged.
  if (Math.random() < dt * (8 + 30 * s.charge)) {
    spawnParticle(s, {
      x: s.ball.x + (Math.random() - 0.5) * 1.4,
      y: s.ball.y + (Math.random() - 0.3) * 0.8,
      vx: (Math.random() - 0.5) * 0.6,
      vy: 1.5 + Math.random() * 2,
      life: 1.1,
      max: 1.1,
      kind: "bubble",
    });
  }
}

function stepFlying(s: GameState, dt: number, holding: boolean) {
  const b = s.ball;

  b.vy -= GRAVITY * dt;
  if (holding && b.y > waveHeight(b.x, s.t) + BALL_R) {
    b.vy -= DIVE_ACCEL * dt;
    // Tucking in is a brake: release on the way up to keep your speed.
    b.vx *= Math.exp(-HOLD_DRAG * dt);
  }

  // Weather never touches the ball directly — it only shapes the waves.

  // Jetpack afterburner (daily upgrade): thrust right after launch.
  if (s.jetpackLeft > 0) {
    s.jetpackLeft -= dt;
    b.vx += 22 * dt;
    b.vy += 12 * dt;
    if (Math.random() < dt * 40) {
      spawnParticle(s, {
        x: b.x - BALL_R,
        y: b.y - BALL_R * 0.4,
        vx: -6 - Math.random() * 4,
        vy: (Math.random() - 0.5) * 3,
        life: 0.35,
        max: 0.35,
        kind: "spark",
      });
    }
  }

  // Air thins out with altitude — space runs glide much farther.
  const density = 0.25 + 0.75 * Math.exp(-Math.max(0, b.y) / 60);
  b.vx *= Math.exp(-AIR_DRAG * s.mods.dragMul * density * dt);
  b.vy *= Math.exp(-0.015 * density * dt);

  b.x += b.vx * dt;
  b.y += b.vy * dt;
  b.spin += b.vx * dt * 0.35;

  s.distance = Math.max(s.distance, b.x);
  s.maxAlt = Math.max(s.maxAlt, b.y);
  s.maxSpeed = Math.max(s.maxSpeed, Math.hypot(b.vx, b.vy));

  // Distance milestones — announcer flash + screen shake.
  const next = MILESTONES[s.milestoneIdx];
  if (next && s.distance >= next.at) {
    s.milestoneIdx += 1;
    s.perfectFlash = 1.4;
    s.flashText = next.text;
    s.shake = 0.5;
    emit(s, "milestone");
  }
  // One-time orbit announcement on a true space run.
  if (b.y >= SPACE_ALT && !s.nearMissed.has(-1)) {
    s.nearMissed.add(-1); // sentinel: orbit announced
    s.perfectFlash = 1.6;
    s.flashText = "🛰 ORBIT ACHIEVED";
    s.shake = 0.6;
    emit(s, "milestone");
  }

  spawnAhead(s);
  collectPickups(s);
  checkNearMisses(s);

  const surface = waveHeight(b.x, s.t);
  if (b.y <= surface && b.vy < 0) {
    handleWaterContact(s, surface);
  }
}

/** Local wave slope at x: negative = downhill ramp in the direction of
 *  travel (back face of a wave), positive = incline (front face). */
function waveSlope(x: number, t: number): number {
  return (waveHeight(x + 0.6, t) - waveHeight(x - 0.6, t)) / 1.2;
}

function handleWaterContact(s: GameState, surface: number) {
  const b = s.ball;
  const speed = Math.hypot(b.vx, b.vy);
  const impactDeg = (Math.atan2(-b.vy, Math.max(0.001, b.vx)) * 180) / Math.PI;
  const dip = inWaveDip(b.x, s.t);
  // The wave face acts as a ramp: landing on a downhill slope redirects the
  // slam into forward+up momentum; an uphill incline eats it.
  const slope = waveSlope(b.x, s.t);
  const downhill = Math.min(1, Math.max(0, -slope));
  const uphill = Math.min(1, Math.max(0, slope));

  if (speed > MIN_SKIP_SPEED && impactDeg < 52) {
    // Skip. Perfect = intentional dive INTO a wave dip — the trough acts as
    // a ramp and fires the ball back up HIGHER than it came in.
    const perfect = s.holding && impactDeg >= 8 && dip;
    // Held dive-slams only gain height in a dip — slamming flat water or a
    // crest while diving just buries the ball and bleeds energy.
    let e = perfect
      ? 1.12 + s.mods.skipBounce * 0.5
      : s.holding && !dip
      ? 0.48 + 0.14 * (1 - impactDeg / 52) + s.mods.skipBounce
      : 0.62 + 0.2 * (1 - impactDeg / 52) + (dip ? 0.18 : 0) + s.mods.skipBounce;
    e += 0.2 * downhill;
    // Only PERFECTs may gain energy — passive bounces always decay, no
    // matter how stacked the upgrades, so every run ends eventually.
    if (!perfect) e = Math.min(e, 0.9);
    b.y = surface + 0.02;
    b.vy = Math.min(-b.vy * e, 34); // cap chained perfects
    // Angular momentum off the wave face — downhill ramps sling the ball
    // forward, inclines sap it. A beachball never bounces backwards.
    const fwd = ((perfect ? 1.07 : 0.95) + s.mods.skipBounce * 0.25) *
      (1 + 0.22 * downhill - 0.18 * uphill);
    b.vx *= Math.min(fwd, perfect ? 1.06 : 1.0);
    b.vx = Math.max(b.vx, 0.5);
    s.skips += 1;
    if (perfect) {
      s.combo += 1;
      s.bestCombo = Math.max(s.bestCombo, s.combo);
      s.perfectFlash = 0.8;
      s.flashText = PERFECT_WORDS[Math.floor(Math.random() * PERFECT_WORDS.length)];
      emit(s, "perfect");
    } else {
      s.combo = 0;
      emit(s, "skip");
    }
    burst(s, b.x, surface, perfect ? 18 : 10, "splash");
  } else if (speed > MIN_SKIP_SPEED) {
    // Steep impact: it's a beachball — buoyancy pops it back up instead of
    // swallowing the bounce. A HELD slam into a dip is the perfect move
    // (boosted flight makes most landings steep, so this is where combos
    // actually live); held slams outside a dip just bury the ball.
    const perfect = s.holding && dip;
    const base = perfect ? 0.95 : dip ? 0.77 : s.holding ? 0.42 : 0.55;
    b.y = surface + 0.02;
    // Same rule as skips: only PERFECTs can come back with interest.
    const rest = base + 0.18 * downhill + s.mods.skipBounce * 0.9;
    b.vy = Math.abs(b.vy) * (perfect ? rest : Math.min(rest, 0.88));
    if (perfect) b.vy = Math.min(b.vy, 38); // no infinite pogo to space
    // Downhill faces convert some of the slam into forward roll.
    b.vx = Math.max(
      0.5,
      Math.min(
        b.vx * ((perfect ? 1.0 : 0.86) + s.mods.skipBounce * 0.3) +
          downhill * speed * 0.1 -
          uphill * b.vx * 0.2,
        b.vx * (perfect ? 1.05 : 1.0)
      )
    );
    if (perfect) {
      s.skips += 1;
      s.combo += 1;
      s.bestCombo = Math.max(s.bestCombo, s.combo);
      s.perfectFlash = 0.8;
      s.flashText = PERFECT_WORDS[Math.floor(Math.random() * PERFECT_WORDS.length)];
      emit(s, "perfect");
    } else {
      s.combo = 0;
      emit(s, "bounce");
    }
    burst(s, b.x, surface, perfect ? 18 : 16, "splash");
  } else {
    s.phase = "settling";
    s.combo = 0;
    emit(s, "splash");
    burst(s, b.x, surface, 20, "splash");
  }
}

function stepSettling(s: GameState, dt: number) {
  const b = s.ball;
  const surface = waveHeight(b.x, s.t);
  b.vx *= Math.exp(-1.6 * dt);
  b.x += b.vx * dt;
  b.y += (surface - b.y) * Math.min(1, dt * 6);
  b.spin += b.vx * dt * 0.3;
  s.distance = Math.max(s.distance, b.x);
  collectPickups(s);
  if (Math.abs(b.vx) < SETTLE_SPEED) {
    b.vx = 0;
    s.phase = "over";
  }
}

// ---------------- Pickups ----------------

/** 5x5 coin-font for sky words. Space advances without coins. */
const COIN_FONT: Record<string, string[]> = {
  A: [".XXX.", "X...X", "XXXXX", "X...X", "X...X"],
  B: ["XXXX.", "X...X", "XXXX.", "X...X", "XXXX."],
  C: [".XXXX", "X....", "X....", "X....", ".XXXX"],
  D: ["XXXX.", "X...X", "X...X", "X...X", "XXXX."],
  E: ["XXXXX", "X....", "XXXX.", "X....", "XXXXX"],
  H: ["X...X", "X...X", "XXXXX", "X...X", "X...X"],
  I: ["XXXXX", "..X..", "..X..", "..X..", "XXXXX"],
  L: ["X....", "X....", "X....", "X....", "XXXXX"],
  M: ["X...X", "XX.XX", "X.X.X", "X...X", "X...X"],
  N: ["X...X", "XX..X", "X.X.X", "X..XX", "X...X"],
  O: [".XXX.", "X...X", "X...X", "X...X", ".XXX."],
  R: ["XXXX.", "X...X", "XXXX.", "X..X.", "X...X"],
  S: [".XXXX", "X....", ".XXX.", "....X", "XXXX."],
  T: ["XXXXX", "..X..", "..X..", "..X..", "..X.."],
  U: ["X...X", "X...X", "X...X", "X...X", ".XXX."],
  W: ["X...X", "X...X", "X.X.X", "XX.XX", "X...X"],
  $: [".XXXX", "X.X..", ".XXX.", "..X.X", "XXXX."],
  " ": [".....", ".....", ".....", ".....", "....."],
};

const WORDS = [
  "LMAO",
  "$BBALL",
  "SOL",
  "BBALLISH",
  "BEACHBALL UNDERWATER",
];
const WORD_CELL = 1.6; // meters per font cell

function spawnWord(s: GameState, x: number, word: string, baseY: number) {
  let cx = x;
  for (const ch of word) {
    const glyph = COIN_FONT[ch];
    if (!glyph) continue;
    for (let row = 0; row < glyph.length; row++) {
      for (let col = 0; col < glyph[row].length; col++) {
        if (glyph[row][col] === "X") {
          // Row 0 is the top of the glyph.
          addPickup(s, "coin", cx + col * WORD_CELL, baseY + (glyph.length - 1 - row) * WORD_CELL);
        }
      }
    }
    cx += 6 * WORD_CELL;
  }
  return cx - x; // word width
}

/** Coin pattern: arc, line, or rising stair at a given base altitude. */
function spawnCoinPattern(s: GameState, x: number, baseY: number) {
  const kind = Math.floor(Math.random() * 3);
  const n = 4 + Math.floor(Math.random() * 4);
  for (let j = 0; j < n; j++) {
    const y =
      kind === 0
        ? baseY + Math.sin((j / (n - 1)) * Math.PI) * 3.5 // arc
        : kind === 1
        ? baseY // line
        : baseY + j * 1.6; // stair
    addPickup(s, "coin", x + j * 2.1, y);
  }
}

/**
 * Layered spawner — each slot rolls every altitude band independently, so
 * the surface, low sky, mid sky and space all stay populated.
 */
function spawnAhead(s: GameState) {
  while (s.nextSpawnX < s.ball.x + 340) {
    const x = s.nextSpawnX;

    // Scheduled sky words spelled in coins, anywhere from low sky to high.
    if (x >= s.nextWordX) {
      const word = WORDS[s.wordIndex % WORDS.length];
      const baseY = 8 + Math.random() * 45;
      const width = spawnWord(s, x, word, baseY);
      s.wordIndex += 1;
      s.nextWordX = x + 300 + Math.random() * 250;
      s.nextSpawnX += width + 18;
      continue;
    }

    // --- Surface lane (water level) ---
    // Kept sparse on purpose: surface boosts re-launch the ball, so a dense
    // lane makes runs effectively endless and turns the game into a movie.
    const sr = Math.random();
    if (x > 150 && sr < 0.012) {
      // Rare breaching whale — the jackpot bounce.
      addPickup(s, "whale", x + 6, 0);
    } else if (x > 200 && sr < 0.027) {
      // Rare white god candle — massive vertical spike.
      addPickup(s, "wick", x, 0);
    } else if (x > 80 && sr < 0.13) {
      addPickup(s, "candle", x, 0);
    } else if (x > 70 && sr < 0.19) {
      // Green candle — number go up.
      addPickup(s, "pump", x, 0);
    } else if (x > 100 && sr < 0.25) {
      addPickup(s, "geyser", x + 4, 0);
    } else if (x > 60 && sr < 0.33) {
      addPickup(s, "dolphin", x + 2, 1.5 + Math.random() * 3);
    }

    // Upgrade-driven spawn rates (Coin Rain / Boost Radar). The multipliers
    // barely touch the low band: a saturated waterline lets the ball farm
    // coins and re-boost while skimming, which plays the game for you.
    // Upgrades enrich the mid sky and space instead — where you earn it.
    const cr = s.mods.coinRateMul;
    const br = s.mods.boostRateMul;
    const lowCr = 1 + (cr - 1) * 0.2;
    const lowBr = 1 + (br - 1) * 0.15;

    // --- Low sky (2–18 m): bread-and-butter coins and rings ---
    if (Math.random() < Math.min(0.32 * lowCr, 0.4)) {
      spawnCoinPattern(s, x, 2 + Math.random() * 12);
    }
    if (Math.random() < Math.min(0.16 * lowBr, 0.2)) {
      addPickup(s, "ring", x + 6, 3 + Math.random() * 15);
    } else if (Math.random() < 0.07 && x > 90) {
      addPickup(s, "bird", x + 8, 6 + Math.random() * 12);
    }

    // --- Mid sky (18–70 m): jets, balloons, birds, storms, more coins ---
    if (x > 100) {
      if (Math.random() < 0.18 * cr) {
        spawnCoinPattern(s, x + 5, 20 + Math.random() * 42);
      }
      const mr = Math.random();
      if (mr < 0.12 * br) {
        addPickup(s, "jet", x + 3, 26 + Math.random() * 40);
      } else if (mr < 0.12 * br + 0.1 * br) {
        addPickup(s, "balloon", x + 9, 22 + Math.random() * 40);
      } else if (mr < 0.12 * br + 0.1 * br + 0.09) {
        addPickup(s, "bird", x + 11, 20 + Math.random() * 28);
      } else if (mr < 0.12 * br + 0.1 * br + 0.09 + 0.11 && x > 160) {
        addPickup(s, "storm", x + 5, 24 + Math.random() * 42);
      }
    }

    // --- Space (85 m+): satellites, UFOs, star coins ---
    if (x > 280) {
      if (Math.random() < 0.17 * cr) {
        spawnCoinPattern(s, x + 6, 85 + Math.random() * 65);
      }
      const xr = Math.random();
      if (xr < 0.14 * br) {
        addPickup(s, "sat", x + 4, 85 + Math.random() * 70);
      } else if (xr < 0.14 * br + 0.11) {
        addPickup(s, "ufo", x + 10, 95 + Math.random() * 85);
      }
    }

    s.nextSpawnX += 17 + Math.random() * 21;
  }
  if (s.pickups.length > 420) {
    s.pickups = s.pickups.filter((p) => !p.taken && p.x > s.ball.x - 60);
  }
}

function addPickup(s: GameState, type: PickupType, x: number, y: number) {
  s.pickups.push({ id: s.nextId++, type, x, y, taken: false });
}

const REACH: Record<PickupType, number> = {
  coin: 1.5,
  ring: 2.2,
  jet: 2.6,
  balloon: 2.2,
  bird: 2.4,
  storm: 3.2,
  sat: 2.6,
  ufo: 3.4,
  dolphin: 2.0,
  geyser: 2.4,
  whale: 4.2,
  candle: 1.5,
  pump: 1.7,
  wick: 2.0,
};

/** Surface buoys ride the waves rather than holding a fixed altitude. */
const BUOYS = new Set<PickupType>(["candle", "pump", "wick"]);

function collectPickups(s: GameState) {
  const b = s.ball;
  // Super Boosts upgrade scales every positive pickup.
  const bm = s.mods.boostMul;
  for (const p of s.pickups) {
    if (p.taken) continue;
    const py = BUOYS.has(p.type) ? waveHeight(p.x, s.t) + 0.7 : p.y;
    const dx = b.x - p.x;
    const dy = b.y - py;
    const reach = p.type === "coin" ? s.mods.coinReach : REACH[p.type];
    if (dx * dx + dy * dy > reach * reach) continue;
    p.taken = true;
    emit(s, p.type);
    switch (p.type) {
      case "coin":
        // Perfect-skip combo multiplies coin value (×2, ×3… capped ×10).
        // Coins are money only — they never push the ball.
        s.coins += 1 + Math.min(s.combo, 9) + s.mods.coinBonus;
        burst(s, p.x, py, 8, "spark");
        break;
      case "ring":
        b.vx += 9 * bm;
        b.vy = Math.max(b.vy + 8 * bm, 13 * bm);
        burst(s, p.x, py, 14, "spark");
        break;
      case "jet":
        b.vx += 15 * bm;
        b.vy = Math.max(b.vy + 10 * bm, 16 * bm);
        burst(s, p.x, py, 18, "spark");
        break;
      case "sat":
        s.coins += 5 + s.mods.coinBonus;
        b.vx += 22 * bm;
        b.vy += 6 * bm;
        burst(s, p.x, py, 24, "spark");
        break;
      case "balloon":
        // Pop! Big vertical kick.
        b.vy = Math.max(b.vy + 14 * bm, 18 * bm);
        b.vx += 6 * bm;
        burst(s, p.x, py, 16, "spark");
        break;
      case "bird":
        b.vx *= 0.72;
        b.vy *= 0.8;
        burst(s, p.x, py, 12, "hit");
        break;
      case "ufo":
        // Tractor beam: bleeds speed and skims coins.
        b.vx *= 0.55;
        b.vy *= 0.6;
        s.coins = Math.max(0, s.coins - 3);
        burst(s, p.x, py, 18, "hit");
        break;
      case "dolphin":
        // Flipper uppercut — big vertical pop with forward carry.
        b.vx += 10 * bm;
        b.vy = Math.max(b.vy + 19 * bm, 25 * bm);
        burst(s, p.x, py, 14, "splash");
        break;
      case "geyser":
        b.vy = Math.max(b.vy + 18 * bm, 23 * bm);
        b.vx += 2 * bm;
        burst(s, p.x, py, 18, "splash");
        break;
      case "whale":
        // Trampoline of the gods — straight to the sky.
        b.vy = Math.max(b.vy + 34 * bm, 42 * bm);
        b.vx += 10 * bm;
        s.perfectFlash = 1.2;
        s.flashText = "WHALE LAUNCH! 🐋";
        burst(s, p.x, py, 28, "splash");
        break;
      case "storm":
        b.vx *= 0.62;
        b.vy *= 0.65;
        burst(s, p.x, py, 14, "hit");
        break;
      case "candle":
        b.vx *= 0.68;
        burst(s, p.x, py, 12, "hit");
        break;
      case "pump":
        // Green candle — number go up.
        b.vy = Math.max(b.vy + 20 * bm, 26 * bm);
        b.vx += 4 * bm;
        burst(s, p.x, py, 16, "spark");
        break;
      case "wick":
        // White god candle — vertical moonshot.
        b.vy = Math.max(b.vy + 30 * bm, 38 * bm);
        b.vx += 3 * bm;
        s.perfectFlash = 1.0;
        s.flashText = "GOD CANDLE! 🕯️";
        burst(s, p.x, py, 24, "spark");
        break;
    }
  }
}

/** Hazard types that can award a near-miss thrill bonus. */
const HAZARDS = new Set<PickupType>(["candle", "storm", "bird", "ufo"]);
const NEAR_MISS_BAND = 2.4; // meters beyond the hit radius

/** Shaving past a hazard at speed grants a small boost + "CLOSE CALL!". */
function checkNearMisses(s: GameState) {
  const b = s.ball;
  if (Math.hypot(b.vx, b.vy) < 15) return;
  for (const p of s.pickups) {
    if (p.taken || !HAZARDS.has(p.type) || s.nearMissed.has(p.id)) continue;
    // Only credit once the ball is safely past the hazard's center.
    if (b.x < p.x + 1) continue;
    if (b.x > p.x + 14) continue;
    const py = p.type === "candle" ? waveHeight(p.x, s.t) + 0.7 : p.y;
    const d = Math.hypot(b.x - p.x, b.y - py);
    const reach = REACH[p.type];
    if (d > reach && d <= reach + NEAR_MISS_BAND) {
      s.nearMissed.add(p.id);
      b.vx *= 1.05;
      s.perfectFlash = Math.max(s.perfectFlash, 0.7);
      s.flashText = "CLOSE CALL!";
      emit(s, "nearmiss");
      burst(s, b.x, b.y, 6, "spark");
    }
  }
}

// ---------------- Events & particles ----------------

function emit(s: GameState, e: GameEvent) {
  if (s.events.length < 24) s.events.push(e);
}

function spawnParticle(s: GameState, p: Particle) {
  if (s.particles.length < 160) s.particles.push(p);
}

function burst(s: GameState, x: number, y: number, n: number, kind: Particle["kind"]) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI; // upward half
    const sp = 2 + Math.random() * (kind === "splash" ? 7 : 5);
    spawnParticle(s, {
      x: x + (Math.random() - 0.5) * 1.2,
      y,
      vx: Math.cos(a) * sp * (Math.random() < 0.5 ? -1 : 1) * 0.6,
      vy: Math.sin(a) * sp,
      life: 0.5 + Math.random() * 0.5,
      max: 1,
      kind,
    });
  }
}

function stepParticles(s: GameState, dt: number) {
  for (const p of s.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === "bubble") {
      p.vy += 2 * dt; // bubbles accelerate up
    } else {
      p.vy -= GRAVITY * 0.45 * dt;
    }
  }
  s.particles = s.particles.filter((p) => p.life > 0);
}
