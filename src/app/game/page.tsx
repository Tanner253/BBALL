import type { Metadata } from "next";
import { LaunchGame } from "@/components/game/LaunchGame";
import { GlobalLeaderboard } from "@/components/game/GlobalLeaderboard";
import { ChallengeBanner } from "@/components/game/ChallengeBanner";
import { ChatPanel } from "@/components/game/ChatPanel";

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
            how this works. Skip it across the ocean and post your distance. Weather rolls
            through all day — storms swell the waves — and it&apos;s identical for every
            player at every moment.
          </p>
        </header>

        <LaunchGame />

        <ChallengeBanner />

        <div className="mt-6">
          <ChatPanel />
        </div>

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
              body="Mid-air, hold the screen (or spacebar) to dive the ball down. Time it into a wave dip for a PERFECT bounce that launches you HIGHER — chain them for combos. Whales are trampolines."
            />
            <HowTo
              step="03"
              title="Collect"
              body="Coins stack the 48h coin board. Rings, jetstreams, balloons, dolphins, geysers and green candles boost you; white god candles and whales send you vertical. Dodge red candles, seagulls, storm clouds and UFOs."
            />
          </div>

          <GlobalLeaderboard />
        </div>
      </div>
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
