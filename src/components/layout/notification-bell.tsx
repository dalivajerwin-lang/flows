import { useEffect, useState } from "react";
import { Bell, X, CheckCheck } from "lucide-react";
import { useCurrentProfile } from "@/stores/auth-store";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type AppNotification,
} from "@/hooks/use-notifications";
import { formatBadgeCount } from "@/lib/format";
import { useNavigate } from "@tanstack/react-router";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

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

export function NotificationBell() {
  const profile = useCurrentProfile();
  const { data: notifications = [] } = useNotifications(profile?.id ?? null);
  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();
  const markRead = (id: string) => markReadMutation.mutate({ id });
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const isDesktop = useMediaQuery("(min-width: 640px)");

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    if (!open || isDesktop) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, isDesktop]);

  // Esc closes on any viewport.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!profile) return null;
  const mine = notifications.filter((n) => n.user_id === profile.id);
  const unread = mine.filter((n) => !n.is_read).length;
  const badge = formatBadgeCount(unread);

  const openNotification = (n: AppNotification) => {
    markRead(n.id);
    if (n.target_route) navigate({ to: n.target_route });
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={unread ? `View notifications, ${unread} unread` : "View notifications"}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text)] hover:bg-[var(--color-surface)]"
      >
        <Bell size={20} />
        {badge && (
          <span className="absolute right-1 top-1 rounded-full bg-[var(--color-error)] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
            {badge}
          </span>
        )}
      </button>
      {open &&
        (isDesktop ? (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-12 z-40 w-[380px] max-w-[92vw] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-md)]">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
                <h3 className="text-sm font-semibold">
                  Notifications
                  {unread > 0 && (
                    <span className="ml-2 rounded-full bg-[var(--color-primary-light)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary-hover)]">
                      {unread} new
                    </span>
                  )}
                </h3>
                {unread > 0 && (
                  <button
                    onClick={() => markAllMutation.mutate(profile.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:underline"
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-[420px] overflow-auto">
                <NotificationList items={mine} onOpen={openNotification} />
              </div>
            </div>
          </>
        ) : (
          <div
            className="fixed inset-0 z-50 flex"
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
          >
            <div
              className="absolute inset-0 bg-[rgba(0,0,0,0.32)] transition-tenacious"
              onClick={() => setOpen(false)}
            />
            <div
              className="relative mt-auto flex max-h-[85dvh] w-full flex-col rounded-t-[var(--radius-lg)] bg-white shadow-[var(--shadow-md)]"
              style={{ animation: "tenacious-sheet-in 220ms cubic-bezier(0.4,0,0.2,1)" }}
            >
              <div className="flex justify-center pt-2">
                <div className="h-1.5 w-10 rounded-full bg-[var(--color-border)]" />
              </div>
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2">
                <h3 className="text-base font-semibold">
                  Notifications
                  {unread > 0 && (
                    <span className="ml-2 rounded-full bg-[var(--color-primary-light)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary-hover)]">
                      {unread} new
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-1">
                  {unread > 0 && (
                    <button
                      onClick={() => markAllMutation.mutate(profile.id)}
                      className="inline-flex min-h-[44px] items-center gap-1 px-2 text-xs font-medium text-[var(--color-primary)]"
                    >
                      <CheckCheck size={14} /> Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Close notifications"
                    className="-mr-2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
                <NotificationList items={mine} onOpen={openNotification} />
              </div>
            </div>
            <style>{`
              @keyframes tenacious-sheet-in {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
              }
            `}</style>
          </div>
        ))}
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
              ? "bg-white hover:bg-[var(--color-surface)] active:bg-[var(--color-surface)]"
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
