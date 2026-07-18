/**
 * Central notification dispatcher — the SINGLE write path for notifications.
 *
 * All notifications are written to the Supabase `notifications` table so they
 * reach the recipient through realtime. Every insert stamps `type` and
 * `layers` from the Priority Matrix (mirrored in the DB by
 * `public.notification_layers()` — keep both in sync).
 *
 * Layer 1 (badge)  — recomputes automatically from unread count.
 * Layer 2 (toast)  — fired by <NotificationToaster/> when recipient is the
 *                    current logged-in user with the tab visible.
 * Layer 3 (push)   — fired by useRealtimeNotifications via `sendPush()` when
 *                    the tab is hidden and permission is granted.
 */
import { db } from "@/lib/supabase";
import { queryClient } from "@/lib/query-client";
import type { AppNotification } from "@/hooks/use-notifications";

export type NotificationType =
  | "sale_pending"
  | "sale_verified"
  | "sale_rejected"
  | "reversion_requested"
  | "reversion_approved"
  | "reversion_denied"
  | "crf_near_expiry"
  | "crf_auto_cancelled"
  | "crf_extension_requested"
  | "crf_extension_approved"
  | "crf_extension_denied"
  | "reservation_near_expiry"
  | "reservation_near_expiry_escalation"
  | "reservation_expired"
  | "reservation_expired_escalation"
  | "archive_warning"
  | "lead_auto_archived"
  | "new_lead_assigned"
  | "new_unassigned_lead"
  | "lead_transferred_away"
  | "shared_access_granted"
  | "schedule_added"
  | "schedule_updated"
  | "schedule_reminder"
  | "schedule_cancellation_requested"
  | "stagnant_lead_alert"
  | "unassigned_stagnant_lead_alert"
  | "urgent_ping"
  | "broadcast"
  | "note_added"
  | "general_update";

export interface NotificationLayers {
  badge: boolean;
  toast: boolean;
  push: boolean;
}

/**
 * Blueprint "Notification Priority Matrix". Broadcast deliberately has no
 * toast — the full-screen overlay is its in-app surface.
 */
export const PRIORITY_MATRIX: Record<NotificationType, NotificationLayers> = {
  sale_pending: { badge: true, toast: true, push: true },
  sale_verified: { badge: true, toast: true, push: true },
  sale_rejected: { badge: true, toast: true, push: true },
  reversion_requested: { badge: true, toast: true, push: true },
  reversion_approved: { badge: true, toast: true, push: true },
  reversion_denied: { badge: true, toast: true, push: true },
  crf_near_expiry: { badge: true, toast: true, push: true },
  crf_auto_cancelled: { badge: true, toast: true, push: true },
  crf_extension_requested: { badge: true, toast: true, push: true },
  crf_extension_approved: { badge: true, toast: true, push: false },
  crf_extension_denied: { badge: true, toast: true, push: false },
  reservation_near_expiry: { badge: true, toast: true, push: true },
  reservation_near_expiry_escalation: { badge: true, toast: true, push: true },
  reservation_expired: { badge: true, toast: true, push: true },
  reservation_expired_escalation: { badge: true, toast: true, push: true },
  archive_warning: { badge: true, toast: true, push: true },
  lead_auto_archived: { badge: true, toast: true, push: true },
  new_lead_assigned: { badge: true, toast: true, push: true },
  new_unassigned_lead: { badge: true, toast: true, push: false },
  lead_transferred_away: { badge: true, toast: true, push: false },
  shared_access_granted: { badge: true, toast: true, push: false },
  schedule_added: { badge: true, toast: true, push: true },
  schedule_updated: { badge: true, toast: true, push: true },
  schedule_reminder: { badge: true, toast: true, push: true },
  schedule_cancellation_requested: { badge: true, toast: true, push: false },
  stagnant_lead_alert: { badge: true, toast: true, push: false },
  unassigned_stagnant_lead_alert: { badge: true, toast: true, push: false },
  urgent_ping: { badge: true, toast: true, push: true },
  broadcast: { badge: true, toast: false, push: true },
  note_added: { badge: true, toast: false, push: false },
  general_update: { badge: true, toast: false, push: false },
};

