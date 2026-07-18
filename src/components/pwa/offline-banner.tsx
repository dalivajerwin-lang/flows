import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useOfflineQueue } from "@/stores/offline-queue-store";
import { useAuth } from "@/stores/auth-store";
import { WifiOff } from "lucide-react";

/**
 * Slim persistent banner over the top bar when the browser is offline (or the
 * sandbox "Simulate Offline" toggle is on). On reconnect, replays the queue
 * and shows a success toast.
 */
export function OfflineBanner() {
  const forcedOffline = useOfflineQueue((s) => s.forcedOffline);
  const [browserOffline, setBrowserOffline] = useState(false);
  const userId = useAuth((s) => s.userId);

  useEffect(() => {
    if (typeof navigator !== "undefined") setBrowserOffline(!navigator.onLine);
    const on = () => setBrowserOffline(false);
    const off = () => setBrowserOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const offline = forcedOffline || browserOffline;

  // Replay on transition offline → online.
  const prevRef = useOfflinePrev(offline);
  useEffect(() => {
    if (prevRef && !offline) {
      if (!userId) {
        toast.success("Back online.");
        return;
      }
      (async () => {
        const { synced, conflicts } = await useOfflineQueue.getState().replay(userId);
        if (synced > 0 || conflicts > 0) {
          if (conflicts > 0) {
            toast.warning(
              `Back online — ${synced} change${synced === 1 ? "" : "s"} synced, ${conflicts} conflict${conflicts === 1 ? "" : "s"} need${conflicts === 1 ? "s" : ""} review.`,
            );
          } else {
            toast.success(`Back online — all changes synced.`);
          }
        } else {
          toast.success("Back online.");
        }
      })();
    }
  }, [offline, prevRef, userId]);

  if (!offline) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-30 flex items-center justify-center gap-2 px-3 py-1.5 text-[13px] font-medium"
      style={{ background: "var(--color-warning)", color: "var(--color-text)" }}
    >
      <WifiOff size={14} aria-hidden />
      <span>📡 You're offline — changes will sync when reconnected.</span>
    </div>
  );
}

// Tracks the previous offline value across renders (returns previous).
function useOfflinePrev(current: boolean): boolean {
  const [prev, setPrev] = useState(current);
  useEffect(() => {
    setPrev(current);
  }, [current]);
  return prev;
}
