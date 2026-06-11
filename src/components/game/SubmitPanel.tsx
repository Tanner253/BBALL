"use client";

import { useState } from "react";
import { isValidSolWallet, submitScore } from "@/lib/api";
import { loadPlayer, loadPlayerKey, savePlayer } from "@/lib/player";

export type RunResult = {
  distance: number;
  coins: number;
  skips: number;
  bestCombo: number;
  maxAlt: number;
  maxSpeed: number;
};

type Status =
  | { kind: "form"; error?: string }
  | { kind: "submitting" }
  | { kind: "done"; rank: number; challengeBonus: number };

export function SubmitPanel({
  result,
  runToken,
  onRetry,
}: {
  result: RunResult;
  runToken: string | null;
  onRetry: () => void;
}) {
  // Lazy init: this panel only mounts client-side, after a run ends.
  const [player, setPlayer] = useState(() => loadPlayer());
  const [status, setStatus] = useState<Status>({ kind: "form" });

  const submit = async () => {
    const name = player.name.trim().slice(0, 18);
    const wallet = player.wallet.trim();
    if (!name) return setStatus({ kind: "form", error: "Enter a name." });
    if (!isValidSolWallet(wallet)) {
      return setStatus({
        kind: "form",
        error: "Enter a valid Solana wallet — that's where $BBALL rewards go.",
      });
    }
    if (!runToken) {
      return setStatus({
        kind: "form",
        error: "Couldn't verify this run with the server. Check your connection and launch again.",
      });
    }
    savePlayer(name, wallet);
    setStatus({ kind: "submitting" });
    const res = await submitScore({
      runToken,
      name,
      wallet,
      playerKey: loadPlayerKey() || undefined,
      ...statsOf(result),
    });
    if (res.ok) {
      setStatus({ kind: "done", rank: res.rank, challengeBonus: res.challengeBonus });
    } else {
      setStatus({ kind: "form", error: res.error });
    }
  };

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center p-4 meme-preview-fade">
      <div className="glass-strong rounded-3xl px-6 py-6 w-full max-w-md text-center shadow-[0_24px_60px_-20px_rgba(8,40,80,0.5)]">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--ink-mute)]">
          flight over
        </p>
        <p className="mt-1 text-display text-5xl font-extrabold text-[var(--ink)] tabular-nums">
          {result.distance}m
        </p>

        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          <Stat label="coins" value={`$${result.coins}`} />
          <Stat label="skips" value={String(result.skips)} />
          <Stat label="combo" value={`×${result.bestCombo}`} />
          <Stat label="top speed" value={String(result.maxSpeed)} sub="km/h" />
        </div>

        {status.kind !== "done" ? (
          <div className="mt-5 flex flex-col gap-2">
            <input
              value={player.name}
              onChange={(e) => setPlayer((p) => ({ ...p, name: e.target.value }))}
              maxLength={18}
              placeholder="your name"
              className="w-full rounded-full border border-black/10 bg-white/80 px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-mute)] focus:outline-none"
            />
            <input
              value={player.wallet}
              onChange={(e) => setPlayer((p) => ({ ...p, wallet: e.target.value }))}
              placeholder="Solana wallet (for $BBALL rewards)"
              spellCheck={false}
              className="w-full rounded-full border border-black/10 bg-white/80 px-4 py-2.5 text-sm font-mono text-[var(--ink)] placeholder:font-sans placeholder:text-[var(--ink-mute)] focus:outline-none"
            />
            {status.kind === "form" && status.error && (
              <p className="text-xs font-medium text-[var(--ball-red)]">{status.error}</p>
            )}
            <button
              type="button"
              onClick={submit}
              disabled={status.kind === "submitting"}
              className="btn-pop justify-center disabled:opacity-60"
            >
              {status.kind === "submitting" ? "Submitting…" : "Submit to global leaderboard"}
            </button>
          </div>
        ) : (
          <div className="mt-5">
            <p className="text-sm font-medium text-[var(--ink)]">
              {status.rank <= 3
                ? `#${status.rank} globally right now — that's payout territory! 🏆`
                : `#${status.rank} on today's global leaderboard.`}
            </p>
            {status.challengeBonus > 0 && (
              <p className="mt-1 text-xs font-bold text-[#2c9c5e]">
                🎯 Daily challenge complete — +{status.challengeBonus} bonus coins banked!
              </p>
            )}
            <p className="mt-1 text-xs text-[var(--ink-soft)]">
              Hold a top-3 spot when the cycle ends and $BBALL lands in your wallet.
            </p>
          </div>
        )}

        <div className="mt-4 flex justify-center">
          <button type="button" onClick={onRetry} className="btn-ghost">
            Launch again
          </button>
        </div>
        <p className="mt-3 text-[10px] text-[var(--ink-mute)]">
          Distance: top 3 daily earn 100k / 50k / 25k $BBALL. Coins: top collector every 48h
          gets paid too. Manual payouts by the dev.
        </p>
      </div>
    </div>
  );
}

function statsOf(r: RunResult) {
  return { distance: r.distance, coins: r.coins, skips: r.skips, bestCombo: r.bestCombo };
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white/55 border border-white/70 px-1 py-2">
      <p className="text-base font-bold text-[var(--ink)] tabular-nums leading-tight">
        {value}
        {sub && <span className="text-[9px] font-medium text-[var(--ink-mute)]"> {sub}</span>}
      </p>
      <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--ink-mute)]">
        {label}
      </p>
    </div>
  );
}
