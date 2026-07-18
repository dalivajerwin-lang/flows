import { useEffect, useState } from "react";
import { useSettings } from "@/stores/settings-store";

/**
 * SplashScreen — native-app-style launch screen.
 * Matches the PWA manifest (background #111827, theme #069494) so the
 * transition from the OS-drawn splash into this one is seamless.
 */
export function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [fading, setFading] = useState(false);
  const [hide, setHide] = useState(false);
  const markShown = useSettings((s) => s.markSplashShown);

  useEffect(() => {
    setMounted(true);
    const fadeTimer = setTimeout(() => setFading(true), 1450);
    const hideTimer = setTimeout(() => {
      setHide(true);
      markShown();
    }, 1700);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [markShown]);

  if (!mounted || hide) return null;

  return (
    <div
      aria-hidden="true"
      data-splash
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between overflow-hidden bg-[var(--color-sidebar)] transition-opacity duration-250"
      style={{ opacity: fading ? 0 : 1 }}
    >
      {/* Soft brand glow behind the icon, like ambient light on native splashes */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(6,148,148,0.22) 0%, rgba(6,148,148,0.06) 45%, transparent 70%)",
          animation: "splash-glow 1600ms ease-in-out infinite alternate",
        }}
      />

      {/* Top spacer keeps the icon block optically centered (footer offsets it) */}
      <div />

      <div className="relative flex flex-col items-center">
        {/* App icon with native-style rounded mask, pop-in + settle */}
        <div
          className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[22.5%] shadow-[0_8px_32px_rgba(0,0,0,0.45)] ring-1 ring-white/10"
          style={{ animation: "splash-icon-in 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both" }}
        >
          <img src="/icons/icon-512.png" alt="" className="h-full w-full object-cover" />
        </div>

        <span
          className="mt-5 text-[26px] font-bold tracking-tight text-white"
          style={{ animation: "splash-rise 450ms ease-out 150ms both" }}
        >
          Tenacious
        </span>
        <span
          className="mt-1 text-[13px] font-medium tracking-wide text-white/45"
          style={{ animation: "splash-rise 450ms ease-out 250ms both" }}
        >
          Real Estate CRM
        </span>

        {/* Native-style activity spinner */}
        <div
          className="mt-8 h-6 w-6 rounded-full border-2 border-white/15 border-t-[var(--color-primary)]"
          style={{
            animation: "splash-spin 800ms linear infinite, splash-rise 400ms ease-out 400ms both",
          }}
        />
      </div>

      {/* Footer — the "from Meta"-style brand lockup real apps use */}
      <div
        className="relative mb-10 flex flex-col items-center gap-1"
        style={{ animation: "splash-rise 500ms ease-out 550ms both" }}
      >
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/35">
          from
        </span>
        <span className="text-sm font-semibold tracking-wide text-[var(--color-primary)]">
          Team Tenacious
        </span>
      </div>

      <style>{`
        @keyframes splash-icon-in {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes splash-rise {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes splash-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes splash-glow {
          from { opacity: 0.7; transform: translate(-50%, -50%) scale(0.9); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-splash] * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>
    </div>
  );
}
