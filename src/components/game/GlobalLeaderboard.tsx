"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchLeaderboard,
  fetchWinners,
  shortWallet,
  SCORES_EVENT,
  type CycleWinners,
  type Leaderboard,
} from "@/lib/api";

const MEDALS = ["🥇", "🥈", "🥉"];

function formatK(n: number): string {
  return n >= 1000 ? `${n / 1000}k` : String(n);
}

export function GlobalLeaderboard() {
  const [board, setBoard] = useState<Leaderboard | null>(null);
  const [winners, setWinners] = useState<CycleWinners[]>([]);
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const refresh = useCallback(() => {
    fetchLeaderboard().then((lb) => {
      setBoard(lb);
      setFailed(lb === null);
    });
    fetchWinners().then((w) => setWinners(w ?? []));
  }, []);

  useEffect(() => {
    refresh();
    const poll = setInterval(refresh, 60_000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    window.addEventListener(SCORES_EVENT, refresh);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
      window.removeEventListener(SCORES_EVENT, refresh);
    };
  }, [refresh]);

  const remaining = board ? Math.max(0, new Date(board.endsAt).getTime() - now) : 0;

  return (
    <div className="glass rounded-3xl p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-display text-xl sm:text-2xl font-bold text-[var(--ink)]">
          Global Leaderboard
        </h2>
        {board && (
          <span
            className="font-mono text-[10px] uppercase tracking-[0.18em] rounded-full px-2.5 py-1 bg-[var(--ball-yellow)]/70 text-[var(--ink)] tabular-nums"
            title="Time until this cycle's payouts lock"
          >
            resets in {formatCountdown(remaining)}
          </span>
        )}
      </div>

      {failed ? (
        <p className="mt-4 text-sm text-[var(--ink-soft)]">
          Leaderboard is waking up — give it a moment and it&rsquo;ll be here.
        </p>
      ) : !board ? (
        <p className="mt-4 text-sm text-[var(--ink-soft)]">Loading today&rsquo;s standings…</p>
      ) : board.top.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--ink-soft)]">
          Nobody has launched today. 100k $BBALL is sitting right there.
        </p>
      ) : (
        <ol className="mt-4 flex flex-col gap-1.5">
          {board.top.map((s, i) => (
            <li
              key={`${s.wallet}-${i}`}
              className={`flex items-center gap-3 rounded-2xl border px-3.5 py-2 ${
                i < 3
                  ? "bg-[var(--ball-yellow)]/25 border-[var(--ball-yellow)]/60"
                  : "bg-white/55 border-white/70"
              }`}
            >
              <span className="w-7 text-center font-mono text-sm font-bold text-[var(--ink-soft)]">
                {MEDALS[i] ?? i + 1}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block truncate text-sm font-medium text-[var(--ink)]">
                  {s.name}
                </span>
                <span className="block font-mono text-[10px] text-[var(--ink-mute)]">
                  {shortWallet(s.wallet)}
                </span>
              </span>
              {i < 3 && (
                <span className="font-mono text-[10px] font-bold rounded-full px-2 py-0.5 bg-[var(--ball-yellow)] text-[var(--ink)] whitespace-nowrap">
                  {formatK(board.payouts[i] ?? 0)} $BBALL
                </span>
              )}
              <span className="font-bold tabular-nums text-[var(--ink)]">{s.distance}m</span>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-4 text-xs leading-relaxed text-[var(--ink-mute)]">
        Top 3 when the 24h cycle ends (00:00 UTC) get{" "}
        <span className="font-semibold text-[var(--ink-soft)]">100k / 50k / 25k $BBALL</span>{" "}
        sent to their submitted wallet by the dev.
      </p>

      {winners.length > 0 && (
        <div className="mt-5 border-t border-white/60 pt-4">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-mute)]">
            previous winners
          </h3>
          <div className="mt-2 flex flex-col gap-2">
            {winners.map((c) => (
              <div key={c.cycleId} className="rounded-2xl bg-white/45 border border-white/60 px-3 py-2">
                <p className="font-mono text-[10px] text-[var(--ink-mute)]">{c.cycleId}</p>
                <div className="mt-1 flex flex-col gap-0.5">
                  {c.top.map((wn, i) => (
                    <p key={wn.wallet} className="text-xs text-[var(--ink-soft)] truncate">
                      {MEDALS[i]} <span className="font-medium text-[var(--ink)]">{wn.name}</span>{" "}
                      · {wn.distance}m ·{" "}
                      <span className="font-mono text-[10px]">{shortWallet(wn.wallet)}</span>
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatCountdown(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
