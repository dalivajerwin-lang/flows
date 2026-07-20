import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/stores/auth-store";
import { useNotifications } from "@/hooks/use-notifications";
import { layersFor } from "@/lib/notify";

/**
 * Layer 2 toaster — fires a compact sonner toast for every new notification
 * whose Priority Matrix `layers.toast` is true, but only when it targets the
 * currently logged-in user and the tab is visible. Multiple within the 4s
 * window queue and show sequentially (sonner default behavior).
 *
 * Layers are resolved via `layersFor()`, which falls back to the Priority
 * Matrix by `type` for legacy rows with NULL layers — so broadcasts (toast:
 * false per blueprint; the full-screen overlay is their in-app surface) and
 * note updates never toast.
 */
export function NotificationToaster() {
  const navigate = useNavigate();
  const userId = useAuth((s) => s.userId);
  const { data: notifications = [], isSuccess } = useNotifications(userId);
  const seenRef = useRef<Set<string>>(new Set());
  const primedRef = useRef(false);

  useEffect(() => {
    if (!userId) return;
    // Prime only after the query has actually resolved — priming on the
    // pre-fetch empty array would make every existing notification look
    // "new" one render later and burst stale toasts on app load.
    if (!isSuccess) return;
    if (!primedRef.current) {
      // Skip existing notifications on first load — we only toast new ones.
      notifications.forEach((n) => seenRef.current.add(n.id));
      primedRef.current = true;
      return;
    }
    const visible = typeof document !== "undefined" && document.visibilityState === "visible";
    for (const n of notifications) {
      if (seenRef.current.has(n.id)) continue;
      seenRef.current.add(n.id);
      if (n.user_id !== userId) continue;
      if (!visible) continue;
      if (!layersFor(n).toast) continue;
      toast(n.title, {
        description: n.body,
        duration: 4000,
        action: n.target_route
          ? {
              label: "Open",
              onClick: () => navigate({ to: n.target_route! }),
            }
          : undefined,
      });
    }
  }, [notifications, isSuccess, userId, navigate]);

  return null;
}
