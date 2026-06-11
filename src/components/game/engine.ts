/**
 * Beachball Launch — pure simulation core (demo build, no networking).
 *
 * World units are meters. +y is up, y = 0 is mean sea level.
 * Rendering and React wiring live elsewhere; this file only mutates GameState.
 */

import { GAME_WEATHER } from "./weather";

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
  | "candle"; // red candle buoy on the water — classic momentum killer

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
  /** One-shot events (sounds etc.), drained each frame by the game loop. */
  events: GameEvent[];
  /** Daily-upgrade modifiers active for this run. */
  mods: Mods;
  /** Remaining jetpack afterburner seconds. */
  jetpackLeft: number;
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
};

export const DEFAULT_MODS: Mods = {
  launchMul: 1,
  jetpackTime: 0,
  boostMul: 1,
  boostRateMul: 1,
  coinRateMul: 1,
  coinReach: 1.5,
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
  | "dolphin"
  | "geyser"
  | "skip"
  | "perfect"
  | "bounce"
  | "splash";
const DIVE_ACCEL = 52;
const AIR_DRAG = 0.038;
const MAX_DUNK_DEPTH = 3.0; // visual depth while charging (m)
const MIN_SKIP_SPEED = 7;
const SETTLE_SPEED = 0.6;

export function createInitialState(mods: Mods = DEFAULT_MODS): GameState {
  return {
    phase: "ready",
    t: 0,
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
    events: [],
    mods,
    jetpackLeft: 0,
    pickups: [],
    particles: [],
    nextSpawnX: 25,
    nextWordX: 180,
    wordIndex: 0,
    nextId: 1,
  };
}

/** Organic water line — two layered sine waves. */
export function waveHeight(x: number, t: number): number {
  return 0.32 * Math.sin(0.5 * x + 1.25 * t) + 0.18 * Math.sin(1.35 * x - 0.7 * t);
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
  s.t += dt;
  s.holding = holding;
  s.perfectFlash = Math.max(0, s.perfectFlash - dt);

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
  if (holding && b.y > waveHeight(b.x, s.t) + BALL_R) b.vy -= DIVE_ACCEL * dt;

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
  b.vx *= Math.exp(-AIR_DRAG * density * dt);
  b.vy *= Math.exp(-0.015 * density * dt);

  b.x += b.vx * dt;
  b.y += b.vy * dt;
  b.spin += b.vx * dt * 0.35;

  s.distance = Math.max(s.distance, b.x);
  s.maxAlt = Math.max(s.maxAlt, b.y);
  s.maxSpeed = Math.max(s.maxSpeed, Math.hypot(b.vx, b.vy));

  spawnAhead(s);
  collectPickups(s);

  const surface = waveHeight(b.x, s.t);
  if (b.y <= surface && b.vy < 0) {
    handleWaterContact(s, surface);
  }
}

function handleWaterContact(s: GameState, surface: number) {
  const b = s.ball;
  const speed = Math.hypot(b.vx, b.vy);
  const impactDeg = (Math.atan2(-b.vy, Math.max(0.001, b.vx)) * 180) / Math.PI;

  if (speed > MIN_SKIP_SPEED && impactDeg < 52) {
    // Skip. Shallow + intentional dive = "perfect" — keeps far more energy.
    const perfect = s.holding && impactDeg >= 8 && impactDeg <= 34;
    const e = perfect ? 0.82 : 0.5 + 0.18 * (1 - impactDeg / 52);
    b.y = surface + 0.02;
    b.vy = -b.vy * e;
    b.vx *= perfect ? 1.06 : 0.93;
    s.skips += 1;
    if (perfect) {
      s.combo += 1;
      s.bestCombo = Math.max(s.bestCombo, s.combo);
      s.perfectFlash = 0.8;
      emit(s, "perfect");
    } else {
      s.combo = 0;
      emit(s, "skip");
    }
    burst(s, b.x, surface, perfect ? 16 : 10, "splash");
  } else if (speed > MIN_SKIP_SPEED) {
    // Steep impact: it's a beachball — buoyancy pops it back up instead of
    // swallowing the bounce. Energy bleeds fast, but it never dies flat.
    b.y = surface + 0.02;
    b.vy = Math.abs(b.vy) * 0.48;
    b.vx *= 0.84;
    s.combo = 0;
    emit(s, "bounce");
    burst(s, b.x, surface, 16, "splash");
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
    const sr = Math.random();
    if (x > 80 && sr < 0.14) {
      addPickup(s, "candle", x, 0);
    } else if (x > 100 && sr < 0.26) {
      addPickup(s, "geyser", x + 4, 0);
    } else if (x > 60 && sr < 0.4) {
      addPickup(s, "dolphin", x + 2, 1.5 + Math.random() * 3);
    }

    // Upgrade-driven spawn rates (Coin Rain / Boost Radar).
    const cr = s.mods.coinRateMul;
    const br = s.mods.boostRateMul;

    // --- Low sky (2–18 m): bread-and-butter coins and rings ---
    if (Math.random() < 0.32 * cr) {
      spawnCoinPattern(s, x, 2 + Math.random() * 12);
    }
    if (Math.random() < 0.16 * br) {
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
  candle: 1.5,
};

function collectPickups(s: GameState) {
  const b = s.ball;
  // Super Boosts upgrade scales every positive pickup.
  const bm = s.mods.boostMul;
  for (const p of s.pickups) {
    if (p.taken) continue;
    const py = p.type === "candle" ? waveHeight(p.x, s.t) + 0.7 : p.y;
    const dx = b.x - p.x;
    const dy = b.y - py;
    const reach = p.type === "coin" ? s.mods.coinReach : REACH[p.type];
    if (dx * dx + dy * dy > reach * reach) continue;
    p.taken = true;
    emit(s, p.type);
    switch (p.type) {
      case "coin":
        s.coins += 1;
        b.vx += 1.8;
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
        s.coins += 5;
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
        b.vx += 12 * bm;
        b.vy = Math.max(b.vy + 6 * bm, 10 * bm);
        burst(s, p.x, py, 12, "splash");
        break;
      case "geyser":
        b.vy = Math.max(b.vy + 16 * bm, 20 * bm);
        b.vx += 2 * bm;
        burst(s, p.x, py, 18, "splash");
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
