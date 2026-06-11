"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchLeaderboard,
  fetchWinners,
  shortWallet,
  SCORES_EVENT,
  type Leaderboard,
  type Winners,
} from "@/lib/api";

const MEDALS = ["🥇", "🥈", "🥉"];

function formatK(n: number): string {
  return n >= 1000 ? `${n / 1000}k` : String(n);
}

export function GlobalLeaderboard() {
  const [board, setBoard] = useState<Leaderboard | null>(null);
  const [winners, setWinners] = useState<Winners | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<"distance" | "coins">("distance");
  const [now, setNow] = useState(() => Date.now());

  const refresh = useCallback(() => {
    fetchLeaderboard().then((lb) => {
      setBoard(lb);
      setFailed(lb === null);
    });
    fetchWinners().then(setWinners);
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

  const active = board ? board[tab] : null;
  const remaining = active ? Math.max(0, new Date(active.endsAt).getTime() - now) : 0;

  return (
    <div className="glass rounded-3xl p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-display text-xl sm:text-2xl font-bold text-[var(--ink)]">
          Leaderboards
        </h2>
        {active && (
          <span
            className="font-mono text-[10px] uppercase tracking-[0.18em] rounded-full px-2.5 py-1 bg-[var(--ball-yellow)]/70 text-[var(--ink)] tabular-nums"
            title="Time until payouts lock"
          >
            resets in {formatCountdown(remaining)}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-3 flex gap-1.5">
        <TabButton active={tab === "distance"} onClick={() => setTab("distance")}>
          🚀 Distance · daily
        </TabButton>
        <TabButton active={tab === "coins"} onClick={() => setTab("coins")}>
          💰 Coins · 48h
        </TabButton>
      </div>

      {failed ? (
        <p className="mt-4 text-sm text-[var(--ink-soft)]">
          Leaderboard is waking up — give it a moment and it&rsquo;ll be here.
        </p>
      ) : !board ? (
        <p className="mt-4 text-sm text-[var(--ink-soft)]">Loading standings…</p>
      ) : tab === "distance" ? (
        <DistanceList board={board} />
      ) : (
        <CoinsList board={board} />
      )}

      <p className="mt-4 text-xs leading-relaxed text-[var(--ink-mute)]">
        {tab === "distance" ? (
          <>
            Top 3 distance when the daily cycle ends (00:00 UTC) get{" "}
            <span className="font-semibold text-[var(--ink-soft)]">100k / 50k / 25k $BBALL</span>.
          </>
        ) : (
          <>
            Most <span className="font-semibold text-[var(--ink-soft)]">total coins</span> collected
            across all runs in the 48h cycle wins{" "}
            <span className="font-semibold text-[var(--ink-soft)]">
              {board ? formatK(board.coins.payout) : "—"} $BBALL
            </span>{" "}
            (one winner every other day).
          </>
        )}{" "}
        Paid manually by the dev to your submitted wallet.
      </p>

      <PastWinners winners={winners} />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "bg-[var(--ink)] text-white"
          : "bg-white/55 text-[var(--ink-soft)] hover:bg-white/80"
      }`}
    >
      {children}
    </button>
  );
}

function DistanceList({ board }: { board: Leaderboard }) {
  const { top, payouts } = board.distance;
  if (top.length === 0) {
    return (
      <p className="mt-4 text-sm text-[var(--ink-soft)]">
        Nobody has launched today. 100k $BBALL is sitting right there.
      </p>
    );
  }
  return (
    <ol className="mt-4 flex flex-col gap-1.5">
      {top.map((s, i) => (
        <Row
          key={s.wallet}
          rank={i}
          name={s.name}
          wallet={s.wallet}
          badge={i < 3 ? `${formatK(payouts[i] ?? 0)} $BBALL` : undefined}
          value={`${s.distance}m`}
        />
      ))}
    </ol>
  );
}

function CoinsList({ board }: { board: Leaderboard }) {
  const { top, payout } = board.coins;
  if (top.length === 0) {
    return (
      <p className="mt-4 text-sm text-[var(--ink-soft)]">
        No coins collected this cycle yet. Free {formatK(payout)} $BBALL for the first grinder.
      </p>
    );
  }
  return (
    <ol className="mt-4 flex flex-col gap-1.5">
      {top.map((s, i) => (
        <Row
          key={s.wallet}
          rank={i}
          name={s.name}
          wallet={s.wallet}
          sub={`${s.runs} runs`}
          badge={i === 0 ? `${formatK(payout)} $BBALL` : undefined}
          value={`$${s.coins}`}
        />
      ))}
    </ol>
  );
}

function Row({
  rank,
  name,
  wallet,
  value,
  sub,
  badge,
}: {
  rank: number;
  name: string;
  wallet: string;
  value: string;
  sub?: string;
  badge?: string;
}) {
  return (
    <li
      className={`flex items-center gap-3 rounded-2xl border px-3.5 py-2 ${
        badge
          ? "bg-[var(--ball-yellow)]/25 border-[var(--ball-yellow)]/60"
          : "bg-white/55 border-white/70"
      }`}
    >
      <span className="w-7 text-center font-mono text-sm font-bold text-[var(--ink-soft)]">
        {MEDALS[rank] ?? rank + 1}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block truncate text-sm font-medium text-[var(--ink)]">{name}</span>
        <span className="block font-mono text-[10px] text-[var(--ink-mute)]">
          {shortWallet(wallet)}
          {sub ? ` · ${sub}` : ""}
        </span>
      </span>
      {badge && (
        <span className="font-mono text-[10px] font-bold rounded-full px-2 py-0.5 bg-[var(--ball-yellow)] text-[var(--ink)] whitespace-nowrap">
          {badge}
        </span>
      )}
      <span className="font-bold tabular-nums text-[var(--ink)]">{value}</span>
    </li>
  );
}

function PastWinners({ winners }: { winners: Winners | null }) {
  if (!winners || (winners.distance.length === 0 && winners.coins.length === 0)) return null;
  return (
    <div className="mt-5 border-t border-white/60 pt-4">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-mute)]">
        previous winners
      </h3>
      <div className="mt-2 flex flex-col gap-2">
        {winners.distance.map((c) => (
          <div key={`d-${c.cycleId}`} className="rounded-2xl bg-white/45 border border-white/60 px-3 py-2">
            <p className="font-mono text-[10px] text-[var(--ink-mute)]">🚀 {c.cycleId} · distance</p>
            <div className="mt-1 flex flex-col gap-0.5">
              {c.top.map((wn, i) => (
                <p key={wn.wallet} className="text-xs text-[var(--ink-soft)] truncate">
                  {MEDALS[i]} <span className="font-medium text-[var(--ink)]">{wn.name}</span> ·{" "}
                  {wn.distance}m ·{" "}
                  <span className="font-mono text-[10px]">{shortWallet(wn.wallet)}</span>
                </p>
              ))}
            </div>
          </div>
        ))}
        {winners.coins.map((c) => (
          <div key={`c-${c.cycleId}`} className="rounded-2xl bg-white/45 border border-white/60 px-3 py-2">
            <p className="font-mono text-[10px] text-[var(--ink-mute)]">💰 {c.cycleId} · coins</p>
            <p className="mt-1 text-xs text-[var(--ink-soft)] truncate">
              🥇 <span className="font-medium text-[var(--ink)]">{c.winner.name}</span> · $
              {c.winner.coins} ·{" "}
              <span className="font-mono text-[10px]">{shortWallet(c.winner.wallet)}</span>
            </p>
          </div>
        ))}
      </div>
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
