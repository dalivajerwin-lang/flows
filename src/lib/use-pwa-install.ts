import { useEffect, useState } from "react";

/**
 * `beforeinstallprompt` is a non-standard Chromium event (Chrome, Edge, Android
 * Chrome). Safari/Firefox never fire it — there the hook stays `canInstall: false`.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's legacy flag
    (navigator as { standalone?: boolean }).standalone === true
  );
}

function isIosSafariLike(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // Every browser on iOS uses the WebKit engine, and none get beforeinstallprompt.
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ reports as Mac; distinguish by touch support.
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  return isIos;
}

export interface PwaInstall {
  /** App already runs standalone — hide any install UI. */
  installed: boolean;
  /** Native install prompt is available (Chrome/Edge/Android). */
  canInstall: boolean;
  /** iOS: no native prompt — show "Share → Add to Home Screen" instructions instead. */
  showIosHint: boolean;
  /** Trigger the native install dialog. Resolves true if the user accepted. */
  promptInstall: () => Promise<boolean>;
}

export function usePwaInstall(): PwaInstall {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    // Effect-only so SSR markup stays deterministic (no UA sniffing during render).
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    setIos(isIosSafariLike());

    const onPrompt = (e: Event) => {
      e.preventDefault(); // suppress Chrome's mini-infobar; we prompt on click
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    // The event is single-use — Chrome fires a fresh one later if dismissed.
    setDeferred(null);
    if (outcome === "accepted") setInstalled(true);
    return outcome === "accepted";
  };

  return {
    installed,
    canInstall: !installed && deferred !== null,
    showIosHint: !installed && ios,
    promptInstall,
  };
}
