/**
 * Tiny Web Audio synth for game sounds — no audio assets, everything is
 * generated (oscillators + filtered noise). Context starts on first user
 * gesture per browser autoplay rules.
 */

import type { GameEvent } from "./engine";

let ctx: AudioContext | null = null;
let muted = false;
let mutedLoaded = false;

const MUTE_KEY = "bball:game:muted";
const listeners = new Set<() => void>();

// useSyncExternalStore-compatible mute state -------------------------------

export function subscribeMuted(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function getMutedSnapshot(): boolean {
  if (!mutedLoaded) {
    mutedLoaded = true;
    try {
      muted = window.localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      muted = false;
    }
  }
  return muted;
}

export function getMutedServerSnapshot(): boolean {
  return false;
}

export function setMuted(m: boolean) {
  muted = m;
  mutedLoaded = true;
  try {
    window.localStorage.setItem(MUTE_KEY, m ? "1" : "0");
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}

/** Call from a user gesture (pointerdown/keydown) to unlock audio. */
export function ensureAudio() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
}

/** Shared context for the music module. */
export function getAudioContext(): AudioContext | null {
  return ctx;
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType,
  vol: number,
  slideTo?: number,
  delay = 0
) {
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur: number, vol: number, filterFreq: number, delay = 0) {
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t0);
}

// Coin chirps are throttled (word layouts can hit dozens of coins in one
// frame — unthrottled that stutters the game loop) and pitch up with streaks.
let lastCoinAt = 0;
let coinStreak = 0;

export function playSfx(event: GameEvent) {
  if (!ctx || getMutedSnapshot()) return;
  switch (event) {
    case "launch":
      tone(140, 0.45, "sawtooth", 0.16, 760);
      noise(0.35, 0.18, 1400);
      break;
    case "coin": {
      const now = performance.now();
      if (now - lastCoinAt < 70) return;
      coinStreak = now - lastCoinAt < 600 ? Math.min(coinStreak + 1, 12) : 0;
      lastCoinAt = now;
      const mul = Math.pow(2, coinStreak / 12); // climbs up to an octave
      tone(990 * mul, 0.07, "square", 0.08);
      tone(1480 * mul, 0.09, "square", 0.08, undefined, 0.055);
      break;
    }
    case "ring":
      tone(320, 0.22, "sawtooth", 0.12, 980);
      break;
    case "jet":
      tone(240, 0.32, "sawtooth", 0.14, 1400);
      noise(0.2, 0.08, 3000);
      break;
    case "sat":
      tone(880, 0.08, "triangle", 0.12);
      tone(1320, 0.08, "triangle", 0.12, undefined, 0.07);
      tone(1760, 0.14, "triangle", 0.12, undefined, 0.14);
      break;
    case "balloon":
      // Pop!
      noise(0.08, 0.24, 5000);
      tone(620, 0.14, "square", 0.1, 1100);
      break;
    case "bird":
      // Squawk squawk.
      tone(1500, 0.09, "square", 0.1, 900);
      tone(1400, 0.09, "square", 0.1, 850, 0.11);
      break;
    case "ufo":
      // Wobbly abduction beam.
      tone(700, 0.4, "sine", 0.12, 280);
      tone(940, 0.4, "sine", 0.08, 360, 0.05);
      break;
    case "dolphin":
      // Cheerful chirp.
      tone(900, 0.12, "sine", 0.14, 1500);
      tone(1200, 0.1, "sine", 0.1, 1700, 0.1);
      break;
    case "geyser":
      noise(0.35, 0.2, 1200);
      tone(180, 0.3, "sine", 0.1, 420);
      break;
    case "whale":
      // Deep whale song + mighty splash.
      tone(110, 0.5, "sine", 0.2, 320);
      tone(160, 0.45, "sine", 0.12, 90, 0.18);
      noise(0.5, 0.22, 900, 0.05);
      break;
    case "storm":
      // Thunder rumble.
      noise(0.5, 0.26, 320);
      tone(70, 0.4, "sine", 0.12, 40);
      break;
    case "candle":
      // Sad descending womp.
      tone(420, 0.32, "square", 0.12, 130);
      break;
    case "pump":
      // Number-go-up riser.
      tone(330, 0.22, "sawtooth", 0.13, 990);
      tone(660, 0.14, "triangle", 0.1, 1320, 0.12);
      break;
    case "wick":
      // God candle — ascending choir of profit.
      tone(523, 0.14, "triangle", 0.15, 1046);
      tone(784, 0.18, "triangle", 0.14, 1568, 0.1);
      tone(1046, 0.3, "triangle", 0.14, 2093, 0.2);
      noise(0.25, 0.1, 3600);
      break;
    case "perfect":
      tone(1180, 0.1, "triangle", 0.14);
      tone(1570, 0.16, "triangle", 0.14, undefined, 0.08);
      noise(0.12, 0.1, 4000);
      break;
    case "skip":
      noise(0.12, 0.12, 2200);
      break;
    case "bounce":
      tone(220, 0.12, "sine", 0.12, 130);
      noise(0.15, 0.1, 1600);
      break;
    case "splash":
      noise(0.4, 0.18, 1100);
      break;
    case "milestone":
      // Triumphant little fanfare.
      tone(523, 0.12, "triangle", 0.16);
      tone(659, 0.12, "triangle", 0.16, undefined, 0.1);
      tone(784, 0.2, "triangle", 0.18, undefined, 0.2);
      tone(1046, 0.3, "triangle", 0.16, undefined, 0.3);
      break;
    case "nearmiss":
      // Doppler whoosh.
      noise(0.22, 0.16, 2600);
      tone(900, 0.18, "sine", 0.08, 320);
      break;
  }
}
