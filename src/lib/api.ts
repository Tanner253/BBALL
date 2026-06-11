/**
 * Client for the bball-api leaderboard server (Render).
 * Dev hits localhost; QA/preview + Prod use NEXT_PUBLIC_API_URL set in Vercel.
 */

// trim() guards against stray whitespace/newlines sneaking into the env value.
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "development"
    ? "http://localhost:4000"
    : "https://bball-api.onrender.com")
).trim();

/** Fired on window after a successful score submit so panels refresh. */
export const SCORES_EVENT = "bball:scores-updated";

export type LeaderboardEntry = {
  name: string;
  wallet: string;
  distance: number;
  coins: number;
  skips: number;
  bestCombo: number;
};

export type Leaderboard = {
  cycleId: string;
  endsAt: string;
  payouts: number[];
  top: LeaderboardEntry[];
};

export type CycleWinners = {
  cycleId: string;
  top: { name: string; wallet: string; distance: number }[];
};

export type ScoreSubmission = {
  runToken: string;
  name: string;
  wallet: string;
  distance: number;
  coins: number;
  skips: number;
  bestCombo: number;
};

const SOL_WALLET_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isValidSolWallet(wallet: string): boolean {
  return SOL_WALLET_RE.test(wallet.trim());
}

export function shortWallet(wallet: string): string {
  return wallet.length > 10 ? `${wallet.slice(0, 4)}…${wallet.slice(-4)}` : wallet;
}

/** Issued at launch time; consumed on submit (one-time, anti-replay). */
export async function startRun(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/api/runs`, { method: "POST" });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.runToken === "string" ? data.runToken : null;
  } catch {
    return null;
  }
}

export async function submitScore(
  payload: ScoreSubmission
): Promise<{ ok: true; rank: number } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/api/scores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok) {
      window.dispatchEvent(new Event(SCORES_EVENT));
      return { ok: true, rank: data.rank };
    }
    return { ok: false, error: data?.error ?? `submit failed (${res.status})` };
  } catch {
    return { ok: false, error: "network error — is the leaderboard reachable?" };
  }
}

export async function fetchLeaderboard(): Promise<Leaderboard | null> {
  try {
    const res = await fetch(`${API_URL}/api/leaderboard`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchWinners(): Promise<CycleWinners[] | null> {
  try {
    const res = await fetch(`${API_URL}/api/winners`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data?.cycles) ? data.cycles : null;
  } catch {
    return null;
  }
}
