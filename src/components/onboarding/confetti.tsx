import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "@/lib/reduced-motion";

/**
 * Confetti — finish screens only (§6.4). ~60 absolutely-positioned particles,
 * pure CSS keyframes, one-time render; the container unmounts after 2.8s.
 * Never renders under prefers-reduced-motion.
 */
const COLORS = ["#069494", "#d9f3f3", "#d97706", "#ffffff"];

interface Particle {
  left: number; // vw, across top 20% spawn band
  size: number; // 6–10px
  round: boolean;
  color: string;
  delay: number; // s
  duration: number; // 1.8–2.6s
  drift: number; // px
}

export function Confetti() {
  const reduced = useReducedMotion();
  const [gone, setGone] = useState(false);

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        left: (i * 37) % 100,
        size: 6 + ((i * 13) % 5),
        round: i % 3 === 0,
        color: COLORS[i % COLORS.length],
        delay: ((i * 29) % 40) / 100,
        duration: 1.8 + ((i * 17) % 80) / 100,
        drift: ((i * 53) % 120) - 60,
      })),
    [],
  );

  useEffect(() => {
    const t = setTimeout(() => setGone(true), 2800);
    return () => clearTimeout(t);
  }, []);

  if (reduced || gone) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {particles.map((p, i) => (
        <span
          key={i}
          className="onb-confetti"
          style={{
            left: `${p.left}vw`,
            width: p.size,
            height: p.round ? p.size : p.size * 1.6,
            backgroundColor: p.color,
            borderRadius: p.round ? "50%" : 2,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ["--drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