/** Resolve layers for a row, falling back to the matrix for legacy NULLs. */
export function layersFor(n: { type: string | null; layers: unknown }): NotificationLayers {
  if (n.layers && typeof n.layers === "object") return n.layers as NotificationLayers;
  return (
    PRIORITY_MATRIX[(n.type ?? "general_update") as NotificationType] ??
    PRIORITY_MATRIX.general_update
  );
}

export interface NotifyPayload {
  title: string;
  body: string;
  /** Route to open when the toast/notification is tapped, e.g. `/leads?lead=<uuid>`. */
  deep_link_path?: string | null;
  lead_id?: string | null;
  meta?: Record<string, unknown>;
}

/**
 * One-shot dispatcher. Inserts into Supabase; realtime + query invalidation
 * take care of every recipient's badge/toast/push. Errors are logged, not
 * thrown — a failed notification must never break the primary action.
 */
export async function notify(
  recipientUserId: string,
  type: NotificationType,
  payload: NotifyPayload,
): Promise<void> {
  const { error } = await db.from("notifications").insert({
    user_id: recipientUserId,
    lead_id: payload.lead_id ?? null,
    type,
    title: payload.title,
    body: payload.body,
    target_route: payload.deep_link_path ?? null,
    layers: PRIORITY_MATRIX[type],
    meta: payload.meta ?? null,
  });
  if (error) {
    console.error("notify() insert failed:", error.message);
    return;
  }
  queryClient.invalidateQueries({ queryKey: ["notifications", recipientUserId] });
}

/** Fan out one payload to many recipients in a single insert. */
export async function notifyMany(
  recipientUserIds: string[],
  type: NotificationType,
  payload: NotifyPayload,
): Promise<void> {
  if (recipientUserIds.length === 0) return;
  const rows = recipientUserIds.map((user_id) => ({
    user_id,
    lead_id: payload.lead_id ?? null,
    type,
    title: payload.title,
    body: payload.body,
    target_route: payload.deep_link_path ?? null,
    layers: PRIORITY_MATRIX[type],
    meta: payload.meta ?? null,
  }));
  const { error } = await db.from("notifications").insert(rows);
  if (error) {
    console.error("notifyMany() insert failed:", error.message);
    return;
  }
  for (const id of recipientUserIds) {
    queryClient.invalidateQueries({ queryKey: ["notifications", id] });
  }
}

/**
 * Layer 3 — foreground push delivery via the browser Notification API.
 *
 * When permission is granted AND the tab is hidden, fires a system notification
 * with the recipient's deep link so it reopens the app at the right spot.
 * Foreground / focused tabs still show the toast layer instead — no double-fire.
 *
 * For remote delivery, add Web Push subscriptions + VAPID delivery via a
 * Supabase Edge Function. This helper only covers local browser notifications.
 */
export function sendPush(notification: AppNotification): void {
  if (typeof window === "undefined") return;
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  // Only show a system notification if the tab is hidden — otherwise the toast
  // layer already surfaces it in-app.
  if (typeof document !== "undefined" && document.visibilityState === "visible") return;
  try {
    const n = new Notification(notification.title, {
      body: notification.body,
      icon: "/icons/icon-512.png",
      badge: "/icons/icon-512.png",
      tag: notification.id,
      data: { deep_link_path: notification.target_route ?? "/" },
    });
    n.onclick = () => {
      window.focus();
      if (notification.target_route) {
        window.location.assign(notification.target_route);
      }
      n.close();
    };
  } catch {
    /* Notification constructor throws in some browsers when called on user-gestureless contexts. */
  }
}
