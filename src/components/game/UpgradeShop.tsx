"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buyUpgrade,
  fetchUpgrades,
  isValidSolWallet,
  SCORES_EVENT,
  type UpgradeState,
} from "@/lib/api";
import { loadPlayer, loadPlayerKey } from "@/lib/player";
import { MAX_UPGRADE_LEVEL, UPGRADE_LIST, type UpgradeId } from "@/lib/upgrades";

/**
 * Daily upgrade shop. Coins earned on the 48h coin board are the currency —
 * spending them buys distance power for today but costs coin-board rank.
 */
export function UpgradeShop() {
  const [wallet, setWallet] = useState("");
  const [state, setState] = useState<UpgradeState | null>(null);
  const [busy, setBusy] = useState<UpgradeId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (w: string) => {
    if (!isValidSolWallet(w)) {
      setState(null);
      return;
    }
    setState(await fetchUpgrades(w));
  }, []);

  // Pick up the saved wallet and re-check after every submitted run.
  useEffect(() => {
    const sync = () => {
      const saved = loadPlayer().wallet;
      setWallet((prev) => prev || saved);
      void refresh(saved || loadPlayer().wallet);
    };
    sync();
    window.addEventListener(SCORES_EVENT, sync);
    return () => window.removeEventListener(SCORES_EVENT, sync);
  }, [refresh]);

  const buy = async (id: UpgradeId) => {
    if (!state || busy) return;
    setBusy(id);
    setError(null);
    const res = await buyUpgrade({ wallet, playerKey: loadPlayerKey(), upgrade: id });
    if (!res.ok) setError(res.error);
    await refresh(wallet);
    setBusy(null);
  };

  const walletOk = isValidSolWallet(wallet);

  return (
    <section className="glass rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-display text-2xl font-extrabold text-[var(--ink)]">
          Daily upgrades
        </h2>
        {state && (
          <p className="font-mono text-xs text-[var(--ink-soft)] tabular-nums">
            balance: <span className="font-bold text-[var(--ink)]">${state.balance}</span>
            {" · "}resets 00:00 UTC
          </p>
        )}
      </div>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        Spend the coins you collected on today&apos;s power — but careful: every coin spent
        comes <span className="font-semibold">off your coin-leaderboard total</span>. Fly far
        or stack coins, your call. Everyone&apos;s upgrades reset daily.
      </p>

      {!walletOk ? (
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="Solana wallet (same one you submit scores with)"
            spellCheck={false}
            className="flex-1 rounded-full border border-black/10 bg-white/80 px-4 py-2.5 text-sm font-mono text-[var(--ink)] placeholder:font-sans placeholder:text-[var(--ink-mute)] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => refresh(wallet)}
            className="btn-ghost justify-center"
          >
            Load
          </button>
        </div>
      ) : !state ? (
        <p className="mt-4 text-sm text-[var(--ink-mute)]">
          Submit a run with your wallet to start earning coins, then shop here.
        </p>
      ) : (
        <>
          {error && (
            <p className="mt-3 text-xs font-medium text-[var(--ball-red)]">{error}</p>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {UPGRADE_LIST.map((u) => {
              const level = state.levels[u.id];
              const maxed = level >= MAX_UPGRADE_LEVEL;
              const cost = maxed ? null : u.costs[level];
              const affordable = cost !== null && state.balance >= cost;
              return (
                <div
                  key={u.id}
                  className="rounded-2xl bg-white/55 border border-white/70 p-3 flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl" aria-hidden>
                      {u.emoji}
                    </span>
                    <p className="font-bold text-sm text-[var(--ink)]">{u.name}</p>
                  </div>
                  <p className="text-xs text-[var(--ink-soft)] leading-snug flex-1">
                    {u.desc}
                  </p>
                  <div className="flex gap-1" aria-label={`level ${level} of ${MAX_UPGRADE_LEVEL}`}>
                    {Array.from({ length: MAX_UPGRADE_LEVEL }, (_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${
                          i < level ? "bg-[var(--ball-orange)]" : "bg-black/10"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={maxed || !affordable || busy !== null}
                    onClick={() => buy(u.id)}
                    className="btn-pop justify-center !px-3 !py-1.5 text-xs disabled:opacity-50"
                  >
                    {busy === u.id
                      ? "Buying…"
                      : maxed
                      ? "Maxed"
                      : `Buy · $${cost}`}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
