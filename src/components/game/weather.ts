/**
 * Global evolving weather — deterministic from the UTC clock, so every player
 * worldwide rides the same seas at the same moment. No server needed: the
 * seed is absolute time itself.
 *
 * Time is divided into 1-hour slots; each slot rolls its own conditions
 * (including a storminess level) and the live weather smoothly blends from
 * one slot to the next. Storms pump up wave height and wind.
 */

export type Weather = {
  /** Wave amplitude in meters (deeper waves = deeper dips to aim for). */
  waveAmp: number;
  /** Wavelength factor — stretches or compresses the swell horizontally. */
  waveFreq: number;
  /** Visual wind (rain slant only) — weather NEVER pushes the ball. */
  wind: number;
  /** Storm intensity 0..1 — drives sky darkening, rain and the label. */
  storm: number;
  /** Human-readable summary for the HUD. */
  label: string;
};

const SLOT_MS = 60 * 60 * 1000;

/** Deterministic PRNG (mulberry32). */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Slot = { waveAmp: number; waveFreq: number; wind: number; storm: number };

function slotWeather(slot: number): Slot {
  const r = rng((slot * 2654435761) >>> 0);
  // Skewed toward calm — full storms are an event, not the norm.
  const storm = Math.pow(r(), 2.2);
  return {
    waveAmp: 0.5 + r() * 0.6 + storm * 1.3, // 0.5–1.1 calm, up to ~2.4 in a storm
    waveFreq: 0.7 + r() * 0.7, // 0.7–1.4
    wind: (r() * 2 - 1) * (1.2 + storm * 2.6), // calm ±1.2, storm up to ±3.8
    storm,
  };
}

function smoothstep(f: number): number {
  return f * f * (3 - 2 * f);
}

function describe(w: Slot): string {
  return w.storm > 0.62
    ? "⛈ STORM"
    : w.waveAmp < 0.8
    ? "calm seas"
    : w.waveAmp < 1.3
    ? "rolling swell"
    : "heavy swell";
}

export function weatherAt(ms: number): Weather {
  const slot = Math.floor(ms / SLOT_MS);
  const f = smoothstep((ms - slot * SLOT_MS) / SLOT_MS);
  const a = slotWeather(slot);
  const b = slotWeather(slot + 1);
  const mixed: Slot = {
    waveAmp: a.waveAmp + (b.waveAmp - a.waveAmp) * f,
    waveFreq: a.waveFreq + (b.waveFreq - a.waveFreq) * f,
    wind: a.wind + (b.wind - a.wind) * f,
    storm: a.storm + (b.storm - a.storm) * f,
  };
  return { ...mixed, label: describe(mixed) };
}

/**
 * Live weather, mutated in place by updateWeather() once per frame so the
 * hot wave-height path reads plain fields with zero allocation.
 */
export const GAME_WEATHER: Weather = weatherAt(Date.now());

let lastUpdate = 0;

/** Refresh GAME_WEATHER from the wall clock (throttled to 1s). */
export function updateWeather(now: number = Date.now()) {
  if (now - lastUpdate < 1000) return;
  lastUpdate = now;
  Object.assign(GAME_WEATHER, weatherAt(now));
}
