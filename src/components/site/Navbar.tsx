"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { BeachBallMark } from "@/components/brand/BeachBallMark";
import { socials } from "@/lib/socials";
import { ChartIcon, TelegramIcon, XIcon } from "./SocialIcons";

const links = [
  { href: "/", label: "Home" },
  { href: "/memes", label: "Meme Depot" },
  { href: "/lore", label: "Lore" },
];

const externalLinks = [
  { href: socials.dexscreener, label: "Chart", Icon: ChartIcon },
  { href: socials.x, label: "X", Icon: XIcon },
  { href: socials.telegram, label: "Telegram", Icon: TelegramIcon },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={clsx(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled ? "py-2" : "py-3"
      )}
    >
      <div className="mx-auto max-w-6xl px-4">
        <div
          className={clsx(
            "glass flex items-center justify-between rounded-full px-3 sm:px-4 transition-all duration-300",
            scrolled ? "py-1.5" : "py-2"
          )}
        >
          <Link
            href="/"
            className="flex items-center gap-2 pl-1 pr-2 group"
            aria-label="$BBALL home"
          >
            <span className="relative inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center">
              <BeachBallMark className="h-full w-full transition-transform duration-500 group-hover:rotate-180" />
            </span>
            <span className="font-semibold tracking-tight text-[var(--ink)]">
              <span className="opacity-60">$</span>BBALL
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => {
              const active =
                l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={clsx(
                    "relative px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors",
                    active
                      ? "text-[var(--ink)]"
                      : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                  )}
                >
                  {active && (
                    <span className="absolute inset-0 rounded-full bg-white/70 shadow-[0_4px_12px_-4px_rgba(8,50,80,0.25)]" />
                  )}
                  <span className="relative">{l.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden sm:flex items-center gap-1">
              {externalLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/55 text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-white transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            <Link href="/memes" className="btn-pop text-sm">
              Raid memes
              <span aria-hidden>→</span>
            </Link>

            <button
              type="button"
              aria-label="Toggle menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/60"
            >
              <span className="sr-only">Open menu</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                {open ? (
                  <>
                    <path d="M6 6l12 12" />
                    <path d="M18 6L6 18" />
                  </>
                ) : (
                  <>
                    <path d="M4 7h16" />
                    <path d="M4 12h16" />
                    <path d="M4 17h16" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden mt-2 glass rounded-3xl p-2">
            <nav className="flex flex-col">
              {links.map((l) => {
                const active =
                  l.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={clsx(
                      "px-4 py-2.5 rounded-2xl text-sm font-medium",
                      active
                        ? "bg-white/80 text-[var(--ink)]"
                        : "text-[var(--ink-soft)] hover:bg-white/60"
                    )}
                  >
                    {l.label}
                  </Link>
                );
              })}
              <div className="mx-2 my-1 h-px bg-black/10" />
              {externalLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-2xl text-sm font-medium text-[var(--ink-soft)] hover:bg-white/60 inline-flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </a>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
