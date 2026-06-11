"use client";

import { useEffect, useState } from "react";
import { CHALLENGE_BONUS, todayChallenge, type Challenge } from "@/lib/challenge";
import { GAME_WEATHER } from "./weather";

/**
 * Daily challenge + weather strip under the canvas. Client component because
 * both rotate at 00:00 UTC and the page itself is statically prerendered.
 */
export function ChallengeBanner() {
  // Resolved on the client so a stale prerender can never show yesterday's.
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  useEffect(() => {
    setChallenge(todayChallenge());
  }, []);

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-center">
      <p className="text-sm text-[var(--ink-soft)]">
        <span className="font-bold text-[var(--ink)]">🎯 Daily challenge:</span>{" "}
        {challenge ? (
          <>
            {challenge.text} ·{" "}
            <span className="font-bold text-[#2c9c5e]">+{CHALLENGE_BONUS} bonus coins</span>{" "}
            per qualifying run
          </>
        ) : (
          "loading…"
        )}
      </p>
      <p className="text-sm text-[var(--ink-soft)]">
        <span className="font-bold text-[var(--ink)]">🌊 Conditions:</span>{" "}
        {GAME_WEATHER.label} — same seas for everyone, new at 00:00 UTC
      </p>
    </div>
  );
}
