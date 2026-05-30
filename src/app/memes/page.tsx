import type { Metadata } from "next";
import { MemeDepot } from "@/components/memes/MemeDepot";
import { memes, captions } from "@/data/memes";

export const metadata: Metadata = {
  title: "Meme Depot — $BBALL",
  description:
    "The official $BBALL meme arsenal. One-click copy, one-click download. Perfect for raids.",
};

export default function MemesPage() {
  return (
    <div className="px-4 pt-4 sm:pt-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 sm:mb-12">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--ink-mute)]">
            ammo · armory · arsenal
          </p>
          <h1 className="text-display text-4xl sm:text-6xl font-extrabold mt-3 text-[var(--ink)]">
            The Meme Depot
          </h1>
          <p className="mt-4 text-[var(--ink-soft)] max-w-2xl text-base sm:text-lg">
            Free, organized, copy-pasteable $BBALL ammo. Hit{" "}
            <span className="font-semibold text-[var(--ink)]">Copy image</span>{" "}
            and the meme is on your clipboard — paste into X, Telegram,
            CoinComms, group chats, billboards, your dreams. Raid responsibly.
          </p>
        </header>

        <MemeDepot memes={memes} captions={captions} />
      </div>
    </div>
  );
}
