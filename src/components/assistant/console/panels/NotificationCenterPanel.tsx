import { useMemo, useState } from "react";
import { Bell, Megaphone } from "lucide-react";
import { PanelCard } from "../PanelCard";
import { useNotifications, useMarkNotificationRead } from "@/hooks/use-notifications";
import { useCurrentProfile } from "@/stores/auth-store";
import { BroadcastHistoryDialog } from "@/components/broadcast/broadcast-history-dialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function NotificationCenterPanel({ highlight = false }: { highlight?: boolean }) {
  const profile = useCurrentProfile();
  const { data: notifications = [] } = useNotifications(profile?.id ?? null);
  const markReadMutation = useMarkNotificationRead();
  const [showOlder, setShowOlder] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const isManager = profile?.role !== "property_consultant";

  const feed = useMemo(() => {
    if (!profile) return [];
    return [...notifications]
      .filter((n) => n.user_id === profile.id)
      .sort((a, b) =>
        a.is_read === b.is_read
          ? (a.created_at ?? "") < (b.created_at ?? "")
            ? 1
            : -1
          : a.is_read
            ? 1
            : -1,
      );
  }, [notifications, profile]);

  const unread = feed.filter((n) => !n.is_read);
  const initial = unread.slice(0, 20);
  const older = feed.filter((n) => !initial.includes(n));
  const shown = showOlder ? feed : initial.length > 0 ? initial : feed.slice(0, 20);

  return (
    <PanelCard
      id="panel-notifications"
      icon={
        <Bell
          size={16}
          className={cn("text-[var(--color-primary)]", highlight && "animate-pulse")}
        />
      }
      title="Notification Center"
      badge={
        unread.length > 0 ? (
          <span className="rounded-full bg-[var(--color-danger-solid)] px-2 text-xs font-semibold text-white">
            {unread.length}
          </span>
        ) : null
      }
      defaultExpanded
    >
      {shown.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)]">
          All quiet here! You are fully caught up.
        </p>
      ) : (
        <ul className="space-y-2">
          {shown.map((n) => (
            <li
              key={n.id}
              onClick={() => {
                markReadMutation.mutate({ id: n.id });
                if (n.target_route) {
                  window.location.href = n.target_route;
                }
              }}
              className="cursor-pointer rounded-md border border-[var(--color-border-subtle)] p-3 text-sm hover:bg-[var(--color-surface-subtle)]"
            >
              <div className="flex items-start gap-2">
                {!n.is_read && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-info-solid)]" />
                )}
                <div className="min-w-0 flex-1">
                  <div
                    className={cn("font-medium", !n.is_read && "text-[var(--color-text-strong)]")}
                  >
                    {n.title}
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)]">{n.body}</div>
                  <div className="mt-1 text-[10px] uppercase text-[var(--color-text-subtle)]">
                    {format(new Date(n.created_at), "MMM d HH:mm")}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {!showOlder && older.length > 0 && (
        <button
          onClick={() => setShowOlder(true)}
          className="mt-3 text-xs font-medium text-[var(--color-primary)] hover:underline"
        >
          Show older ({older.length})
        </button>
      )}
      {isManager && (
        <>
          <button
            onClick={() => setHistoryOpen(true)}
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[var(--color-primary)] hover:underline"
          >
            <Megaphone size={12} /> Broadcast History
          </button>
          <BroadcastHistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} />
        </>
      )}
    </PanelCard>
  );
}
