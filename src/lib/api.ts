/**
 * Client for the bball-api leaderboard server (Render).
 * Dev hits localhost; QA/preview + Prod use NEXT_PUBLIC_API_URL set in Vercel.
 */

// trim() guards against stray whitespace/newlines sneaking into the env value.
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "development"
    ? "http://localhost:4000"
    : "https://bball-1g63.onrender.com")
).trim();

/** Fired on window after a successful score submit so panels refresh. */
export const SCORES_EVENT = "bball:scores-updated";

/** Fired on window after an upgrade purchase so the game + shop refresh. */
export const UPGRADES_EVENT = "bball:upgrades-updated";

export type DistanceEntry = {
  name: string;
  wallet: string;
  distance: number;
  coins: number;
  skips: number;
  bestCombo: number;
};

export type CoinsEntry = {
  name: string;
  wallet: string;
  coins: number;
  runs: number;
  bestDistance: number;
};

export type Leaderboard = {
  distance: { cycleId: string; endsAt: string; payouts: number[]; top: DistanceEntry[] };
  coins: { cycleId: string; endsAt: string; payout: number; top: CoinsEntry[] };
};

export type Winners = {
  payouts: number[];
  coinsPayout: number;
  distance: {
    cycleId: string;
    paid: boolean;
    top: { name: string; wallet: string; distance: number }[];
  }[];
  coins: {
    cycleId: string;
    paid: boolean;
    winner: { name: string; wallet: string; coins: number };
  }[];
};

export type ScoreSubmission = {
  runToken: string;
  name: string;
  wallet: string;
  /** Device key — soft-claims the wallet for upgrade purchases. */
  playerKey?: string;
  distance: number;
  coins: number;
  skips: number;
  bestCombo: number;
};

export type UpgradeState = {
  cycleId: string;
  endsAt: string;
  levels: import("./upgrades").UpgradeLevels;
  balance: number;
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
): Promise<
  | { ok: true; rank: number; challengeBonus: number }
  | { ok: false; error: string }
> {
  try {
    const res = await fetch(`${API_URL}/api/scores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok) {
      window.dispatchEvent(new Event(SCORES_EVENT));
      return { ok: true, rank: data.rank, challengeBonus: data.challenge?.bonus ?? 0 };
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

/** Current upgrade levels + spendable coin balance for a wallet. */
export async function fetchUpgrades(wallet: string): Promise<UpgradeState | null> {
  try {
    const res = await fetch(
      `${API_URL}/api/upgrades?wallet=${encodeURIComponent(wallet.trim())}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.ok ? data : null;
  } catch {
    return null;
  }
}

/** Buy one level of an upgrade. Coins come off today's daily balance. */
export async function buyUpgrade(payload: {
  wallet: string;
  playerKey: string;
  upgrade: string;
}): Promise<{ ok: true; balance: number } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/api/upgrades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok) {
      window.dispatchEvent(new Event(UPGRADES_EVENT));
      return { ok: true, balance: data.balance };
    }
    return { ok: false, error: data?.error ?? `purchase failed (${res.status})` };
  } catch {
    return { ok: false, error: "network error — is the leaderboard reachable?" };
  }
}

export async function fetchWinners(): Promise<Winners | null> {
  try {
    const res = await fetch(`${API_URL}/api/winners`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
