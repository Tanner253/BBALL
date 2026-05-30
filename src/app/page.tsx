import Link from "next/link";
import Image from "next/image";
import { OceanScene } from "@/components/beachball/OceanScene";
import { memes } from "@/data/memes";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* HERO ----------------------------------------------------- */}
      <section className="relative px-4 pt-6 sm:pt-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] items-end">
            <div className="order-2 lg:order-1 max-w-xl">
              <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 text-xs font-medium text-[var(--ink-soft)] mb-5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--ball-red)]" />
                Solana · community owned · floats forever
              </div>
              <h1 className="text-display text-5xl sm:text-6xl lg:text-7xl font-extrabold text-[var(--ink)]">
                A beachball
                <br />
                <span className="shimmer-text">cannot be held</span>
                <br />
                underwater forever.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-[var(--ink-soft)] max-w-md leading-relaxed">
                $BBALL is the meme that refuses to drown. Push it down, mock it,
                forget it — the ocean only stores energy. When it lets go, it
                <span className="font-semibold text-[var(--ink)]"> launches</span>.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href="/memes" className="btn-pop">
                  Open the meme depot
                  <span aria-hidden>→</span>
                </Link>
                <Link href="/lore" className="btn-ghost">
                  Read the lore
                </Link>
                <a
                  href="#slingshot"
                  className="text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] underline underline-offset-4 decoration-[var(--ball-red)]/40 ml-1"
                >
                  How the slingshot works ↓
                </a>
              </div>

              <dl className="mt-9 grid grid-cols-3 gap-3 max-w-md">
                <Stat label="Buoyancy" value="∞" />
                <Stat label="Holders" value="growing" />
                <Stat label="Floor" value="the surface" />
              </dl>
            </div>

            <div className="order-1 lg:order-2">
              <OceanScene />
              <p className="mt-3 text-xs text-[var(--ink-mute)] text-center">
                Tip: grab the ball, hold it under, let go. That&rsquo;s the chart.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SLINGSHOT EXPLAINER ------------------------------------- */}
      <section
        id="slingshot"
        className="relative mt-24 sm:mt-32 px-4"
      >
        <div className="mx-auto max-w-5xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--ink-mute)]">
            the slingshot principle
          </p>
          <h2 className="mt-3 text-display text-3xl sm:text-5xl font-bold text-[var(--ink)]">
            You are <span className="shimmer-text">here</span>.
          </h2>
          <p className="mt-4 text-[var(--ink-soft)] max-w-2xl mx-auto">
            Every memecoin gets dunked. Most stay down. The ones built around
            buoyancy don&rsquo;t — and the deeper they get pushed, the harder they fly.
          </p>
        </div>

        <div className="mx-auto max-w-5xl mt-10 grid gap-4 sm:grid-cols-3">
          <PhaseCard
            phase="01"
            title="Damn, wish I bought."
            body="The ball is in the air. Charts green. Energy stored as regret."
            tone="sky"
          />
          <PhaseCard
            phase="02"
            title="Haha I was right not to buy."
            body="The ball is shoved underwater. Mockery spawns. Pressure builds."
            tone="deep"
            highlight
          />
          <PhaseCard
            phase="03"
            title="Fuck."
            body="The ball releases. Velocity = depth × time × cope. Slingshot fires."
            tone="sun"
          />
        </div>
      </section>

      {/* MEMES TEASER -------------------------------------------- */}
      <section className="relative mt-24 sm:mt-32 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--ink-mute)]">
                ammo
              </p>
              <h2 className="text-display text-3xl sm:text-4xl font-bold text-[var(--ink)] mt-2">
                The Meme Depot
              </h2>
              <p className="text-[var(--ink-soft)] mt-2 max-w-lg">
                One-click copy. One-click download. Built so anyone can
                raid in seconds — no right-click gymnastics, no Discord
                scavenger hunts.
              </p>
            </div>
            <Link href="/memes" className="btn-ghost">
              Browse all
              <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
            {memes.slice(0, 3).map((m) => (
              <Link
                key={m.slug}
                href="/memes"
                className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/40 backdrop-blur-md hover:bg-white/60 transition-colors"
              >
                <div className="relative aspect-square">
                  <Image
                    src={m.src}
                    alt={m.title}
                    fill
                    sizes="(min-width:768px) 33vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-white text-sm font-medium">{m.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* VOTING TEASER ------------------------------------------- */}
      <section className="relative mt-24 sm:mt-32 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-[28px] border border-white/60 glass-strong p-6 sm:p-10">
            <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] items-center">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--ink-mute)]">
                  coming soon
                </p>
                <h2 className="text-display text-3xl sm:text-4xl font-bold text-[var(--ink)] mt-2">
                  Anonymous meme arena. <span className="shimmer-text">$BBALL</span> rewards.
                </h2>
                <p className="text-[var(--ink-soft)] mt-3 max-w-lg">
                  Submit anonymously. Vote anonymously. The community elects
                  the dankest memes of the week and the top creators get
                  airdropped a slice of the $BBALL bag.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href="/vote" className="btn-pop">
                    Preview the arena
                  </Link>
                  <a href="#" className="btn-ghost">
                    Join early access
                  </a>
                </div>
              </div>
              <div className="relative">
                <div
                  aria-hidden
                  className="absolute -inset-4 rounded-3xl"
                  style={{
                    background:
                      "radial-gradient(circle at 60% 40%, rgba(255,217,61,0.6), transparent 60%)",
                  }}
                />
                <div className="relative grid grid-cols-3 gap-2">
                  {memes.slice(0, 6).map((m, i) => (
                    <div
                      key={m.slug + i}
                      className="relative aspect-square rounded-xl overflow-hidden border border-white/60"
                      style={{ transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (1 + i)}deg)` }}
                    >
                      <Image
                        src={m.src}
                        alt=""
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                      <div className="absolute top-1 right-1 glass rounded-full text-[10px] px-1.5 py-0.5 font-mono">
                        +{(i + 1) * 13}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA ----------------------------------------------------- */}
      <section className="relative mt-24 sm:mt-32 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h3 className="text-display text-3xl sm:text-4xl font-bold text-[var(--ink)]">
            Be early to a thing that <span className="shimmer-text">refuses to sink</span>.
          </h3>
          <p className="mt-3 text-[var(--ink-soft)]">
            $BBALL is just a beachball, and a beachball is just physics with branding.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/memes" className="btn-pop">
              Grab some ammo
            </Link>
            <Link href="/vote" className="btn-ghost">
              Vote on memes
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl px-4 py-3">
      <dt className="text-[10px] uppercase tracking-wider text-[var(--ink-mute)] font-mono">
        {label}
      </dt>
      <dd className="text-xl font-semibold text-[var(--ink)] mt-0.5">
        {value}
      </dd>
    </div>
  );
}

function PhaseCard({
  phase,
  title,
  body,
  tone,
  highlight,
}: {
  phase: string;
  title: string;
  body: string;
  tone: "sky" | "deep" | "sun";
  highlight?: boolean;
}) {
  const toneStyles =
    tone === "sky"
      ? "from-[var(--sky-3)]/40 to-[var(--sky-4)]/30"
      : tone === "deep"
      ? "from-[var(--water-mid)]/45 to-[var(--water-deep)]/45 text-white"
      : "from-[var(--ball-yellow)]/55 to-[var(--ball-orange)]/40";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/50 bg-gradient-to-br ${toneStyles} p-5 ${
        highlight ? "ring-2 ring-[var(--ball-yellow)]/60" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs opacity-70">phase {phase}</span>
        {highlight && (
          <span className="text-[10px] uppercase tracking-wider font-bold rounded-full px-2 py-0.5 bg-[var(--ball-yellow)] text-[var(--ink)]">
            you are here
          </span>
        )}
      </div>
      <h3 className={`mt-3 text-xl font-bold ${tone === "deep" ? "text-white" : "text-[var(--ink)]"}`}>
        {title}
      </h3>
      <p className={`mt-2 text-sm ${tone === "deep" ? "text-white/85" : "text-[var(--ink-soft)]"}`}>
        {body}
      </p>
    </div>
  );
}
