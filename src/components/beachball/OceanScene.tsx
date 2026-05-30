"use client";

import { useEffect, useRef, useState } from "react";
import { BeachBall } from "./BeachBall";

/**
 * Full interactive ocean playground for the hero.
 * Renders sky, sun, water, ambient bubbles, and the playable BBALL.
 */
export function OceanScene({ minHeight = 560 }: { minHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

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

  // Surface line at ~52% so there is more underwater room than air,
  // emphasizing the slingshot.
  const surfaceY = Math.round(rect.h * 0.52);
  const ballSize = Math.max(96, Math.min(160, Math.round(rect.w * 0.13)));

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden rounded-[28px] border border-white/60 shadow-[0_30px_80px_-30px_rgba(8,50,80,0.35)]"
      style={{
        minHeight,
        height: "min(70vh, 720px)",
        background:
          "linear-gradient(180deg, var(--sky-1) 0%, var(--sky-2) 28%, var(--sky-3) 45%, var(--sky-4) 52%, var(--sky-4) 52%)",
      }}
    >
      {/* Sun */}
      <div
        aria-hidden
        className="absolute"
        style={{
          left: "12%",
          top: `${Math.max(40, surfaceY * 0.18)}px`,
          width: 220,
          height: 220,
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

      {/* Distant horizon mountains-as-clouds */}
      <div
        aria-hidden
        className="absolute left-0 right-0"
        style={{
          top: surfaceY - 30,
          height: 30,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.4) 70%, rgba(255,255,255,0.65) 100%)",
          filter: "blur(2px)",
        }}
      />

      {/* Water body */}
      <div
        aria-hidden
        className="absolute inset-x-0 under-water"
        style={{ top: surfaceY, bottom: 0 }}
      >
        {/* caustics */}
        <div
          className="absolute inset-0 opacity-25 mix-blend-screen"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 60px 24px at 20% 10%, rgba(255,255,255,0.7), transparent 60%), radial-gradient(ellipse 80px 30px at 70% 30%, rgba(255,255,255,0.55), transparent 60%), radial-gradient(ellipse 50px 22px at 40% 60%, rgba(255,255,255,0.6), transparent 60%), radial-gradient(ellipse 70px 28px at 85% 80%, rgba(255,255,255,0.45), transparent 60%)",
            backgroundSize: "240px 120px, 200px 100px, 240px 120px, 200px 100px",
            animation: "caustics-shift 14s linear infinite",
          }}
        />

        {/* Light rays */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background:
              "conic-gradient(from 90deg at 30% -10%, transparent 0 35deg, rgba(255,255,255,0.35) 38deg, transparent 42deg, transparent 60deg, rgba(255,255,255,0.25) 64deg, transparent 70deg)",
            mixBlendMode: "screen",
            filter: "blur(8px)",
          }}
        />

        {/* Ambient deep bubbles */}
        <AmbientBubbles
          width={rect.w || 1}
          height={rect.h - surfaceY || 1}
        />
      </div>

      {/* Wave surface (SVG) */}
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
        <g>
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
        </g>
      </svg>

      {/* Vignette / depth */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 110%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.0) 60%)",
        }}
      />

      {/* The interactive ball */}
      {rect.w > 0 && rect.h > 0 && (
        <BeachBall
          surfaceY={surfaceY}
          sceneWidth={rect.w}
          sceneHeight={rect.h}
          size={ballSize}
        />
      )}

      {/* Stats / scene chrome */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between text-xs sm:text-sm pointer-events-none">
        <div className="glass rounded-full px-3 py-1.5 text-[var(--ink-soft)]">
          <span className="font-mono opacity-70">scene</span> ·
          {" "}beach.bball.live
        </div>
        <div className="glass rounded-full px-3 py-1.5 text-[var(--ink-soft)]">
          floats forever <span aria-hidden>🌊</span>
        </div>
      </div>
    </div>
  );
}

function AmbientBubbles({ width, height }: { width: number; height: number }) {
  const bubbles = Array.from({ length: 14 }).map((_, i) => {
    const left = (i * 71) % 100;
    const size = 4 + ((i * 13) % 12);
    const delay = (i * 0.7) % 9;
    const duration = 9 + ((i * 5) % 7);
    return { left, size, delay, duration, key: i };
  });
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
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
      {/* unused width/height referenced to keep TS happy if extended later */}
      <span className="hidden">{width}{height}</span>
    </div>
  );
}
