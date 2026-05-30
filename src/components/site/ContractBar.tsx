"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { tokenMint, socials } from "@/lib/socials";

/**
 * Contract address bar — sits just below the navbar on every page.
 * Click to copy with bright tactile feedback. Keeps the CA front-and-center
 * for raids without crowding the navbar.
 */
export function ContractBar() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tokenMint);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — leave state as-is */
    }
  };

  return (
    <div className="w-full px-4 mt-1 sm:mt-2">
      <div className="mx-auto max-w-6xl">
        <div
          className={clsx(
            "relative overflow-hidden rounded-full border transition-colors",
            copied
              ? "bg-[var(--ball-green)] border-[var(--ball-green)]"
              : "bg-white/55 backdrop-blur-md border-black/10 hover:bg-white/75"
          )}
        >
          <button
            type="button"
            onClick={copy}
            aria-label="Copy contract address"
            className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 text-left"
          >
            <span
              className={clsx(
                "shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] hidden sm:inline-flex items-center gap-1.5 rounded-full px-2 py-0.5",
                copied
                  ? "bg-white/20 text-white"
                  : "bg-[var(--ball-yellow)] text-[var(--ink)]"
              )}
            >
              CA
            </span>
            <span
              className={clsx(
                "font-mono text-[11px] sm:text-sm font-semibold tracking-tight truncate flex-1 min-w-0",
                copied ? "text-white" : "text-[var(--ink)]"
              )}
            >
              {tokenMint}
            </span>
            <span
              className={clsx(
                "shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                copied
                  ? "bg-white/20 text-white"
                  : "bg-[var(--ink)] text-white group-hover:bg-[var(--water-deep)]"
              )}
            >
              {copied ? (
                <>
                  <CheckIcon className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <CopyIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </span>
          </button>
        </div>

        {/* tiny sub-line — quick links, only on >= sm */}
        <div className="hidden sm:flex items-center justify-end gap-3 mt-1 px-1 text-[10px] font-mono text-[var(--ink-mute)]">
          <a
            href={socials.pumpfun}
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--ink)] transition-colors"
          >
            view on pump.fun ↗
          </a>
          <span aria-hidden>·</span>
          <a
            href={socials.dexscreener}
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--ink)] transition-colors"
          >
            view on dexscreener ↗
          </a>
        </div>
      </div>
    </div>
  );
}

function CopyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}
