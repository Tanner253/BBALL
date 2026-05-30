import { dexPair, socials } from "@/lib/socials";
import { ChartIcon } from "@/components/site/SocialIcons";

/**
 * Live Dexscreener chart embed for the $BBALL token.
 *
 * Layout follows Dexscreener's recommended responsive embed:
 *   - 125% padding-bottom on small screens (taller, mobile-friendly)
 *   - 65% padding-bottom on >= 1400px (wider, desktop)
 */
export function DexChart() {
  return (
    <section className="relative px-4 mt-24 sm:mt-32">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--ink-mute)]">
              live · solana
            </p>
            <h2 className="text-display text-3xl sm:text-4xl font-bold text-[var(--ink)] mt-2">
              The chart, in real time.
            </h2>
            <p className="text-[var(--ink-soft)] mt-2 max-w-lg">
              No interpretation, no narrative — just the ball doing what
              beachballs do.
            </p>
          </div>
          <a
            href={socials.dexscreener}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost"
          >
            <ChartIcon className="h-4 w-4" />
            Open on Dexscreener
            <span aria-hidden>↗</span>
          </a>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-[var(--water-abyss)] shadow-[0_30px_80px_-30px_rgba(8,50,80,0.45)]">
          <style>{`
            #dexscreener-embed{position:relative;width:100%;padding-bottom:125%;}
            @media(min-width:1400px){#dexscreener-embed{padding-bottom:65%;}}
            #dexscreener-embed iframe{position:absolute;width:100%;height:100%;top:0;left:0;border:0;}
          `}</style>
          <div id="dexscreener-embed">
            <iframe
              title="$BBALL price chart"
              src={`https://dexscreener.com/solana/${dexPair}?embed=1&loadChartSettings=0&chartLeftToolbar=0&chartTheme=dark&theme=dark&chartStyle=1&chartType=marketCap&interval=60`}
              loading="lazy"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
