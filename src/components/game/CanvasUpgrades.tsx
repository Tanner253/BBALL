"use client";

import { useEffect, useState } from "react";
import { MAX_UPGRADE_LEVEL, UPGRADE_LIST, type UpgradeId } from "@/lib/upgrades";
import { useUpgrades } from "./useUpgrades";

/**
 * Upgrade panel on the canvas, shown before launching. Expanded by default
 * on desktop; collapsed behind a button on phones so it never buries the ball.
 */
export function CanvasUpgrades() {
  const { state, busy, error, buy } = useUpgrades();
  const [open, setOpen] = useState(false);

  // Desktop starts expanded; phones start collapsed.
  useEffect(() => {
    setOpen(window.matchMedia("(min-width: 768px)").matches);
  }, []);

  // No wallet registered yet — point new players at the shop instead of
  // hiding it (mobile players especially would never discover it).
  if (!state) {
    return (
      <div className="glass absolute left-3 top-[128px] sm:left-4 sm:top-[140px] rounded-2xl px-3 py-2 max-w-[190px] pointer-events-none opacity-80">
        <p className="text-[11px] font-bold text-[var(--ink)] leading-none">🛠 Upgrades 🔒</p>
        <p className="mt-1 text-[9px] text-[var(--ink-soft)] leading-tight">
          Submit a run with your Solana wallet to unlock the daily coin shop.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="glass absolute left-3 top-[128px] sm:left-4 sm:top-[140px] rounded-2xl px-3 py-2 text-xs font-bold text-[var(--ink)] hover:scale-105 active:scale-95 transition-transform"
      >
        🛠 Upgrades <span className="font-mono text-[10px]">(${state.balance})</span>
      </button>
    );
  }

  return (
    <div className="absolute left-3 top-[128px] bottom-3 sm:left-4 sm:top-[140px] w-[240px] pointer-events-none">
      <div className="glass rounded-2xl p-3 max-h-full overflow-y-auto pointer-events-auto">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--ink-soft)]">
            daily upgrades
          </p>
          <span className="flex items-baseline gap-2">
            <span className="font-mono text-[10px] font-bold text-[var(--ink)] tabular-nums">
              ${state.balance}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Collapse upgrades"
              className="font-mono text-[10px] text-[var(--ink-mute)] hover:text-[var(--ink)] md:hidden"
            >
              ✕
            </button>
          </span>
        </div>
        {error && (
          <p className="mt-1 text-[10px] font-medium text-[var(--ball-red)] leading-tight">
            {error}
          </p>
        )}
        <div className="mt-2 flex flex-col gap-1.5">
          {UPGRADE_LIST.map((u) => {
            const level = state.levels[u.id] ?? 0;
            const maxed = level >= MAX_UPGRADE_LEVEL;
            const cost = maxed ? null : u.costs[level];
            const affordable = cost !== null && state.balance >= cost;
            return (
              <div
                key={u.id}
                className="rounded-xl bg-white/55 border border-white/70 px-2 py-1.5"
                title={u.desc}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm leading-none" aria-hidden>
                    {u.emoji}
                  </span>
                  <span className="flex-1 text-[11px] font-bold text-[var(--ink)] leading-none">
                    {u.name}
                  </span>
                  <BuyButton
                    id={u.id}
                    maxed={maxed}
                    cost={cost}
                    affordable={affordable}
                    busy={busy}
                    onBuy={buy}
                  />
                </div>
                <p className="mt-1 text-[9px] text-[var(--ink-soft)] leading-tight">
                  {u.desc}
                </p>
                <div className="mt-1 flex gap-0.5">
                  {Array.from({ length: MAX_UPGRADE_LEVEL }, (_, i) => (
                    <span
                      key={i}
                      className={`h-1 flex-1 rounded-full ${
                        i < level ? "bg-[var(--ball-orange)]" : "bg-black/10"
                      }`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-1.5 text-[8px] text-[var(--ink-mute)] leading-tight">
          Balance = today&apos;s coins. Spending also nets off your 48h coin board.
          Everything resets 00:00 UTC.
        </p>
      </div>
    </div>
  );
}

function BuyButton({
  id,
  maxed,
  cost,
  affordable,
  busy,
  onBuy,
}: {
  id: UpgradeId;
  maxed: boolean;
  cost: number | null;
  affordable: boolean;
  busy: UpgradeId | null;
  onBuy: (id: UpgradeId) => void;
}) {
  return (
    <button
      type="button"
      disabled={maxed || !affordable || busy !== null}
      onClick={() => onBuy(id)}
      className={`rounded-full px-2 py-0.5 text-[9px] font-bold tabular-nums transition-colors ${
        maxed
          ? "bg-black/10 text-[var(--ink-mute)]"
          : affordable
          ? "bg-[var(--ball-orange)] text-white hover:brightness-105"
          : "bg-black/10 text-[var(--ink-mute)]"
      } disabled:cursor-not-allowed`}
    >
      {busy === id ? "…" : maxed ? "MAX" : `$${cost}`}
    </button>
  );
}
