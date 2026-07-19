import { useEffect, useRef, useState } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useCurrentProfile } from "@/stores/auth-store";
import { isManagerish } from "@/hooks/use-role";
import { useAssistantStore } from "@/stores/assistant-store";
import { useNotifications } from "@/hooks/use-notifications";
import { formatBadgeCount } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ArrowLeft, Bell, LayoutGrid, MessageSquare } from "lucide-react";
import { ConsoleGrid } from "./console/ConsoleGrid";
import { ChatCanvas } from "./chat/ChatCanvas";
import { NotificationsTab } from "./NotificationsTab";

export function AssistantPage() {
  const profile = useCurrentProfile();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const mode = useAssistantStore((s) => s.mode);
  const setMode = useAssistantStore((s) => s.setMode);
  const [fading, setFading] = useState(false);
  const search = useSearch({ strict: false }) as { panel?: string };
  const navigate = useNavigate();
  const { data: notifications = [] } = useNotifications(profile?.id ?? null);

  const role = profile?.role ?? "property_consultant";
  const isManager = isManagerish(profile?.role ?? null);
  const unread = notifications.filter((n) => n.user_id === profile?.id && !n.is_read).length;
  const unreadBadge = formatBadgeCount(unread);

  // Fade animation on mode change — skip the initial mount so
  // the page doesn't flash blank when navigating to /assistant.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setFading(true);
    const t = setTimeout(() => setFading(false), 150);
    return () => clearTimeout(t);
  }, [mode]);

  // Deep-link: /assistant?panel=notifications -> the Notifications tab;
  // any other panel key -> console mode + scroll to that panel.
  useEffect(() => {
    if (!search.panel) return;
    if (search.panel === "notifications") {
      setMode("notifications");
      return;
    }
    setMode("console");
    const el = document.getElementById(`panel-${search.panel}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [search.panel, setMode]);

  if (!profile) return null;

  const segments = (size: number) => (
    <>
      <ModeSegment
        active={mode === "conversational"}
        onClick={() => setMode("conversational")}
        icon={<MessageSquare size={size} />}
        label="Chat"
      />
      <ModeSegment
        active={mode === "notifications"}
        onClick={() => setMode("notifications")}
        icon={<Bell size={size} />}
        label="Notifications"
        badge={unreadBadge}
      />
      <ModeSegment
        active={mode === "console"}
        onClick={() => setMode("console")}
        icon={<LayoutGrid size={size} />}
        label="Console"
      />
    </>
  );

  const body =
    mode === "conversational" ? (
      <div className="h-full overflow-hidden rounded-none border-x-0 border-y sm:rounded-[var(--radius-md)] sm:border border-[var(--color-border)] bg-white shadow-none sm:shadow-sm">
        <ChatCanvas />
      </div>
    ) : mode === "notifications" ? (
      <div className="h-full overflow-hidden rounded-none border-x-0 border-y sm:rounded-[var(--radius-md)] sm:border border-[var(--color-border)] bg-white shadow-none sm:shadow-sm sm:mx-auto sm:max-w-[720px]">
        <NotificationsTab />
      </div>
    ) : (
      <div className="h-full overflow-y-auto px-4 py-4 bg-[var(--color-surface-subtle)]">
        <ConsoleGrid
          role={role}
          isManager={isManager}
          highlightPanel={search.panel ?? null}
          className={cn(
            "grid grid-cols-1 gap-3 mx-auto",
            isDesktop ? "max-w-[1100px] gap-4 xl:grid-cols-2" : "max-w-[720px]",
          )}
        />
      </div>
    );

  return (
    <div className="flex flex-col h-[100dvh] sm:h-[calc(100dvh-100px)] overflow-hidden">
      {/* Mobile Top Navigation Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-4 py-2 shrink-0 sm:hidden">
        <button
          onClick={() => navigate({ to: "/" })}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border-muted)] bg-white hover:bg-[var(--color-surface)] transition-all duration-150 cursor-pointer shadow-xs active:scale-95"
          aria-label="Back to home"
        >
          <ArrowLeft size={16} className="text-[var(--color-text-soft)]" />
        </button>
        <div className="inline-flex rounded-full bg-[var(--color-surface-muted)] p-0.5 border border-[var(--color-border-subtle)]">
          {segments(13)}
        </div>
        <div className="w-9" /> {/* Visual spacer */}
      </div>

      {/* Desktop / tablet Header & Switcher */}
      <div className="mb-3 hidden sm:flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-semibold">Assistant</h1>
      </div>
      <div className="mb-3 hidden sm:flex justify-start shrink-0">
        <div className="inline-flex rounded-full bg-[var(--color-surface-muted)] p-1 border border-[var(--color-border-subtle)] shadow-sm">
          {segments(14)}
        </div>
      </div>

      <div
        className={cn(
          "flex-1 overflow-hidden transition-opacity duration-150",
          fading ? "opacity-0" : "opacity-100",
        )}
      >
        {body}
      </div>
    </div>
  );
}

function ModeSegment({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: string | null;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 sm:px-4 text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer select-none",
        active
          ? "bg-white text-[var(--color-primary-hover)] shadow-sm scale-102 font-bold"
          : "text-[var(--color-text-soft)] hover:text-[var(--color-text-strong)] hover:bg-white/40",
      )}
      aria-pressed={active}
    >
      {icon}
      <span className="hidden min-[400px]:inline">{label}</span>
      {badge && (
        <span className="rounded-full bg-[var(--color-error)] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
          {badge}
        </span>
      )}
    </button>
  );
}
