/**
 * Daily challenge — client mirror of server/src/lib.js CHALLENGES (server is
 * the source of truth for the bonus; keep in sync). Deterministic from the
 * UTC date, so everyone gets the same challenge and it rotates at 00:00 UTC.
 */

export const CHALLENGE_BONUS = 25;

export type Challenge = {
  id: string;
  text: string;
  stat: "coins" | "skips" | "bestCombo" | "distance";
  min: number;
};

export const CHALLENGES: Challenge[] = [
  { id: "coins30", text: "Collect 30+ coins in one run", stat: "coins", min: 30 },
  { id: "skips15", text: "Land 15+ skips in one run", stat: "skips", min: 15 },
  { id: "combo5", text: "Chain a 5+ perfect-skip combo", stat: "bestCombo", min: 5 },
  { id: "dist800", text: "Fly 800m+ in one run", stat: "distance", min: 800 },
];

/** FNV-1a — must match server/src/lib.js hashDay. */
function hashDay(day: string): number {
  let h = 2166136261;
  for (let i = 0; i < day.length; i++) {
    h ^= day.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function challengeFor(day: string): Challenge {
  return CHALLENGES[hashDay(`${day}:challenge`) % CHALLENGES.length];
}

/** Today's challenge (UTC), evaluated client-side at load. */
export function todayChallenge(): Challenge {
  return challengeFor(new Date().toISOString().slice(0, 10));
}
