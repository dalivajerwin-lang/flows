import { useEffect } from "react";
import { markSessionAndCount } from "@/lib/pwa/env";
import { useOfflineQueue } from "@/stores/offline-queue-store";
import { OfflineBanner } from "./offline-banner";
import { PushPermissionPrompt } from "./push-permission-prompt";
import { ConflictInbox } from "./conflict-inbox";

/**
 * Mounts every PWA-layer UI element and hydrates the offline queue on load.
 * Rendered inside AppShell so it's authenticated-only.
 */
export function PwaRoot() {
  const hydrate = useOfflineQueue((s) => s.hydrate);
  useEffect(() => {
    markSessionAndCount();
    hydrate();

    // Suppress the browser's own install infobar/mini-prompt entirely.
    // Users install silently via the browser menu (⋮ → Add to Home screen).
    const suppressInstallPrompt = (e: Event) => e.preventDefault();
    window.addEventListener("beforeinstallprompt", suppressInstallPrompt);

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerSW = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("ServiceWorker registration successful with scope: ", reg.scope);
          })
          .catch((err) => {
            console.error("ServiceWorker registration failed: ", err);
          });
      };

      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW);
        return () => {
          window.removeEventListener("load", registerSW);
          window.removeEventListener("beforeinstallprompt", suppressInstallPrompt);
        };
      }
    }
    return () => window.removeEventListener("beforeinstallprompt", suppressInstallPrompt);
  }, [hydrate]);
  return (
    <>
      <OfflineBanner />
      {/* InstallBanner intentionally not rendered — install is done silently
          via the browser menu (⋮ → Add to Home screen); no in-app nagging. */}
      <PushPermissionPrompt />
      <ConflictInbox />
    </>
  );
}
