/**
 * Global daily weather — procedurally generated from the UTC date, so every
 * player worldwide gets identical waves and wind for the whole day, and it
 * reshuffles at 00:00 UTC (same clock as the daily cycle). No server needed:
 * the seed is the date itself.
 */

export type Weather = {
  /** ISO date this weather belongs to. */
  day: string;
  /** Wave amplitude in meters (deeper waves = deeper dips to aim for). */
  waveAmp: number;
  /** Wavelength factor — stretches or compresses the swell horizontally. */
  waveFreq: number;
  /** Constant horizontal wind acceleration (m/s²). +tail / -head. */
  wind: number;
  /** Human-readable summary for the HUD. */
  label: string;
};

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

function hashDay(day: string): number {
  let h = 2166136261;
  for (let i = 0; i < day.length; i++) {
    h ^= day.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function weatherFor(day: string): Weather {
  const r = rng(hashDay(day));
  const waveAmp = 0.55 + r() * 0.95; // 0.55–1.5 m
  const waveFreq = 0.7 + r() * 0.7; // 0.7–1.4
  const wind = (r() * 2 - 1) * 2.8; // ±2.8 m/s²

  const sea =
    waveAmp < 0.8 ? "calm seas" : waveAmp < 1.15 ? "rolling swell" : "heavy swell";
  const air =
    wind > 0.9 ? "tailwind" : wind < -0.9 ? "headwind" : "still air";
  return { day, waveAmp, waveFreq, wind, label: `${sea} · ${air}` };
}

/** Today's weather (UTC). Computed once per page load. */
export const GAME_WEATHER: Weather = weatherFor(new Date().toISOString().slice(0, 10));
