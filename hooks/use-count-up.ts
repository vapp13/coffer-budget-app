"use client";

import { useEffect, useRef, useState } from "react";

/** Animates from the previous value to `target` over `durationMs`. */
export function useCountUp(target: number, durationMs = 500): number {
  const [value, setValue] = useState(target);
  const previousTarget = useRef(target);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setValue(target);
      previousTarget.current = target;
      return;
    }

    const start = previousTarget.current;
    const change = target - start;
    if (change === 0) return;

    const startTime = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - startTime) / durationMs, 1);
      // Ease-out cubic — starts fast, settles gently.
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + change * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        previousTarget.current = target;
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return value;
}
