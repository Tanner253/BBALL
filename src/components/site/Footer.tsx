import Link from "next/link";
import { BeachBallMark } from "@/components/brand/BeachBallMark";

export function Footer() {
  return (
    <footer className="relative mt-16">
      {/* sandy strip */}
      <div
        aria-hidden
        className="h-12 w-full"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(246,220,160,0.6) 30%, rgba(216,180,106,0.7))",
        }}
      />
      <div
        aria-hidden
        className="h-3 w-full"
        style={{
          background:
            "repeating-linear-gradient(90deg, var(--sand-shadow) 0 2px, transparent 2px 7px)",
          opacity: 0.35,
        }}
      />

      <div
        className="relative px-4 pt-10 pb-12 grain"
        style={{
          background:
            "linear-gradient(180deg, var(--sand) 0%, var(--sand-light) 100%)",
        }}
      >
        <div className="mx-auto max-w-6xl flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3 max-w-md">
            <span className="inline-flex h-10 w-10 shrink-0">
              <BeachBallMark className="h-full w-full animate-float" />
            </span>
            <div>
              <p className="font-semibold text-[var(--ink)]">
                $BBALL
              </p>
              <p className="text-sm text-[var(--ink-soft)] leading-relaxed mt-1">
                A beachball cannot be held underwater forever. Built by the
                community, for the community. Not financial advice — just vibes
                and physics.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
            <div className="flex flex-col gap-2">
              <p className="text-[var(--ink-mute)] uppercase tracking-wider text-xs">
                Site
              </p>
              <Link className="text-[var(--ink-soft)] hover:text-[var(--ink)]" href="/">
                Home
              </Link>
              <Link className="text-[var(--ink-soft)] hover:text-[var(--ink)]" href="/memes">
                Meme Depot
              </Link>
              <Link className="text-[var(--ink-soft)] hover:text-[var(--ink)]" href="/vote">
                Vote
              </Link>
              <Link className="text-[var(--ink-soft)] hover:text-[var(--ink)]" href="/lore">
                Lore
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-[var(--ink-mute)] uppercase tracking-wider text-xs">
                Community
              </p>
              <a className="text-[var(--ink-soft)] hover:text-[var(--ink)]" href="https://x.com" target="_blank" rel="noreferrer">
                X / Twitter
              </a>
              <a className="text-[var(--ink-soft)] hover:text-[var(--ink)]" href="https://t.me" target="_blank" rel="noreferrer">
                Telegram
              </a>
              <a className="text-[var(--ink-soft)] hover:text-[var(--ink)]" href="https://discord.com" target="_blank" rel="noreferrer">
                Discord
              </a>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl mt-10 pt-6 border-t border-[var(--sand-shadow)]/50 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-[var(--ink-mute)]">
          <p>© {new Date().getFullYear()} $BBALL. Floats forever.</p>
          <p className="font-mono">solana · memecoin · meme depot</p>
        </div>
      </div>
    </footer>
  );
}
