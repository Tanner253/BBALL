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

type Tab = "distance" | "coins" | "payouts";

export function GlobalLeaderboard() {
  const [board, setBoard] = useState<Leaderboard | null>(null);
  const [winners, setWinners] = useState<Winners | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<Tab>("distance");
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

  const active = board && tab !== "payouts" ? board[tab] : null;
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
      <div className="mt-3 flex gap-1.5 flex-wrap">
        <TabButton active={tab === "distance"} onClick={() => setTab("distance")}>
          🚀 Distance
        </TabButton>
        <TabButton active={tab === "coins"} onClick={() => setTab("coins")}>
          💰 Coins
        </TabButton>
        <TabButton active={tab === "payouts"} onClick={() => setTab("payouts")}>
          🏆 Payouts
        </TabButton>
      </div>

      {/* Fixed-height scroll area so the panel never stretches the page. */}
      <div className="mt-4 max-h-[320px] overflow-y-auto overscroll-contain pr-1">
        {failed ? (
          <p className="text-sm text-[var(--ink-soft)]">
            Leaderboard is waking up — give it a moment and it&rsquo;ll be here.
          </p>
        ) : tab === "payouts" ? (
          <PayoutsList winners={winners} />
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
            Top 3 distance when the daily cycle ends (00:00 UTC) get{" "}
            <span className="font-semibold text-[var(--ink-soft)]">100k / 50k / 25k $BBALL</span>.
            Paid manually by the dev to your submitted wallet.
          </>
        ) : tab === "coins" ? (
          <>
            Most <span className="font-semibold text-[var(--ink-soft)]">net coins</span>{" "}
            (collected − spent on upgrades) across the 48h cycle wins{" "}
            <span className="font-semibold text-[var(--ink-soft)]">
              {board ? formatK(board.coins.payout) : "—"} $BBALL
            </span>{" "}
            (one winner every other day). Paid manually by the dev.
          </>
        ) : (
          <>
            Finished cycles awaiting manual payout —{" "}
            <span className="font-semibold text-[var(--ink-soft)]">tap a wallet to copy it</span>.
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

/** Wallet chip that copies the full address on click. */
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
  const { top, payouts } = board.distance;
  if (top.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-soft)]">
        Nobody has launched today. 100k $BBALL is sitting right there.
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
      <p className="text-sm text-[var(--ink-soft)]">
        No coins collected this cycle yet. Free {formatK(payout)} $BBALL for the first grinder.
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
        <span className="block">
          <WalletChip wallet={wallet} />
          {sub && (
            <span className="font-mono text-[10px] text-[var(--ink-mute)]"> · {sub}</span>
          )}
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

/** Past cycle winners awaiting their manual $BBALL payout. */
function PayoutsList({ winners }: { winners: Winners | null }) {
  if (!winners) {
    return <p className="text-sm text-[var(--ink-soft)]">Loading payout queue…</p>;
  }
  if (winners.distance.length === 0 && winners.coins.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-soft)]">
        No finished cycles yet — winners land here when the clock rolls over.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {winners.distance.map((c) => (
        <div
          key={`d-${c.cycleId}`}
          className="rounded-2xl bg-white/45 border border-white/60 px-3 py-2"
        >
          <p className="font-mono text-[10px] text-[var(--ink-mute)]">
            🚀 {c.cycleId} · distance
          </p>
          <div className="mt-1 flex flex-col gap-1">
            {c.top.map((wn, i) => (
              <div key={wn.wallet} className="flex items-center gap-2 text-xs min-w-0">
                <span aria-hidden>{MEDALS[i]}</span>
                <span className="font-medium text-[var(--ink)] truncate">{wn.name}</span>
                <span className="text-[var(--ink-soft)] whitespace-nowrap">{wn.distance}m</span>
                <span className="font-mono text-[10px] font-bold text-[var(--ink-soft)] whitespace-nowrap">
                  {formatK(winners.payouts[i] ?? 0)} $BBALL →
                </span>
                <WalletChip wallet={wn.wallet} />
              </div>
            ))}
          </div>
        </div>
      ))}
      {winners.coins.map((c) => (
        <div
          key={`c-${c.cycleId}`}
          className="rounded-2xl bg-white/45 border border-white/60 px-3 py-2"
        >
          <p className="font-mono text-[10px] text-[var(--ink-mute)]">💰 {c.cycleId} · coins</p>
          <div className="mt-1 flex items-center gap-2 text-xs min-w-0">
            <span aria-hidden>🥇</span>
            <span className="font-medium text-[var(--ink)] truncate">{c.winner.name}</span>
            <span className="text-[var(--ink-soft)] whitespace-nowrap">${c.winner.coins}</span>
            <span className="font-mono text-[10px] font-bold text-[var(--ink-soft)] whitespace-nowrap">
              {formatK(winners.coinsPayout)} $BBALL →
            </span>
            <WalletChip wallet={c.winner.wallet} />
          </div>
        </div>
      ))}
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
