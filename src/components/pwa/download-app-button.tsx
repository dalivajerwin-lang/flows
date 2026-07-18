import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { isIOSSafari, isStandalone } from "@/lib/pwa/env";
import { IOSInstallSheet } from "./install-banner";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Explicit "Download App" button for the login screen.
 *
 * Unlike the old auto-nag banner, this only acts when the user taps it, and it
 * triggers the REAL install flow:
 *  - Chrome/Edge/Android: fires the native beforeinstallprompt dialog.
 *  - iOS Safari: shows the Add-to-Home-Screen instruction sheet.
 *
 * Hidden entirely once the app is already installed (running standalone).
 */
export function DownloadAppButton() {
  const [bipEvent, setBipEvent] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIOSSheet, setShowIOSSheet] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    // PwaRoot only registers the service worker after login; register it here
    // too so the browser considers the app installable from the login screen.
    // register() is idempotent for the same script URL, so this never conflicts.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const onBIP = (e: Event) => {
      e.preventDefault();
      setBipEvent(e as BIPEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Don't render until we know the environment (avoids SSR/hydration flash),
  // and never show it inside the already-installed app.
  if (!mounted || installed) return null;

  const onClick = async () => {
    if (isIOSSafari()) {
      setShowIOSSheet(true);
      return;
    }
    if (bipEvent) {
      await bipEvent.prompt();
      const choice = await bipEvent.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setBipEvent(null);
      return;
    }
    // Fallback: browser hasn't offered a native prompt yet (or doesn't support
    // it) — show the manual instruction sheet so the button is never a dead end.
    setShowIOSSheet(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)] transition-tenacious hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]"
      >
        <Download size={16} />
        Download App
      </button>
      {showIOSSheet && <IOSInstallSheet onClose={() => setShowIOSSheet(false)} />}
    </>
  );
}
