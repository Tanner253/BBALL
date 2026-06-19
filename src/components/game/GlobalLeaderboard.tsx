"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchLeaderboard,
  shortWallet,
  SCORES_EVENT,
  type Leaderboard,
} from "@/lib/api";

const MEDALS = ["🥇", "🥈", "🥉"];

type Tab = "distance" | "coins";

export function GlobalLeaderboard() {
  const [board, setBoard] = useState<Leaderboard | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<Tab>("distance");
  const [now, setNow] = useState(() => Date.now());

  const refresh = useCallback(() => {
    fetchLeaderboard().then((lb) => {
      setBoard(lb);
      setFailed(lb === null);
    });
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
            title="Time until this cycle resets"
          >
            resets in {formatCountdown(remaining)}
          </span>
        )}
      </div>

      <div className="mt-3 flex gap-1.5 flex-wrap">
        <TabButton active={tab === "distance"} onClick={() => setTab("distance")}>
          🚀 Distance
        </TabButton>
        <TabButton active={tab === "coins"} onClick={() => setTab("coins")}>
          💰 Coins
        </TabButton>
      </div>

      <div className="mt-4 max-h-[320px] overflow-y-auto overscroll-contain pr-1">
        {failed ? (
          <p className="text-sm text-[var(--ink-soft)]">
            Leaderboard is waking up — give it a moment and it&rsquo;ll be here.
          </p>
        ) : !board ? (
          <p className="text-sm text-[var(--ink-soft)]">Loading standings…</p>
        ) : tab === "distance" ? (
          <DistanceList board={board} />
        ) : (
          <CoinsList board={board} />
        )}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-[var(--ink-mute)]">
        {tab === "distance" ? (
          <>
            Best single run per wallet. Board resets daily at{" "}
            <span className="font-semibold text-[var(--ink-soft)]">00:00 UTC</span>.
          </>
        ) : (
          <>
            Most <span className="font-semibold text-[var(--ink-soft)]">net coins</span>{" "}
            (collected − spent on upgrades) across the 48h cycle. One board, resets every
            other day.
          </>
        )}
      </p>
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

function WalletChip({ wallet }: { wallet: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(wallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard unavailable — nothing sensible to do
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy ${wallet}`}
      className={`font-mono text-[10px] transition-colors cursor-pointer ${
        copied
          ? "text-[var(--ball-green,#2c9c5e)] font-bold"
          : "text-[var(--ink-mute)] hover:text-[var(--ink)] underline decoration-dotted underline-offset-2"
      }`}
    >
      {copied ? "copied!" : shortWallet(wallet)}
    </button>
  );
}

function DistanceList({ board }: { board: Leaderboard }) {
  const { top } = board.distance;
  if (top.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-soft)]">
        Nobody has launched today. The board is wide open.
      </p>
    );
  }
  return (
    <ol className="flex flex-col gap-1.5">
      {top.map((s, i) => (
        <Row
          key={s.wallet}
          rank={i}
          name={s.name}
          wallet={s.wallet}
          highlight={i < 3}
          value={`${s.distance.toLocaleString("en-US")}m`}
        />
      ))}
    </ol>
  );
}

function CoinsList({ board }: { board: Leaderboard }) {
  const { top } = board.coins;
  if (top.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-soft)]">
        No coins collected this cycle yet. First one on the board wins bragging rights.
      </p>
    );
  }
  return (
    <ol className="flex flex-col gap-1.5">
      {top.map((s, i) => (
        <Row
          key={s.wallet}
          rank={i}
          name={s.name}
          wallet={s.wallet}
          sub={`${s.runs} runs`}
          highlight={i === 0}
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
  highlight,
}: {
  rank: number;
  name: string;
  wallet: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <li
      className={`flex items-center gap-3 rounded-2xl border px-3.5 py-2 ${
        highlight
          ? "bg-[var(--ball-yellow)]/25 border-[var(--ball-yellow)]/60"
          : "bg-white/55 border-white/70"
      }`}
    >
      <span className="w-7 text-center font-mono text-sm font-bold text-[var(--ink-soft)]">
        {MEDALS[rank] ?? rank + 1}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block truncate text-sm font-medium text-[var(--ink)]">{name}</span>
        <span className="block">
          <WalletChip wallet={wallet} />
          {sub && (
            <span className="font-mono text-[10px] text-[var(--ink-mute)]"> · {sub}</span>
          )}
        </span>
      </span>
      <span className="font-bold tabular-nums text-[var(--ink)]">{value}</span>
    </li>
  );
}

function formatCountdown(ms: number): string {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const hms = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return d > 0 ? `${d}d ${hms}` : hms;
}
