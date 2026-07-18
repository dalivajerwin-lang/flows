import { useEffect, useRef, useState } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useCurrentProfile } from "@/stores/auth-store";
import { isManagerish } from "@/hooks/use-role";
import { useAssistantStore } from "@/stores/assistant-store";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  LayoutGrid,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { ConsoleGrid } from "./console/ConsoleGrid";
import { ChatCanvas } from "./chat/ChatCanvas";

export function AssistantPage() {
  const profile = useCurrentProfile();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const mode = useAssistantStore((s) => s.mode);
  const setMode = useAssistantStore((s) => s.setMode);
  const consoleExpanded = useAssistantStore((s) => s.consoleExpanded);
  const toggleConsole = useAssistantStore((s) => s.toggleConsole);
  const [fading, setFading] = useState(false);
  const search = useSearch({ strict: false }) as { panel?: string };
  const navigate = useNavigate();

  const role = profile?.role ?? "property_consultant";
  const isManager = isManagerish(profile?.role ?? null);

  // Fade animation on mode change (mobile only) — skip the initial mount so
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

  // Deep-link: /assistant?panel=notifications -> scroll & expand
  useEffect(() => {
    if (search.panel) {
      const el = document.getElementById(`panel-${search.panel}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [search.panel]);

  if (!profile) return null;

  if (isDesktop) {
    return (
      <div className="flex h-[calc(100dvh-100px)] gap-4">
        {consoleExpanded && (
          <div className="min-w-0 flex-1 overflow-y-auto pr-1">
            <Header
              title="Assistant Console"
              actions={
                <button
                  onClick={toggleConsole}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--color-border)] bg-white px-3 text-sm font-medium hover:bg-[var(--color-surface-subtle)]"
                >
                  <PanelRightClose size={14} /> Hide Console
                </button>
              }
            />
            <ConsoleGrid
              role={role}
              isManager={isManager}
              highlightPanel={search.panel ?? null}
              className="grid grid-cols-1 gap-4 xl:grid-cols-2"
            />
          </div>
        )}
        <div
          className={cn(
            "flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white shadow-sm",
            consoleExpanded ? "w-[480px] shrink-0" : "mx-auto w-full max-w-[720px]",
          )}
        >
          {!consoleExpanded && (
            <div className="border-b border-[var(--color-border)] px-4 py-2 flex items-center justify-between">
              <span className="text-sm font-semibold">Tenacious AI</span>
              <button
                onClick={toggleConsole}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-[var(--color-border)] px-2 text-xs font-medium hover:bg-[var(--color-surface-subtle)]"
              >
                <PanelRightOpen size={14} /> Show Console
              </button>
            </div>
          )}
          <ChatCanvas />
        </div>
      </div>
    );
  }

  // Mobile / tablet: segmented control + faded body
  return (
    <div className="flex flex-col h-[100dvh] sm:h-auto overflow-hidden">
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
          <ModeSegment
            active={mode === "conversational"}
            onClick={() => setMode("conversational")}
            icon={<MessageSquare size={13} />}
            label="Chat"
          />
          <ModeSegment
            active={mode === "console"}
            onClick={() => setMode("console")}
            icon={<LayoutGrid size={13} />}
            label="Console"
          />
        </div>
        <div className="w-9" /> {/* Visual spacer */}
      </div>

      {/* Desktop Header & Switcher */}
      <div className="mb-3 hidden sm:flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-semibold">Assistant</h1>
      </div>
      <div className="mb-3 hidden sm:flex justify-start shrink-0">
        <div className="inline-flex rounded-full bg-[var(--color-surface-muted)] p-1 border border-[var(--color-border-subtle)] shadow-sm">
          <ModeSegment
            active={mode === "conversational"}
            onClick={() => setMode("conversational")}
            icon={<MessageSquare size={14} />}
            label="Conversational"
          />
          <ModeSegment
            active={mode === "console"}
            onClick={() => setMode("console")}
            icon={<LayoutGrid size={14} />}
            label="Console"
          />
        </div>
      </div>

      <div
        className={cn(
          "flex-1 overflow-hidden transition-opacity duration-150",
          fading ? "opacity-0" : "opacity-100",
        )}
      >
        {mode === "conversational" ? (
          <div className="h-full overflow-hidden rounded-none border-x-0 border-y sm:rounded-[var(--radius-md)] sm:border border-[var(--color-border)] bg-white shadow-none sm:shadow-sm">
            <ChatCanvas />
          </div>
        ) : (
          <div className="h-full overflow-y-auto px-4 py-4 bg-[var(--color-surface-subtle)]">
            <ConsoleGrid
              role={role}
              isManager={isManager}
              highlightPanel={search.panel ?? null}
              className="grid grid-cols-1 gap-3 max-w-[720px] mx-auto"
            />
          </div>
        )}
      </div>
      {/* Deep-link nav helper */}
      <span className="hidden">{navigate.name}</span>
    </div>
  );
}

function Header({ title, actions }: { title: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {actions}
    </div>
  );
}

function ModeSegment({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex min-h-[36px] items-center gap-2 rounded-full px-4 text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer select-none",
        active
          ? "bg-white text-[var(--color-primary-hover)] shadow-sm scale-102 font-bold"
          : "text-[var(--color-text-soft)] hover:text-[var(--color-text-strong)] hover:bg-white/40",
      )}
      aria-pressed={active}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
