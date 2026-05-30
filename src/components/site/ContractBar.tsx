"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { tokenMint, socials } from "@/lib/socials";

/**
 * Contract address bar — sits just below the navbar on every page.
 * Designed to be impossible to miss: warm sun-gradient fill, oversize
 * mono CA, big tap-to-copy button with a soft attention pulse.
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
    <div className="w-full px-3 sm:px-4 mt-2">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={copy}
          aria-label="Copy contract address"
          className={clsx(
            "group relative w-full overflow-hidden rounded-2xl transition-all duration-200",
            "border-2 px-3 sm:px-5 py-3 sm:py-3.5 text-left",
            "flex items-center gap-2 sm:gap-3",
            copied
              ? "bg-[var(--ball-green)] border-[var(--ball-green)] shadow-[0_8px_22px_-10px_rgba(46,204,113,0.7)]"
              : "border-[var(--ink)]/10 hover:border-[var(--ink)]/25 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-14px_rgba(255,138,43,0.55)]"
          )}
          style={
            copied
              ? undefined
              : {
                  background:
                    "linear-gradient(95deg, var(--ball-yellow) 0%, #ffc34d 50%, var(--ball-orange) 100%)",
                }
          }
        >
          {/* Soft sweeping highlight (pure decoration) */}
          {!copied && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 rotate-12 bg-white/35 blur-md"
              style={{ animation: "ca-sweep 5s ease-in-out infinite" }}
            />
          )}

          <span
            className={clsx(
              "shrink-0 hidden sm:inline-flex items-center font-mono text-[10px] uppercase tracking-[0.25em] font-bold rounded-full px-2.5 py-1",
              copied
                ? "bg-white/20 text-white"
                : "bg-[var(--ink)] text-[var(--ball-yellow)]"
            )}
          >
            {copied ? "✓ copied" : "contract"}
          </span>

          <span
            className={clsx(
              "font-mono font-bold tracking-tight truncate flex-1 min-w-0",
              "text-[12px] sm:text-base lg:text-lg",
              copied ? "text-white" : "text-[var(--ink)]"
            )}
          >
            {tokenMint}
          </span>

          <span
            className={clsx(
              "shrink-0 inline-flex items-center gap-1.5 rounded-full font-bold transition-all duration-200",
              "px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm",
              copied
                ? "bg-white text-[var(--ball-green)]"
                : "bg-[var(--ink)] text-white group-hover:scale-[1.04] group-active:scale-95",
              !copied && "ca-pulse"
            )}
          >
            {copied ? (
              <>
                <CheckIcon className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <CopyIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Tap to&nbsp;</span>
                <span>copy</span>
              </>
            )}
          </span>
        </button>

        {/* Quick links underneath */}
        <div className="flex items-center justify-center sm:justify-end gap-3 mt-1.5 px-1 text-[10px] font-mono text-[var(--ink-mute)]">
          <a
            href={socials.pumpfun}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-[var(--ink)] transition-colors"
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ball-green)] text-white font-bold px-1.5 py-0.5 text-[9px] tracking-wider uppercase shadow-[0_0_0_3px_rgba(46,204,113,0.25)]">
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              LIVE
            </span>
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

      <style>{`
        @keyframes ca-sweep {
          0%, 60% { transform: translateX(0) rotate(12deg); }
          100% { transform: translateX(450%) rotate(12deg); }
        }
        @keyframes ca-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(11, 30, 46, 0.45); }
          50%      { box-shadow: 0 0 0 6px rgba(11, 30, 46, 0); }
        }
        .ca-pulse { animation: ca-pulse 2.4s ease-out infinite; }
      `}</style>
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
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}
