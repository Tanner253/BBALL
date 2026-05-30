import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Lore — $BBALL",
  description: "The why, the how, and the buoyancy of $BBALL.",
};

export default function LorePage() {
  return (
    <div className="px-4 pt-4 sm:pt-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-12">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--ink-mute)]">
            the lore
          </p>
          <h1 className="text-display text-4xl sm:text-6xl font-extrabold mt-3 text-[var(--ink)]">
            Why a beachball.
          </h1>
        </header>

        <article className="prose-bball flex flex-col gap-6 text-[var(--ink-soft)] text-base sm:text-lg leading-relaxed">
          <p>
            Every cycle there is a thing nobody can keep down. It looks dumb.
            People laugh at it. They &ldquo;short&rdquo; it with their words.
            They forget about it. And then, every time, it pops back to the
            surface looking exactly like it did before — usually a little
            higher.
          </p>

          <p>
            That&rsquo;s a beachball. That&rsquo;s also <span className="font-semibold text-[var(--ink)]">$BBALL</span>.
          </p>

          <Pull>
            A beachball cannot be held underwater forever. The deeper you push
            it, the harder it will fly back up.
          </Pull>

          <p>
            Most coins try to copy a stock. They borrow leverage, they borrow
            seriousness, they borrow the language of finance. $BBALL borrows
            from a kid&rsquo;s pool toy. It&rsquo;s honest about what it is:
            colorful, light, and impossible to drown.
          </p>

          <h2 className="text-display text-2xl sm:text-3xl font-bold text-[var(--ink)] mt-6">
            Three phases of any holder
          </h2>

          <ol className="list-decimal pl-6 space-y-2">
            <li>
              <span className="font-semibold text-[var(--ink)]">Damn, wish I bought.</span>{" "}
              The ball is in the air. You watch from the sand.
            </li>
            <li>
              <span className="font-semibold text-[var(--ink)]">Haha I was right not to buy.</span>{" "}
              The ball is shoved underwater. You feel correct.
            </li>
            <li>
              <span className="font-semibold text-[var(--ink)]">Fuck.</span>{" "}
              The ball releases. You are no longer correct.
            </li>
          </ol>

          <h2 className="text-display text-2xl sm:text-3xl font-bold text-[var(--ink)] mt-6">
            What the site is for
          </h2>

          <p>
            This site exists to make community ammunition trivial to find and
            trivial to share. The Meme Depot is one click and one paste. The
            Arena (soon) lets anyone — anonymous or not — submit and vote on
            the dankest community work, with $BBALL prizes for the winners.
          </p>

          <p>
            No credentials. No gates. Just a beachball and a community
            committed to its inevitability.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/memes" className="btn-pop">
              Open the depot
            </Link>
            <Link href="/vote" className="btn-ghost">
              Preview the arena
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}

function Pull({ children }: { children: React.ReactNode }) {
  return (
    <blockquote
      className="relative my-2 rounded-2xl border-l-4 pl-5 pr-4 py-4 italic text-[var(--ink)]"
      style={{
        borderColor: "var(--ball-red)",
        background:
          "linear-gradient(90deg, rgba(255,77,77,0.08), rgba(255,217,61,0.08))",
      }}
    >
      {children}
    </blockquote>
  );
}
