"use client";

import { useEffect, useRef } from "react";

/**
 * Custom site-wide cursor: a tiny spinning beachball that follows the mouse.
 *
 * Performance notes:
 *  - Position is written directly to a CSS variable on every `mousemove`.
 *    No rAF, no lerp — that means zero perceived lag vs. the OS cursor.
 *  - Hover affordance is detected via `mouseover` (fires only on element
 *    boundary changes), not `mousemove`. `closest()` runs orders of
 *    magnitude less often.
 *  - The ball itself is a CSS conic-gradient on a single element, so the
 *    spin animation rotates one rasterized layer instead of repainting an
 *    SVG with gradients/clipPaths every frame.
 *  - Scale (hover/press feedback) is its own nested element with a CSS
 *    transition, so position writes never trigger a transform animation.
 */
export function BeachBallCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    document.body.classList.add("bb-cursor-active");

    const el = ref.current;
    if (!el) return;

    const interactiveSelector =
      'a, button, [role="button"], input, textarea, select, label, summary, [data-cursor="interactive"]';

    let interactive = false;
    let pressed = false;

    const updateScale = () => {
      el.style.setProperty(
        "--bb-cursor-scale",
        pressed ? "0.82" : interactive ? "1.42" : "1"
      );
    };

    const onMove = (e: MouseEvent) => {
      el.style.setProperty("--bb-cursor-x", `${e.clientX}px`);
      el.style.setProperty("--bb-cursor-y", `${e.clientY}px`);
      el.style.setProperty("--bb-cursor-opacity", "1");
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as Element | null;
      const next = !!(t && t.closest && t.closest(interactiveSelector));
      if (next !== interactive) {
        interactive = next;
        updateScale();
      }
    };

    const onLeave = () => {
      el.style.setProperty("--bb-cursor-opacity", "0");
    };

    const onDown = () => {
      pressed = true;
      updateScale();
    };
    const onUp = () => {
      pressed = false;
      updateScale();
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    window.addEventListener("mousedown", onDown, { passive: true });
    window.addEventListener("mouseup", onUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      document.body.classList.remove("bb-cursor-active");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="bb-cursor">
      <div className="bb-cursor-scale">
        <div className="bb-cursor-spin">
          <div className="bb-cursor-ball" />
        </div>
      </div>
    </div>
  );
}
