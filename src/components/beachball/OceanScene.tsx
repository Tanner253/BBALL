"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BeachBall } from "./BeachBall";

const LAUNCH_STORAGE_KEY = "bball:launches";

/**
 * Full-bleed hero scene. Renders one continuous vertical world:
 *   sky -> haze -> water surface -> water -> sand
 * The page background below the hero is the same sand color, so the
 * scene transitions out without a hard edge.
 */
export function OceanScene() {
  const ref = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [launches, setLaunches] = useState<number>(0);
  const [hydrated, setHydrated] = useState(false);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const update = () => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      setRect({ w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  // Hydrate the persisted launch count from localStorage.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LAUNCH_STORAGE_KEY);
      const n = raw ? parseInt(raw, 10) : 0;
      if (Number.isFinite(n) && n >= 0) setLaunches(n);
    } catch {
      // ignore — privacy mode, etc.
    }
    setHydrated(true);
  }, []);

  const handleLaunch = useCallback(() => {
    setLaunches((prev) => {
      const next = prev + 1;
      try {
        window.localStorage.setItem(LAUNCH_STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
    setPulse((p) => p + 1);
  }, []);

  // Surface line at ~58% — gives more sky for the hero text overlay
  // and enough water below for the slingshot to feel meaningful.
  const surfaceY = Math.round(rect.h * 0.58);
  const sandY = Math.round(rect.h * 0.93);
  const ballSize = Math.max(96, Math.min(170, Math.round(rect.w * 0.11)));

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden"
      style={{
        height: "min(100svh, 920px)",
        minHeight: 600,
        // Continuous sky -> water -> sand gradient. Last stop matches body bg.
        background: `linear-gradient(180deg,
          var(--sky-1) 0%,
          var(--sky-2) 18%,
          var(--sky-3) 32%,
          var(--sky-4) 48%,
          var(--water-shallow) 58%,
          var(--water-mid) 70%,
          var(--water-deep) 86%,
          var(--sand-shadow) 95%,
          var(--sand-light) 100%)`,
      }}
    >
      {/* Sun */}
      <div
        aria-hidden
        className="absolute"
        style={{
          left: "14%",
          top: `${Math.max(60, surfaceY * 0.22)}px`,
          width: 240,
          height: 240,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="absolute inset-0 sun-glow rounded-full" />
        <div
          className="absolute inset-8 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 35%, #fff8c2 0%, #ffd36a 60%, #ff9a4d 100%)",
            boxShadow:
              "0 0 60px rgba(255, 200, 120, 0.65), 0 0 120px rgba(255, 160, 100, 0.45)",
          }}
        />
      </div>

      {/* Soft haze over the horizon */}
      <div
        aria-hidden
        className="absolute left-0 right-0"
        style={{
          top: surfaceY - 36,
          height: 36,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.4) 70%, rgba(255,255,255,0.6) 100%)",
          filter: "blur(2px)",
        }}
      />

      {/* Caustics (light dapples on water) */}
      <div
        aria-hidden
        className="absolute inset-x-0 mix-blend-screen pointer-events-none"
        style={{
          top: surfaceY,
          bottom: rect.h - sandY,
          opacity: 0.22,
          backgroundImage:
            "radial-gradient(ellipse 60px 24px at 20% 10%, rgba(255,255,255,0.7), transparent 60%), radial-gradient(ellipse 80px 30px at 70% 30%, rgba(255,255,255,0.55), transparent 60%), radial-gradient(ellipse 50px 22px at 40% 60%, rgba(255,255,255,0.6), transparent 60%), radial-gradient(ellipse 70px 28px at 85% 80%, rgba(255,255,255,0.45), transparent 60%)",
          backgroundSize: "240px 120px, 200px 100px, 240px 120px, 200px 100px",
          animation: "caustics-shift 14s linear infinite",
        }}
      />

      {/* Light rays */}
      <div
        aria-hidden
        className="absolute inset-x-0 pointer-events-none"
        style={{
          top: surfaceY,
          bottom: rect.h - sandY,
          opacity: 0.22,
          background:
            "conic-gradient(from 90deg at 30% -10%, transparent 0 35deg, rgba(255,255,255,0.35) 38deg, transparent 42deg, transparent 60deg, rgba(255,255,255,0.25) 64deg, transparent 70deg)",
          mixBlendMode: "screen",
          filter: "blur(8px)",
        }}
      />

      {/* Ambient deep bubbles */}
      <AmbientBubbles
        topY={surfaceY}
        bottomY={sandY}
        width={rect.w || 1}
      />

      {/* Surface waves */}
      <svg
        className="absolute left-0 right-0 pointer-events-none"
        style={{ top: surfaceY - 18 }}
        height={36}
        width="100%"
        preserveAspectRatio="none"
        viewBox="0 0 1200 36"
      >
        <defs>
          <linearGradient id="wave-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
          </linearGradient>
        </defs>
        <path
          d="M0,18 C150,2 300,34 450,18 C600,2 750,34 900,18 C1050,2 1200,34 1200,18 L1200,36 L0,36 Z"
          fill="url(#wave-fade)"
          opacity="0.6"
        >
          <animate
            attributeName="d"
            dur="6s"
            repeatCount="indefinite"
            values="
              M0,18 C150,2 300,34 450,18 C600,2 750,34 900,18 C1050,2 1200,34 1200,18 L1200,36 L0,36 Z;
              M0,18 C150,34 300,2 450,18 C600,34 750,2 900,18 C1050,34 1200,2 1200,18 L1200,36 L0,36 Z;
              M0,18 C150,2 300,34 450,18 C600,2 750,34 900,18 C1050,2 1200,34 1200,18 L1200,36 L0,36 Z"
          />
        </path>
      </svg>

      {/* Wet-sand line (transition between deep water and sand) */}
      <div
        aria-hidden
        className="absolute inset-x-0 pointer-events-none"
        style={{
          top: sandY - 24,
          height: 24,
          background:
            "linear-gradient(180deg, rgba(216,180,106,0.0) 0%, rgba(216,180,106,0.45) 100%)",
        }}
      />

      {/* The interactive ball */}
      {rect.w > 0 && rect.h > 0 && (
        <BeachBall
          surfaceY={surfaceY}
          sceneWidth={rect.w}
          sceneHeight={sandY}
          size={ballSize}
          onLaunchOffscreen={handleLaunch}
        />
      )}

      {/* Launch counter (top-right) */}
      {hydrated && (
        <div
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 pointer-events-none"
          aria-live="polite"
        >
          <div
            key={pulse}
            className="glass rounded-full px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-2 text-[var(--ink)] shadow-[0_8px_22px_-8px_rgba(8,40,80,0.35)] launch-pulse"
            title="Launches"
          >
            <span aria-hidden className="text-base sm:text-lg leading-none">🏆</span>
            <span className="font-mono text-xs sm:text-sm uppercase tracking-[0.18em] opacity-70">
              launches
            </span>
            <span className="font-bold tabular-nums text-sm sm:text-base">
              {launches}
            </span>
          </div>
        </div>
      )}

      {/* Zero-state hint — placed just below the surface, in the water,
          so it never collides with hero CTAs on small screens. */}
      {hydrated && launches === 0 && (
        <div
          className="absolute inset-x-0 z-10 pointer-events-none flex justify-center px-4"
          style={{ top: surfaceY + Math.round((sandY - surfaceY) * 0.18) }}
        >
          <div
            className="rounded-full px-3.5 py-2 text-[11px] sm:text-sm text-[var(--ink)] flex items-center gap-2 launch-hint border border-white/70 shadow-[0_10px_28px_-8px_rgba(8,40,80,0.45)] max-w-[92vw] text-center"
            style={{ background: "rgba(255,255,255,0.92)" }}
          >
            <span aria-hidden>👇</span>
            <span className="font-medium leading-tight">
              push the beachball underwater and see what happens
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function AmbientBubbles({
  topY,
  bottomY,
  width,
}: {
  topY: number;
  bottomY: number;
  width: number;
}) {
  const bubbles = Array.from({ length: 16 }).map((_, i) => {
    const left = (i * 71) % 100;
    const size = 4 + ((i * 13) % 12);
    const delay = (i * 0.7) % 9;
    const duration = 9 + ((i * 5) % 7);
    return { left, size, delay, duration, key: i };
  });
  return (
    <div
      className="absolute inset-x-0 pointer-events-none"
      style={{ top: topY, height: bottomY - topY }}
      aria-hidden
    >
      {bubbles.map((b) => (
        <span
          key={b.key}
          className="absolute rounded-full"
          style={{
            left: `${b.left}%`,
            bottom: -20,
            width: b.size,
            height: b.size,
            background:
              "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0.15))",
            border: "1px solid rgba(255,255,255,0.55)",
            animation: `bubble-rise ${b.duration}s linear ${b.delay}s infinite`,
          }}
        />
      ))}
      <span className="hidden">{width}</span>
    </div>
  );
}
