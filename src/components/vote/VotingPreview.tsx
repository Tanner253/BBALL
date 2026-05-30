"use client";

import Image from "next/image";
import { useState } from "react";
import { clsx } from "clsx";
import type { Meme } from "@/data/memes";

/**
 * Static preview of what the upcoming arena will look/feel like.
 * Voting is local-only and doesn't persist — purely a visualization.
 */
export function VotingPreview({ memes }: { memes: Meme[] }) {
  const seeded = memes.map((m, i) => ({
    ...m,
    score: 70 + i * 18 + (m.slug.length % 7) * 4,
  }));

  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(seeded.map((m) => [m.slug, m.score]))
  );
  const [voted, setVoted] = useState<Record<string, "up" | "down" | null>>({});

  const max = Math.max(...Object.values(scores), 1);

  const vote = (slug: string, dir: "up" | "down") => {
    setVoted((v) => {
      const prev = v[slug];
      const same = prev === dir;
      const delta =
        (same ? -1 : 1) * (dir === "up" ? 1 : -1) -
        (prev && !same ? (prev === "up" ? 1 : -1) : 0);
      setScores((s) => ({ ...s, [slug]: Math.max(0, s[slug] + delta) }));
      return { ...v, [slug]: same ? null : dir };
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {seeded.map((m) => {
        const v = voted[m.slug];
        const pct = (scores[m.slug] / max) * 100;
        return (
          <div
            key={m.slug}
            className="relative overflow-hidden rounded-3xl border border-white/60 glass p-3 sm:p-4 flex flex-col gap-3"
          >
            <div className="flex gap-3">
              <div className="relative h-24 w-24 sm:h-32 sm:w-32 flex-shrink-0 rounded-2xl overflow-hidden border border-white/60">
                <Image src={m.src} alt={m.title} fill className="object-cover" sizes="128px" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-mute)]">
                    submission · anon
                  </p>
                  <span className="text-xs font-mono text-[var(--ink-mute)]">
                    {scores[m.slug]} pts
                  </span>
                </div>
                <h3 className="font-semibold text-[var(--ink)] mt-1 truncate">{m.title}</h3>
                {m.caption && (
                  <p className="text-xs text-[var(--ink-soft)] line-clamp-2 mt-1 whitespace-pre-line">
                    {m.caption}
                  </p>
                )}

                <div className="mt-3 h-1.5 rounded-full bg-black/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background:
                        "linear-gradient(90deg, var(--ball-yellow), var(--ball-orange), var(--ball-red))",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => vote(m.slug, "up")}
                className={clsx(
                  "flex-1 rounded-full px-3 py-2 text-sm font-medium border transition-colors",
                  v === "up"
                    ? "bg-[var(--ball-green)] text-white border-[var(--ball-green)]"
                    : "bg-white/70 border-white/70 hover:bg-white text-[var(--ink)]"
                )}
              >
                ▲ Float it
              </button>
              <button
                onClick={() => vote(m.slug, "down")}
                className={clsx(
                  "flex-1 rounded-full px-3 py-2 text-sm font-medium border transition-colors",
                  v === "down"
                    ? "bg-[var(--ink)] text-white border-[var(--ink)]"
                    : "bg-white/70 border-white/70 hover:bg-white text-[var(--ink)]"
                )}
              >
                ▼ Sink it
              </button>
            </div>
            <p className="text-[10px] text-[var(--ink-mute)] text-center font-mono">
              preview only · votes don&rsquo;t persist yet
            </p>
          </div>
        );
      })}
    </div>
  );
}
