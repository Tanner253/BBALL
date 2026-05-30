"use client";

import { useState } from "react";
import { clsx } from "clsx";

type Props = {
  text: string;
  tags: string[];
};

export function CaptionCard({ text, tags }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={clsx(
        "group relative flex flex-col text-left w-full rounded-2xl p-5 border transition-all duration-200 overflow-hidden",
        copied
          ? "bg-[var(--ball-green)]/15 border-[var(--ball-green)]"
          : "bg-white/55 border-white/60 hover:bg-white/75 hover:-translate-y-0.5"
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-[var(--ink-soft)]"
            >
              {t}
            </span>
          ))}
        </div>
        <span
          className={clsx(
            "text-[11px] font-mono uppercase tracking-wider transition-colors",
            copied ? "text-[var(--ball-green)]" : "text-[var(--ink-mute)] group-hover:text-[var(--ink)]"
          )}
        >
          {copied ? "copied" : "click to copy"}
        </span>
      </div>
      <p className="text-[var(--ink)] font-medium whitespace-pre-line leading-relaxed">
        {text}
      </p>
    </button>
  );
}
