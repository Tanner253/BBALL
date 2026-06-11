/**
 * Beachball Launch — pure simulation core (demo build, no networking).
 *
 * World units are meters. +y is up, y = 0 is mean sea level.
 * Rendering and React wiring live elsewhere; this file only mutates GameState.
 */

export type Phase = "ready" | "charging" | "flying" | "settling" | "over";

export type PickupType = "coin" | "ring" | "candle";

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
  /** 0..1 launch power, filled while charging. */
  charge: number;
  /** Current aim angle in degrees (sweeps while charging). */
  aimDeg: number;
  aimPhase: number;
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
  pickups: Pickup[];
  particles: Particle[];
  nextSpawnX: number;
  nextId: number;
};

export const BALL_R = 0.9;
const GRAVITY = 24;
const DIVE_ACCEL = 52;
const AIR_DRAG = 0.038;
const CHARGE_TIME = 2.4; // seconds to full power
const MAX_DUNK_DEPTH = 3.0; // visual depth while charging (m)
const MIN_SKIP_SPEED = 7;
const SETTLE_SPEED = 0.6;

export function createInitialState(): GameState {
  return {
    phase: "ready",
    t: 0,
    ball: { x: 0, y: 0, vx: 0, vy: 0, spin: 0 },
    charge: 0,
    aimDeg: 45,
    aimPhase: 0,
    holding: false,
    distance: 0,
    skips: 0,
    combo: 0,
    bestCombo: 0,
    coins: 0,
    maxAlt: 0,
    maxSpeed: 0,
    perfectFlash: 0,
    pickups: [],
    particles: [],
    nextSpawnX: 25,
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
  s.aimPhase = 0;
  s.holding = true;
}

export function launch(s: GameState) {
  if (s.phase !== "charging") return;
  s.holding = false;
  s.phase = "flying";
  const speed = 26 + 62 * Math.pow(s.charge, 0.85);
  const rad = (s.aimDeg * Math.PI) / 180;
  s.ball.x = 0;
  s.ball.y = 0.3;
  s.ball.vx = Math.cos(rad) * speed;
  s.ball.vy = Math.sin(rad) * speed;
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
  s.charge = Math.min(1, s.charge + dt / CHARGE_TIME);
  s.aimPhase += dt;
  // Aim sweeps 24°..66° — releasing at the right moment is part of the skill.
  s.aimDeg = 24 + 42 * (0.5 + 0.5 * Math.sin(s.aimPhase * 2.2 - Math.PI / 2));
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

  const drag = Math.exp(-AIR_DRAG * dt);
  b.vx *= drag;
  b.vy *= Math.exp(-0.015 * dt);

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
    } else {
      s.combo = 0;
    }
    burst(s, b.x, surface, perfect ? 16 : 10, "splash");
  } else {
    s.phase = "settling";
    s.combo = 0;
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

function spawnAhead(s: GameState) {
  while (s.nextSpawnX < s.ball.x + 260) {
    const roll = Math.random();
    const x = s.nextSpawnX;
    if (roll < 0.5) {
      // Arc of coins.
      const n = 4 + Math.floor(Math.random() * 3);
      const baseY = 2 + Math.random() * 10;
      for (let j = 0; j < n; j++) {
        addPickup(s, "coin", x + j * 2.1, baseY + Math.sin((j / (n - 1)) * Math.PI) * 3);
      }
    } else if (roll < 0.75) {
      addPickup(s, "ring", x, 3 + Math.random() * 12);
    } else if (x > 80) {
      // Red candle buoy bobbing on the surface.
      addPickup(s, "candle", x, 0);
    }
    s.nextSpawnX += 16 + Math.random() * 24;
  }
  if (s.pickups.length > 80) {
    s.pickups = s.pickups.filter((p) => !p.taken && p.x > s.ball.x - 60);
  }
}

function addPickup(s: GameState, type: PickupType, x: number, y: number) {
  s.pickups.push({ id: s.nextId++, type, x, y, taken: false });
}

function collectPickups(s: GameState) {
  const b = s.ball;
  for (const p of s.pickups) {
    if (p.taken) continue;
    const py = p.type === "candle" ? waveHeight(p.x, s.t) + 0.7 : p.y;
    const dx = b.x - p.x;
    const dy = b.y - py;
    const reach = p.type === "ring" ? 2.1 : p.type === "candle" ? 1.5 : 1.5;
    if (dx * dx + dy * dy > reach * reach) continue;
    p.taken = true;
    if (p.type === "coin") {
      s.coins += 1;
      b.vx += 1.8;
      burst(s, p.x, py, 8, "spark");
    } else if (p.type === "ring") {
      b.vx += 9;
      b.vy = Math.max(b.vy + 6, 10);
      burst(s, p.x, py, 14, "spark");
    } else {
      b.vx *= 0.68;
      burst(s, p.x, py, 12, "hit");
    }
  }
}

// ---------------- Particles ----------------

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
