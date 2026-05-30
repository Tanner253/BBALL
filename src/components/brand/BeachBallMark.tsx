import { SVGProps } from "react";

/**
 * The official $BBALL emblem — a clean classic beachball.
 * Used inside nav, favicon, share images, etc.
 */
export function BeachBallMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" {...props} aria-hidden>
      <defs>
        <radialGradient id="bb-shade" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="55%" stopColor="rgba(255,255,255,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.25)" />
        </radialGradient>
        <clipPath id="bb-clip">
          <circle cx="50" cy="50" r="48" />
        </clipPath>
      </defs>

      <g clipPath="url(#bb-clip)">
        {/* base white */}
        <circle cx="50" cy="50" r="48" fill="#ffffff" />
        {/* 6 panels around vertical axis */}
        <path d="M50 2 A48 48 0 0 1 98 50 L50 50 Z" fill="var(--ball-red)" />
        <path d="M98 50 A48 48 0 0 1 78 91 L50 50 Z" fill="var(--ball-yellow)" />
        <path d="M78 91 A48 48 0 0 1 22 91 L50 50 Z" fill="var(--ball-green)" />
        <path d="M22 91 A48 48 0 0 1 2 50 L50 50 Z" fill="var(--ball-blue)" />
        <path d="M2 50 A48 48 0 0 1 50 2 L50 50 Z" fill="var(--ball-orange)" />

        {/* white cap on top */}
        <circle cx="50" cy="50" r="9" fill="#ffffff" />

        {/* shading */}
        <circle cx="50" cy="50" r="48" fill="url(#bb-shade)" />
      </g>

      <circle
        cx="50"
        cy="50"
        r="48"
        fill="none"
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="1"
      />
    </svg>
  );
}
