"use client";

import { motion, useMotionValue } from "framer-motion";
import {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type Props = {
  size?: number;
  className?: string;
  style?: CSSProperties;
  /**
   * Y position (in pixels relative to the top of the parent scene) where the
   * water surface lives. Below this is "underwater", above is "air".
   */
  surfaceY: number;
  /** Optional height of the playable scene */
  sceneHeight: number;
  sceneWidth: number;
  /**
   * Fires once each time the ball was submerged and then escapes the top
   * of the scene (i.e. flies up off the screen, past the navbar).
   */
  onLaunchOffscreen?: () => void;
};

/**
 * The interactive beachball.
 *
 * Behavior:
 *  - Floats in the air, gently bobbing on the water surface.
 *  - User can grab + drag it ANYWHERE in the scene.
 *  - While dragged underwater, bubbles erupt and the buoyancy charges up.
 *  - On release: physics takes over. Underwater = slingshot upward proportional
 *    to depth + the user's drag velocity. In air = ballistic with gravity,
 *    splashes back into the water, and rests bobbing on the surface.
 */
export function BeachBall({
  size = 120,
  surfaceY,
  sceneHeight,
  sceneWidth,
  onLaunchOffscreen,
  className,
  style,
}: Props) {
  // Latest callback ref so the physics loop always sees the current handler
  // without re-subscribing on every parent render.
  const onLaunchRef = useRef(onLaunchOffscreen);
  useEffect(() => {
    onLaunchRef.current = onLaunchOffscreen;
  }, [onLaunchOffscreen]);

  // Tracks whether the ball is "armed" for a launch — set when it gets dunked,
  // consumed when it flies off the top.
  const armedRef = useRef(false);
  const launchedThisFlightRef = useRef(false);
  // Position (top-left of ball element relative to scene)
  const x = useMotionValue(sceneWidth / 2 - size / 2);
  const y = useMotionValue(surfaceY - size * 0.6); // resting just on water

  // Velocity tracked manually for slingshot release
  const vx = useRef(0);
  const vy = useRef(0);

  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const lastPointer = useRef<{ x: number; y: number; t: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const [bubbles, setBubbles] = useState<
    { id: number; x: number; y: number; r: number; life: number }[]
  >([]);
  const bubbleId = useRef(0);

  const [splashes, setSplashes] = useState<
    { id: number; x: number; y: number; born: number }[]
  >([]);
  const splashId = useRef(0);

  // Smooth driven rotation that integrates spin from drag/velocity
  const spin = useMotionValue(0);

  // ---------------- Physics loop ----------------
  useEffect(() => {
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const px = x.get();
      const py = y.get();

      const cx = px + size / 2;
      const cy = py + size / 2;

      const underwater = cy > surfaceY;

      if (!draggingRef.current) {
        // Forces
        const gravity = 1400; // px/s^2
        const buoyancy = 2600; // px/s^2 when fully submerged
        const dragAir = 0.2; // 1/s damping
        const dragWater = 2.6; // strong damping in water

        // Buoyancy scales with how submerged the ball is
        const submerged = Math.min(
          1,
          Math.max(0, (cy - (surfaceY - size / 2)) / size)
        );

        let ay = gravity - buoyancy * submerged;
        const ax = 0;

        vx.current += ax * dt;
        vy.current += ay * dt;

        // Damping
        const drag = submerged > 0.02 ? dragWater : dragAir;
        vx.current *= Math.exp(-drag * dt);
        vy.current *= Math.exp(-drag * dt);

        // Surface tension: when nearly at rest near surface, gently settle
        if (Math.abs(vy.current) < 6 && submerged > 0.25 && submerged < 0.75) {
          const target = surfaceY - size * 0.35; // resting line
          vy.current += (target - py) * dt * 4;
        }

        // Integrate
        let nx = px + vx.current * dt;
        let ny = py + vy.current * dt;

        // Walls
        if (nx < 0) {
          nx = 0;
          vx.current = Math.abs(vx.current) * 0.55;
        } else if (nx + size > sceneWidth) {
          nx = sceneWidth - size;
          vx.current = -Math.abs(vx.current) * 0.55;
        }

        // Floor (sea floor)
        if (ny + size > sceneHeight) {
          ny = sceneHeight - size;
          vy.current = -Math.abs(vy.current) * 0.4;
        }

        // Ceiling (sky cap). Set generously high so a full slingshot really
        // launches the ball way off-screen before gravity drags it back.
        const ceiling = -size * 8;
        if (ny < ceiling) {
          ny = ceiling;
          vy.current = Math.abs(vy.current) * 0.4;
        }

        // Splash on surface crossing (downward)
        const wasUnder = py + size / 2 > surfaceY;
        const isUnder = ny + size / 2 > surfaceY;
        if (!wasUnder && isUnder && vy.current > 240) {
          splashId.current += 1;
          const id = splashId.current;
          setSplashes((s) => [
            ...s,
            { id, x: nx + size / 2, y: surfaceY, born: now },
          ]);
          setTimeout(() => {
            setSplashes((s) => s.filter((sp) => sp.id !== id));
          }, 900);
        }
        // Splash on surface crossing (upward — emerging)
        if (wasUnder && !isUnder && vy.current < -300) {
          splashId.current += 1;
          const id = splashId.current;
          setSplashes((s) => [
            ...s,
            { id, x: nx + size / 2, y: surfaceY, born: now },
          ]);
          setTimeout(() => {
            setSplashes((s) => s.filter((sp) => sp.id !== id));
          }, 900);
        }

        x.set(nx);
        y.set(ny);

        // Spin from horizontal velocity (visual only)
        spin.set(spin.get() + vx.current * dt * 0.6);

        // ----- Launch detection -----
        // Arm whenever the ball is submerged: a real launch must originate
        // from underwater.
        if (ny + size / 2 > surfaceY) {
          armedRef.current = true;
          launchedThisFlightRef.current = false;
        }
        // Fire once when the ball escapes the top of the scene (off-screen,
        // past where the navbar sits over the hero).
        if (
          armedRef.current &&
          !launchedThisFlightRef.current &&
          ny + size < 0
        ) {
          launchedThisFlightRef.current = true;
          armedRef.current = false;
          onLaunchRef.current?.();
        }
      } else {
        // Re-arm while the user is dunking the ball under the surface.
        if (y.get() + size / 2 > surfaceY) {
          armedRef.current = true;
          launchedThisFlightRef.current = false;
        }
      }

      // Bubbles spawn while underwater (especially while dragging deep)
      if (underwater) {
        const depth = (cy - surfaceY) / Math.max(1, sceneHeight - surfaceY);
        const rate = draggingRef.current ? 0.55 + depth * 1.2 : 0.05 + depth * 0.25;
        if (Math.random() < rate * dt * 30) {
          bubbleId.current += 1;
          const id = bubbleId.current;
          const bx = cx + (Math.random() - 0.5) * size * 0.7;
          const by = cy + (Math.random() - 0.4) * size * 0.4;
          const r = 2 + Math.random() * 6;
          setBubbles((b) => [...b, { id, x: bx, y: by, r, life: now }]);
          setTimeout(() => {
            setBubbles((b) => b.filter((bb) => bb.id !== id));
          }, 1800);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surfaceY, sceneWidth, sceneHeight, size]);

  // Re-center if scene resizes meaningfully
  useEffect(() => {
    const cx = x.get() + size / 2;
    if (cx > sceneWidth) {
      x.set(Math.max(0, sceneWidth - size));
    }
  }, [sceneWidth, size, x]);

  // ---------------- Pointer handlers ----------------
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    draggingRef.current = true;
    setDragging(true);
    vx.current = 0;
    vy.current = 0;
    lastPointer.current = { x: e.clientX, y: e.clientY, t: performance.now() };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const rect = containerRef.current?.parentElement?.getBoundingClientRect();
    if (!rect) return;

    const newX = Math.max(
      0,
      Math.min(sceneWidth - size, e.clientX - rect.left - size / 2)
    );
    const newY = Math.max(
      -size * 0.5,
      Math.min(sceneHeight - size, e.clientY - rect.top - size / 2)
    );

    // velocity tracking
    const now = performance.now();
    if (lastPointer.current) {
      const dt = Math.max(0.001, (now - lastPointer.current.t) / 1000);
      vx.current = ((e.clientX - lastPointer.current.x) / dt);
      vy.current = ((e.clientY - lastPointer.current.y) / dt);
    }
    lastPointer.current = { x: e.clientX, y: e.clientY, t: now };

    x.set(newX);
    y.set(newY);
    spin.set(spin.get() + (e.movementX || 0) * 0.4);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    draggingRef.current = false;
    setDragging(false);

    const cy = y.get() + size / 2;
    const depth = Math.max(0, cy - surfaceY);
    const maxDepth = sceneHeight - surfaceY;
    const submerged = Math.min(1, depth / Math.max(1, maxDepth));

    if (submerged > 0.05) {
      // SLINGSHOT: scale upward velocity by depth + a bonus from drag motion.
      // Tuned so even a shallow dunk launches the ball off-screen, and a
      // full-depth dunk slingshots it well past the navbar.
      const baseLaunch = 1100; // baseline upward speed
      const depthBonus = submerged * 2800; // deeper = harder
      const userImpulse = Math.max(0, -vy.current) * 0.55; // honor user pull
      vy.current = -(baseLaunch + depthBonus + userImpulse);

      // Slight horizontal bonus from user motion
      vx.current = vx.current * 0.6;
    }
    // If above water on release, it just falls naturally (gravity already in loop)
    lastPointer.current = null;
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "absolute", inset: 0, ...style }}
    >
      {/* Bubbles layer */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={sceneWidth}
        height={sceneHeight}
      >
        {bubbles.map((b) => (
          <circle
            key={b.id}
            cx={b.x}
            cy={b.y}
            r={b.r}
            fill="rgba(255,255,255,0.55)"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="1"
            style={{
              transformOrigin: `${b.x}px ${b.y}px`,
              animation: `bubble-rise ${1.4 + Math.random() * 0.6}s ease-out forwards`,
            }}
          />
        ))}
        {/* Splashes */}
        {splashes.map((s) => (
          <SplashSVG key={s.id} cx={s.x} cy={s.y} />
        ))}
      </svg>

      {/* The ball */}
      <motion.div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          x,
          y,
          width: size,
          height: size,
          rotate: spin,
          touchAction: "none",
          cursor: dragging ? "grabbing" : "grab",
          filter: dragging
            ? "drop-shadow(0 16px 24px rgba(8,40,80,0.45))"
            : "drop-shadow(0 12px 22px rgba(8,40,80,0.30))",
          willChange: "transform",
        }}
        className="absolute select-none"
      >
        <BeachBallArt />
      </motion.div>
    </div>
  );
}

