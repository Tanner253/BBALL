"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { MemeCard } from "./MemeCard";
import { CaptionCard } from "./CaptionCard";
import type { Meme } from "@/data/memes";

type Props = {
  memes: Meme[];
  captions: { slug: string; text: string; tags: string[] }[];
};

type Tab = "images" | "captions";

export function MemeDepot({ memes, captions }: Props) {
  const [tab, setTab] = useState<Tab>("images");
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    memes.forEach((m) => m.tags.forEach((t) => set.add(t)));
    captions.forEach((c) => c.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [memes, captions]);

  const filteredMemes = useMemo(() => {
    return memes.filter((m) => {
      if (activeTag && !m.tags.includes(activeTag)) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          m.title.toLowerCase().includes(q) ||
          (m.caption ?? "").toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [memes, query, activeTag]);

  const filteredCaptions = useMemo(() => {
    return captions.filter((c) => {
      if (activeTag && !c.tags.includes(activeTag)) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          c.text.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [captions, query, activeTag]);

  return (
    <div className="flex flex-col gap-6">
      <div className="glass rounded-2xl p-2 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="flex gap-1 p-1 bg-black/5 rounded-full self-start">
          <TabButton
            active={tab === "images"}
            onClick={() => setTab("images")}
            label={`Images · ${memes.length}`}
          />
          <TabButton
            active={tab === "captions"}
            onClick={() => setTab("captions")}
            label={`Captions · ${captions.length}`}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:max-w-sm">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-mute)]"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search memes…"
              className="w-full pl-9 pr-3 py-2 rounded-full bg-white/70 border border-white/70 placeholder:text-[var(--ink-mute)] text-sm focus:outline-none focus:bg-white"
            />
          </div>
          {(query || activeTag) && (
            <button
              onClick={() => {
                setQuery("");
                setActiveTag(null);
              }}
              className="btn-ghost !py-1.5 !px-3 !text-xs"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Tag chips */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTag(activeTag === t ? null : t)}
              className={clsx(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                activeTag === t
                  ? "bg-[var(--ink)] text-white"
                  : "bg-white/55 text-[var(--ink-soft)] hover:bg-white/85"
              )}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {tab === "images" ? (
        filteredMemes.length === 0 ? (
          <Empty />
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMemes.map((m, i) => (
              <MemeCard key={m.slug} meme={m} priority={i < 3} />
            ))}
          </div>
        )
      ) : filteredCaptions.length === 0 ? (
        <Empty />
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          {filteredCaptions.map((c) => (
            <CaptionCard key={c.slug} text={c.text} tags={c.tags} />
          ))}
        </div>
      )}

      {/* Submission CTA */}
      <div className="mt-6 relative overflow-hidden rounded-2xl glass p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--ink-mute)]">
              add to the depot
            </p>
            <h3 className="text-xl font-bold text-[var(--ink)] mt-1">
              Got a banger meme?
            </h3>
            <p className="text-sm text-[var(--ink-soft)] mt-1 max-w-md">
              The community voting arena (with $BBALL prizes) is coming. Until
              then, drop submissions in the Telegram and the best ones land
              here.
            </p>
          </div>
          <a
            href="https://t.me"
            target="_blank"
            rel="noreferrer"
            className="btn-pop"
          >
            Submit a meme
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
        active
          ? "bg-white text-[var(--ink)] shadow-sm"
          : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
      )}
    >
      {label}
    </button>
  );
}

function Empty() {
  return (
    <div className="rounded-2xl glass p-10 text-center text-[var(--ink-soft)]">
      <p className="text-3xl mb-2" aria-hidden>🏖️</p>
      <p className="font-medium text-[var(--ink)]">Nothing washes ashore here.</p>
      <p className="text-sm mt-1">Try a different search or clear filters.</p>
    </div>
  );
}
