"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createInitialState,
  launch,
  Phase,
  startCharge,
  step,
  type GameState,
} from "./engine";
import { createCamera, drawFrame, updateCamera } from "./render";
import { SubmitPanel, type RunResult } from "./SubmitPanel";
import { startRun } from "@/lib/api";

export function LaunchGame() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const camRef = useRef(createCamera());
  const holdingRef = useRef(false);
  // One-time server token proving when this run started (anti-cheat).
  const runTokenRef = useRef<string | null>(null);

  // Fast-changing HUD numbers are written straight to the DOM (no re-render).
  const distRef = useRef<HTMLSpanElement>(null);
  const statsRef = useRef<HTMLSpanElement>(null);
  const powerRef = useRef<HTMLDivElement>(null);
  const powerWrapRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const flashTextRef = useRef<HTMLSpanElement>(null);

  const [phase, setPhase] = useState<Phase>("ready");
  const [result, setResult] = useState<RunResult | null>(null);

  // ---------------- Game loop ----------------
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    let lastPhase: Phase = stateRef.current.phase;

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const s = stateRef.current;

      step(s, dt, holdingRef.current);

      if (s.phase !== lastPhase) {
        lastPhase = s.phase;
        setPhase(s.phase);
        if (s.phase === "over") {
          setResult({
            distance: Math.round(s.distance),
            coins: s.coins,
            skips: s.skips,
            bestCombo: s.bestCombo,
            maxAlt: Math.round(s.maxAlt),
            maxSpeed: Math.round(s.maxSpeed * 3.6), // m/s -> km/h
          });
        }
      }

      // Resize to wrapper + device pixel ratio.
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      updateCamera(camRef.current, s, w, h, dt);
      drawFrame(ctx, s, camRef.current, w, h);

      // HUD writes.
      if (distRef.current) {
        distRef.current.textContent = `${Math.round(s.distance)}m`;
      }
      if (statsRef.current) {
        const speed = Math.round(Math.hypot(s.ball.vx, s.ball.vy) * 3.6);
        statsRef.current.textContent = `$${s.coins} · ${s.skips} skips · ${speed} km/h`;
      }
      if (powerWrapRef.current) {
        powerWrapRef.current.style.opacity = s.phase === "charging" ? "1" : "0";
      }
      if (powerRef.current && s.phase === "charging") {
        powerRef.current.style.width = `${Math.round(s.charge * 100)}%`;
      }
      if (flashRef.current) {
        flashRef.current.style.opacity = s.perfectFlash > 0 ? "1" : "0";
      }
      if (flashTextRef.current && s.perfectFlash > 0) {
        flashTextRef.current.textContent = `PERFECT SKIP ×${s.combo}`;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ---------------- Input ----------------
  const press = useCallback(() => {
    const s = stateRef.current;
    if (s.phase === "ready") startCharge(s);
    holdingRef.current = true;
  }, []);

  const release = useCallback(() => {
    const s = stateRef.current;
    if (s.phase === "charging") {
      launch(s);
      // Token is fetched at launch so the server can time the run.
      runTokenRef.current = null;
      startRun().then((token) => {
        runTokenRef.current = token;
      });
    }
    holdingRef.current = false;
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        press();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        release();
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [press, release]);

  const reset = useCallback(() => {
    stateRef.current = createInitialState();
    camRef.current = createCamera();
    holdingRef.current = false;
    runTokenRef.current = null;
    setResult(null);
    setPhase("ready");
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden rounded-3xl border border-white/60 shadow-[0_24px_60px_-24px_rgba(8,40,80,0.45)] select-none"
      style={{ height: "min(72svh, 640px)", minHeight: 420, touchAction: "none" }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        onPointerDown={(e) => {
          e.preventDefault();
          press();
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onPointerLeave={() => {
          if (stateRef.current.phase === "flying") holdingRef.current = false;
        }}
      />

      {/* HUD: live stats (top-left) */}
      <div className="absolute left-3 top-3 sm:left-4 sm:top-4 pointer-events-none">
        <div className="glass rounded-2xl px-3.5 py-2">
          <span
            ref={distRef}
            className="block text-display text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tabular-nums"
          >
            0m
          </span>
          <span
            ref={statsRef}
            className="block font-mono text-[10px] sm:text-xs text-[var(--ink-soft)] tabular-nums"
          >
            $0 · 0 skips · 0 km/h
          </span>
        </div>
      </div>

      {/* Perfect-skip flash */}
      <div
        ref={flashRef}
        className="absolute inset-x-0 top-[22%] text-center pointer-events-none transition-opacity duration-300"
        style={{ opacity: 0 }}
      >
        <span
          ref={flashTextRef}
          className="text-display text-2xl sm:text-4xl font-extrabold shimmer-text drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]"
        >
          PERFECT SKIP
        </span>
      </div>

      {/* Power bar (visible while charging) */}
      <div
        ref={powerWrapRef}
        className="absolute inset-x-0 bottom-5 flex justify-center pointer-events-none transition-opacity duration-200"
        style={{ opacity: 0 }}
      >
        <div className="glass rounded-2xl px-3 py-2 w-[min(440px,82%)]">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--ink-soft)]">
              power
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--ball-green)] font-bold">
              release on green arrow
            </span>
          </div>
          <div className="rounded-full bg-white/50 p-0.5">
            <div
              ref={powerRef}
              className="h-3.5 rounded-full transition-none"
              style={{
                width: "0%",
                background:
                  "linear-gradient(90deg, var(--ball-green), var(--ball-yellow), var(--ball-orange), var(--ball-red))",
              }}
            />
          </div>
        </div>
      </div>

      {/* Ready overlay — anchored right so it never covers the ball. */}
      {phase === "ready" && (
        <div className="absolute right-3 sm:right-5 top-[16%] sm:top-[22%] max-w-[240px] sm:max-w-[280px] pointer-events-none">
          <div className="glass-strong rounded-2xl px-4 py-3.5 launch-hint">
            <p className="font-semibold text-sm text-[var(--ink)]">
              <span aria-hidden>👈</span> Hold the ball under · release to launch
            </p>
            <p className="mt-1.5 text-xs text-[var(--ink-soft)] leading-relaxed">
              Release when the arrow is <span className="font-semibold text-[var(--ball-green)]">green</span>.
              Mid-air, <span className="font-semibold">hold</span> to dive — land shallow to{" "}
              <span className="font-semibold">skip</span>. Chain{" "}
              <span className="font-semibold text-[var(--ball-orange)]">rings</span> and{" "}
              <span className="font-semibold text-[#9a6a00]">jetstreams</span> into space; dodge{" "}
              <span className="font-semibold text-[var(--ball-red)]">candles</span> and{" "}
              <span className="font-semibold text-[#5a6474]">storms</span>.
            </p>
          </div>
        </div>
      )}

      {/* Game-over overlay */}
      {phase === "over" && result && (
        <SubmitPanel result={result} runToken={runTokenRef.current} onRetry={reset} />
      )}
    </div>
  );
}
