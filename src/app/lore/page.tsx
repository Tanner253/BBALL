import type { Metadata } from "next";
import Link from "next/link";
import { socials } from "@/lib/socials";

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
            trivial to share. The{" "}
            <Link
              className="font-semibold text-[var(--ink)] underline underline-offset-4 decoration-[var(--ball-red)]/40"
              href="/memes"
            >
              Meme Depot
            </Link>{" "}
            is one click and one paste. No credentials, no gates — just a
            beachball and a community committed to its inevitability.
          </p>

          <h2 className="text-display text-2xl sm:text-3xl font-bold text-[var(--ink)] mt-6">
            Where the community lives
          </h2>

          <p>
            X communities got shut down, so the conversation moved to{" "}
            <a
              className="font-semibold text-[var(--ink)] underline underline-offset-4 decoration-[var(--ball-red)]/40"
              href={socials.telegram}
              target="_blank"
              rel="noreferrer"
            >
              Telegram
            </a>{" "}
            and{" "}
            <a
              className="font-semibold text-[var(--ink)] underline underline-offset-4 decoration-[var(--ball-red)]/40"
              href={socials.pumpfun}
              target="_blank"
              rel="noreferrer"
            >
              CoinComms on pump.fun
            </a>
            . Follow{" "}
            <a
              className="font-semibold text-[var(--ink)] underline underline-offset-4 decoration-[var(--ball-red)]/40"
              href={socials.x}
              target="_blank"
              rel="noreferrer"
            >
              @bballonpf
            </a>{" "}
            for posts. Need to reach the dev directly? Message{" "}
            <a
              className="font-semibold text-[var(--ink)] underline underline-offset-4 decoration-[var(--ball-red)]/40"
              href={socials.devContact}
              target="_blank"
              rel="noreferrer"
            >
              @osknyo_dev
            </a>{" "}
            on X.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/memes" className="btn-pop">
              Open the depot
            </Link>
            <a
              href={socials.telegram}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost"
            >
              Join Telegram
            </a>
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
