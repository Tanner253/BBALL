import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { memes } from "@/data/memes";
import { VotingPreview } from "@/components/vote/VotingPreview";

export const metadata: Metadata = {
  title: "Meme Arena — $BBALL",
  description:
    "Anonymous community voting on the best $BBALL memes. Top creators win $BBALL.",
};

export default function VotePage() {
  return (
    <div className="px-4 pt-4 sm:pt-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 text-xs font-medium text-[var(--ink-soft)] mb-4">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--ball-green)] animate-pulse" />
            arena · launching soon
          </div>
          <h1 className="text-display text-4xl sm:text-6xl font-extrabold text-[var(--ink)]">
            Meme Arena.
            <br />
            <span className="shimmer-text">Anonymous.</span> Anti-fragile.
          </h1>
          <p className="mt-4 text-[var(--ink-soft)] max-w-2xl text-base sm:text-lg">
            Submit your meme without a username. Vote without a wallet
            connect-wall. The top memes of each cycle get airdropped a slice
            of the $BBALL community bag — quality only, no farming.
          </p>
        </header>

        {/* Live preview / mockup */}
        <VotingPreview memes={memes} />

        {/* How it works */}
        <section className="mt-12 grid gap-4 sm:grid-cols-3">
          <Step
            n="01"
            title="Submit anonymously"
            body="Drop an image or caption. No KYC, no signup. We hash it so duplicates can't be farmed."
          />
          <Step
            n="02"
            title="Community votes"
            body="One vote per session. Bots filtered with proof-of-human; whales don't outweigh holders."
          />
          <Step
            n="03"
            title="Top memes win $BBALL"
            body="Each cycle, the best memes get an airdrop straight from the community bag. Creators stay anonymous unless they want a shout."
          />
        </section>

        {/* Email/signup style waitlist */}
        <section className="mt-12 relative overflow-hidden rounded-3xl border border-white/60 glass p-6 sm:p-10">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-60"
            style={{ background: "radial-gradient(circle, var(--ball-yellow), transparent 60%)"}}
          />
          <div className="relative grid gap-6 md:grid-cols-[1.4fr_1fr] items-center">
            <div>
              <h2 className="text-display text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                Want first ammo + first vote?
              </h2>
              <p className="mt-2 text-[var(--ink-soft)] max-w-md">
                Early voters get extra weight in the first season. Join the
                Telegram and turn on the meme channel.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 md:justify-end">
              <a href="https://t.me" target="_blank" rel="noreferrer" className="btn-pop">
                Join Telegram
              </a>
              <Link href="/memes" className="btn-ghost">
                Browse depot
              </Link>
            </div>
          </div>
        </section>

        {/* mini gallery preview */}
        <section className="mt-12">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--ink-mute)] mb-4">
            currently in the depot
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {memes.slice(0, 4).map((m) => (
              <div
                key={m.slug}
                className="relative aspect-square rounded-2xl overflow-hidden border border-white/60"
              >
                <Image
                  src={m.src}
                  alt={m.title}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl glass p-5">
      <span className="font-mono text-xs text-[var(--ink-mute)]">step {n}</span>
      <h3 className="mt-2 text-lg font-bold text-[var(--ink)]">{title}</h3>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">{body}</p>
    </div>
  );
}
