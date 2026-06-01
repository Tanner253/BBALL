"use client";

import { useEffect, useRef } from "react";
import { BeachBallMark } from "@/components/brand/BeachBallMark";

/**
 * Custom site-wide cursor: a tiny spinning beachball that follows the mouse.
 *
 * - Disabled on coarse-pointer (touch) devices and viewports under md so it
 *   never harms mobile UX.
 * - Hides the system cursor only when active, via the `bb-cursor-active`
 *   class on <body>.
 * - Smoothly lerps to the mouse position with rAF for buttery 60fps motion.
 * - Grows + glows when hovering interactive elements for affordance.
 */
export function BeachBallCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const posRef = useRef({ x: 0, y: 0 });
  const visibleRef = useRef(false);
  const interactiveRef = useRef(false);
  const pressedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const supportsFine = window.matchMedia("(pointer: fine)").matches;
    if (!supportsFine) return;

    document.body.classList.add("bb-cursor-active");

    const interactiveSelector =
      'a, button, [role="button"], input, textarea, select, label, summary, [data-cursor="interactive"]';

    const onMove = (e: MouseEvent) => {
      targetRef.current.x = e.clientX;
      targetRef.current.y = e.clientY;

      if (!visibleRef.current) {
        posRef.current.x = e.clientX;
        posRef.current.y = e.clientY;
        visibleRef.current = true;
        ref.current?.style.setProperty("--bb-cursor-opacity", "1");
      }

      const t = e.target as HTMLElement | null;
      interactiveRef.current = !!(t && t.closest(interactiveSelector));
    };

    const onLeave = () => {
      visibleRef.current = false;
      ref.current?.style.setProperty("--bb-cursor-opacity", "0");
    };

    const onDown = () => {
      pressedRef.current = true;
    };
    const onUp = () => {
      pressedRef.current = false;
    };

    const tick = () => {
      const lerp = 0.28;
      posRef.current.x += (targetRef.current.x - posRef.current.x) * lerp;
      posRef.current.y += (targetRef.current.y - posRef.current.y) * lerp;

      const el = ref.current;
      if (el) {
        el.style.setProperty("--bb-cursor-x", `${posRef.current.x}px`);
        el.style.setProperty("--bb-cursor-y", `${posRef.current.y}px`);
        const scale = pressedRef.current
          ? 0.85
          : interactiveRef.current
          ? 1.45
          : 1;
        el.style.setProperty("--bb-cursor-scale", scale.toString());
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onMove);

    return () => {
      document.body.classList.remove("bb-cursor-active");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="bb-cursor">
      <div className="bb-cursor-spin">
        <BeachBallMark className="w-full h-full" />
      </div>
    </div>
  );
}
