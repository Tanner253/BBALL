import { socials } from "@/lib/socials";
import { ChartIcon, TelegramIcon, XIcon } from "./SocialIcons";

export function Footer() {
  return (
    <footer className="mt-20 px-4 pb-6 pt-8">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--ink-mute)]">
        <p>
          © {new Date().getFullYear()} <span className="font-semibold text-[var(--ink-soft)]">$BBALL</span> · floats forever
        </p>
        <div className="flex items-center gap-4">
          <a
            href={socials.x}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-[var(--ink)]"
          >
            <XIcon className="h-3.5 w-3.5" /> X
          </a>
          <a
            href={socials.telegram}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-[var(--ink)]"
          >
            <TelegramIcon className="h-3.5 w-3.5" /> Telegram
          </a>
          <a
            href={socials.dexscreener}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-[var(--ink)]"
          >
            <ChartIcon className="h-3.5 w-3.5" /> Chart
          </a>
          <a
            href={socials.devContact}
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--ink)]"
            title="Contact dev"
          >
            dev: @osknyo_dev
          </a>
        </div>
      </div>
    </footer>
  );
}
