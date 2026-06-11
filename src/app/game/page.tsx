import type { Metadata } from "next";
import { LaunchGame } from "@/components/game/LaunchGame";
import { GlobalLeaderboard } from "@/components/game/GlobalLeaderboard";

export const metadata: Metadata = {
  title: "Beachball Launch — $BBALL",
  description:
    "Dunk the beachball, time the release, skip it across the ocean. How far can you send it?",
};

export default function GamePage() {
  return (
    <div className="px-4 pt-4 sm:pt-6 pb-20">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 sm:mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--ink-mute)]">
            the slingshot, playable
          </p>
          <h1 className="text-display text-4xl sm:text-6xl font-extrabold mt-3 text-[var(--ink)]">
            Beachball <span className="shimmer-text">Launch</span>
          </h1>
          <p className="mt-3 text-[var(--ink-soft)] max-w-xl">
            Hold the ball underwater. The deeper the dunk, the harder it flies — you know
            how this works. Skip it across the ocean and post your distance.
          </p>
        </header>

        <LaunchGame />

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px] items-start">
          <div className="grid gap-4 sm:grid-cols-3">
            <HowTo
              step="01"
              title="Charge"
              body="Hold (tap or spacebar) to dunk the ball. Power builds, the aim arrow sweeps — release at the sweet spot."
            />
            <HowTo
              step="02"
              title="Skip"
              body="Mid-air, hold to dive. Hit the water shallow for a PERFECT skip that keeps your speed and chains combos."
            />
            <HowTo
              step="03"
              title="Collect"
              body="$ coins nudge you forward, orange rings slingshot you onward. Red candle buoys kill momentum — dodge them."
            />
          </div>

          <GlobalLeaderboard />
        </div>

        <section className="mt-12 glass rounded-3xl p-6 sm:p-8 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--ink-mute)]">
            play to earn — live
          </p>
          <h2 className="mt-2 text-display text-2xl sm:text-3xl font-bold text-[var(--ink)]">
            Top of the global board ={" "}
            <span className="shimmer-text">$BBALL in your wallet.</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[var(--ink-soft)] max-w-2xl mx-auto">
            Every 24 hours (00:00 UTC) the cycle resets and the podium gets paid:
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Payout place="🥇 1st" amount="100,000" />
            <Payout place="🥈 2nd" amount="50,000" />
            <Payout place="🥉 3rd" amount="25,000" />
          </div>
          <p className="mt-5 text-xs sm:text-sm text-[var(--ink-mute)] max-w-2xl mx-auto">
            Rewards are sent manually by the dev to the Solana wallet you submit with your
            score — no wallet connect, no signatures, ever. One best run per wallet counts
            per cycle.
          </p>
        </section>
      </div>
    </div>
  );
}

function Payout({ place, amount }: { place: string; amount: string }) {
  return (
    <div className="rounded-2xl bg-white/60 border border-[var(--ball-yellow)]/60 px-5 py-3">
      <p className="text-sm font-semibold text-[var(--ink)]">{place}</p>
      <p className="text-display text-xl font-extrabold text-[var(--ink)] tabular-nums">
        {amount} <span className="text-xs font-bold text-[var(--ink-soft)]">$BBALL</span>
      </p>
    </div>
  );
}

function HowTo({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="glass rounded-3xl p-5">
      <p className="font-mono text-xs text-[var(--ink-mute)]">step {step}</p>
      <h3 className="mt-1.5 text-lg font-bold text-[var(--ink)]">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-soft)]">{body}</p>
    </div>
  );
}
