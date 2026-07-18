import { useEffect, useState } from "react";

/**
 * Reads `prefers-reduced-motion: reduce` and subscribes to changes.
 *
 * CSS-driven animations/transitions are already collapsed globally in
 * `styles.css` under `@media (prefers-reduced-motion: reduce)`. This hook is
 * for JS-driven animations (typewriter effects, JS-scheduled pulses, canvas
 * loops) that CSS can't reach — they must short-circuit to the final state
 * when this returns `true`.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  return reduced;
}
