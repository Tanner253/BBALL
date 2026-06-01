import Link from "next/link";
import Image from "next/image";
import { OceanScene } from "@/components/beachball/OceanScene";
import { DexChart } from "@/components/chart/DexChart";
import { memes } from "@/data/memes";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* HERO ----------------------------------------------------- */}
      <section className="relative w-full mt-3 sm:mt-4">
        {/* Full-bleed ocean scene as the hero canvas */}
        <OceanScene />

        {/* Hero copy + CTAs overlaid on the sky portion of the scene */}
        <div className="absolute inset-x-0 top-0 z-20 pointer-events-none">
          <div className="mx-auto max-w-6xl px-4 pt-6 sm:pt-16 lg:pt-24">
            <h1 className="text-display text-[2.4rem] leading-[1.02] sm:text-6xl sm:leading-[1.05] lg:text-7xl xl:text-8xl font-extrabold text-[var(--ink)] max-w-3xl">
              A beachball
              <br />
              <span className="shimmer-text">cannot be held</span>
              <br />
              underwater forever.
            </h1>
            <p className="mt-3 sm:mt-5 text-sm sm:text-lg text-[var(--ink-soft)] max-w-md leading-relaxed">
              $BBALL is the meme that refuses to drown. Push it down, mock it,
              forget it — the ocean only stores energy. When it lets go, it
              <span className="font-semibold text-[var(--ink)]"> launches</span>.
            </p>
            <div className="pointer-events-auto relative z-30 mt-5 sm:mt-7 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 max-w-sm sm:max-w-none">
              <Link href="/memes" className="btn-pop justify-center">
                Open the meme depot
                <span aria-hidden>→</span>
              </Link>
              <Link href="/lore" className="btn-ghost justify-center">
                Read the lore
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SLINGSHOT EXPLAINER ------------------------------------- */}
      <section id="slingshot" className="relative pt-20 sm:pt-28 px-4">
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

      {/* DEXSCREENER CHART --------------------------------------- */}
      <DexChart />

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
                raid in seconds — no right-click gymnastics, no scavenger
                hunts through old Telegram threads.
              </p>
            </div>
            <Link href="/memes" className="btn-ghost">
              Browse all
              <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
            {memes
              .filter((m) => m.category === "image")
              .slice(0, 3)
              .map((m) => (
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
            <Link href="/lore" className="btn-ghost">
              Read the lore
            </Link>
          </div>
        </div>
      </section>
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