function SplashSVG({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g style={{ animation: "splash-fade 900ms ease-out forwards" }}>
      {[...Array(7)].map((_, i) => {
        const angle = (i / 7) * Math.PI - Math.PI;
        const dist = 22 + Math.random() * 26;
        const x2 = cx + Math.cos(angle) * dist;
        const y2 = cy + Math.sin(angle) * dist * 0.7;
        return (
          <circle
            key={i}
            cx={x2}
            cy={y2}
            r={2.5 + Math.random() * 2.5}
            fill="rgba(255,255,255,0.85)"
          />
        );
      })}
      <ellipse
        cx={cx}
        cy={cy}
        rx={36}
        ry={5}
        fill="none"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="2"
      />
      <style>{`
        @keyframes splash-fade {
          0% { opacity: 1; transform: translateY(0) scale(0.9); }
          100% { opacity: 0; transform: translateY(-10px) scale(1.4); }
        }
      `}</style>
    </g>
  );
}

/**
 * The big version of the beachball, used for the playable hero.
 * Uses the same panels as the brand mark but at higher detail.
 */
function BeachBallArt() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <defs>
        <radialGradient id="bb-light" cx="32%" cy="28%" r="80%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="40%" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.30)" />
        </radialGradient>
        <linearGradient id="bb-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.65)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
        </linearGradient>
        <clipPath id="bb-clip-2">
          <circle cx="50" cy="50" r="48" />
        </clipPath>
      </defs>

      <g clipPath="url(#bb-clip-2)">
        <circle cx="50" cy="50" r="48" fill="#ffffff" />
        <path d="M50 2 A48 48 0 0 1 98 50 L50 50 Z" fill="var(--ball-red)" />
        <path d="M98 50 A48 48 0 0 1 78 91 L50 50 Z" fill="var(--ball-yellow)" />
        <path d="M78 91 A48 48 0 0 1 22 91 L50 50 Z" fill="var(--ball-green)" />
        <path d="M22 91 A48 48 0 0 1 2 50 L50 50 Z" fill="var(--ball-blue)" />
        <path d="M2 50 A48 48 0 0 1 50 2 L50 50 Z" fill="var(--ball-orange)" />

        {/* white cap on top (looks like a button) */}
        <circle cx="50" cy="50" r="9" fill="#ffffff" />
        <circle cx="50" cy="50" r="9" fill="none" stroke="rgba(0,0,0,0.12)" />

        {/* highlight */}
        <circle cx="50" cy="50" r="48" fill="url(#bb-light)" />
        {/* specular */}
        <ellipse cx="34" cy="28" rx="14" ry="7" fill="rgba(255,255,255,0.55)" />
      </g>
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="none"
        stroke="url(#bb-rim)"
        strokeWidth="1.2"
      />
    </svg>
  );
}
