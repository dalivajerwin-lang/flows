import { useState } from "react";
import { CheckCheck, Megaphone } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useCurrentProfile } from "@/stores/auth-store";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type AppNotification,
} from "@/hooks/use-notifications";
import { BroadcastHistoryDialog } from "@/components/broadcast/broadcast-history-dialog";
import { cn } from "@/lib/utils";

/**
 * Notifications tab — the app's single notification surface (the top-bar
 * bell was removed in favor of this). Unread first, "Earlier" divider,
 * tap navigates to the notification's target route.
 */

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

export function NotificationsTab() {
  const profile = useCurrentProfile();
  const navigate = useNavigate();
  const { data: notifications = [] } = useNotifications(profile?.id ?? null);
  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();
  const [historyOpen, setHistoryOpen] = useState(false);

  if (!profile) return null;
  const isManager = profile.role !== "property_consultant";
  const mine = notifications.filter((n) => n.user_id === profile.id);
  const unread = mine.filter((n) => !n.is_read).length;

  const openNotification = (n: AppNotification) => {
    markReadMutation.mutate({ id: n.id });
    if (n.target_route) navigate({ to: n.target_route });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <h3 className="text-sm font-semibold">
          Notifications
          {unread > 0 && (
            <span className="ml-2 rounded-full bg-[var(--color-primary-light)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary-hover)]">
              {unread} new
            </span>
          )}
        </h3>
        <div className="flex items-center gap-1">
          {isManager && (
            <button
              onClick={() => setHistoryOpen(true)}
              className="inline-flex min-h-[44px] items-center gap-1 px-2 text-xs font-medium text-[var(--color-primary)] hover:underline"
            >
              <Megaphone size={14} /> Broadcast History
            </button>
          )}
          {unread > 0 && (
            <button
              onClick={() => markAllMutation.mutate(profile.id)}
              className="inline-flex min-h-[44px] items-center gap-1 px-2 text-xs font-medium text-[var(--color-primary)] hover:underline"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
        <NotificationList items={mine} onOpen={openNotification} />
      </div>
      {isManager && <BroadcastHistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} />}
    </div>
  );
}

function NotificationList({
  items,
  onOpen,
}: {
  items: AppNotification[];
  onOpen: (n: AppNotification) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-sm text-[var(--color-text-secondary)]">
        You're all caught up.
      </div>
    );
  }
  const unreadItems = items.filter((n) => !n.is_read);
  const readItems = items.filter((n) => n.is_read);
  return (
    <>
      <NotificationRows items={unreadItems} onOpen={onOpen} />
      {unreadItems.length > 0 && readItems.length > 0 && (
        <div className="bg-[var(--color-surface)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
          Earlier
        </div>
      )}
      <NotificationRows items={readItems} onOpen={onOpen} />
    </>
  );
}

function NotificationRows({
  items,
  onOpen,
}: {
  items: AppNotification[];
  onOpen: (n: AppNotification) => void;
}) {
  return (
    <>
      {items.map((n) => (
        <button
          key={n.id}
          onClick={() => onOpen(n)}
          className={cn(
            "flex min-h-[44px] w-full items-start gap-3 border-b border-[var(--color-border)] px-4 py-3 text-left last:border-b-0",
            n.is_read
              ? "bg-[var(--color-background)] hover:bg-[var(--color-surface)] active:bg-[var(--color-surface)]"
              : "border-l-2 border-l-[var(--color-primary)] bg-[var(--color-primary-light)]/30 hover:bg-[var(--color-primary-light)]/50 active:bg-[var(--color-primary-light)]/50",
          )}
        >
          <span
            className={cn(
              "mt-1.5 h-2 w-2 flex-shrink-0 rounded-full",
              n.is_read ? "bg-transparent" : "bg-[var(--color-primary)]",
            )}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span
                className={cn(
                  "min-w-0 truncate text-sm",
                  n.is_read
                    ? "font-normal text-[var(--color-text-secondary)]"
                    : "font-semibold text-[var(--color-text)]",
                )}
              >
                {n.title}
              </span>
              <span className="flex-shrink-0 text-[11px] text-[var(--color-text-placeholder)]">
                {relativeTime(n.created_at)}
              </span>
            </div>
            <div
              className={cn(
                "mt-0.5 text-xs",
                n.is_read
                  ? "text-[var(--color-text-placeholder)]"
                  : "text-[var(--color-text-secondary)]",
              )}
            >
              {n.body}
            </div>
          </div>
          <span className="sr-only">{n.is_read ? "Read" : "Unread"}</span>
        </button>
      ))}
    </>
  );
}
