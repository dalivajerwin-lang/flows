import type { ChatWidget as W } from "@/stores/assistant-store";
import { DailyAgendaPanel } from "../console/panels/DailyAgendaPanel";
import { ExpiryWarningsPanel } from "../console/panels/ExpiryWarningsPanel";
import { StagnantLeadsPanel } from "../console/panels/StagnantLeadsPanel";
import { GoalTrackerPanel } from "../console/panels/GoalTrackerPanel";
import { LinksLibraryPanel } from "../console/panels/LinksLibraryPanel";
import { TeamGuardPanel } from "../console/panels/TeamGuardPanel";
import { BottleneckPanel } from "../console/panels/BottleneckPanel";
import { GoalPaceCalculatorPanel } from "../console/panels/GoalPaceCalculatorPanel";
import { LinksLibraryAdminPanel } from "../console/panels/LinksLibraryAdminPanel";
import { ProjectAdminPanel } from "../console/panels/ProjectAdminPanel";
import { ReversionInboxPanel } from "../console/panels/ReversionInboxPanel";
import { STAGE_LABELS, type Stage } from "@/lib/constants";
import { useCurrentProfile } from "@/stores/auth-store";
import { isManagerish } from "@/hooks/use-role";
import { useAssistantStore } from "@/stores/assistant-store";
import { Bell, ArrowRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/tenacious-button";
import { Textarea } from "@/components/ui/textarea";
import { StageBadge } from "@/components/ui/status-chip";
import { getAssistantVisibleLeads } from "@/lib/assistant/lead-search";
import { useVisibleLeads } from "@/stores/leads-store";
import { useProjects } from "@/hooks/use-projects";

const PANEL_MAP: Record<string, React.ComponentType> = {
  agenda: DailyAgendaPanel,
  expiry: ExpiryWarningsPanel,
  stagnant: StagnantLeadsPanel,
  goal: GoalTrackerPanel,
  notifications: OpenNotificationsTab,
  links: LinksLibraryPanel,
  team_guard: TeamGuardPanel,
  bottleneck: BottleneckPanel,
  goal_pace: GoalPaceCalculatorPanel,
  links_admin: LinksLibraryAdminPanel,
  projects_admin: ProjectAdminPanel,
  reversion_inbox: ReversionInboxPanel,
  fallback_routing: FallbackRoutingPanel,
};

/** Notifications now live in their own Assistant tab — link to it from chat. */
function OpenNotificationsTab() {
  const setMode = useAssistantStore((s) => s.setMode);
  return (
    <button
      type="button"
      onClick={() => setMode("notifications")}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border-muted)] bg-[var(--color-background)] px-3 py-2 text-xs font-semibold text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors cursor-pointer"
    >
      <Bell size={14} /> Open the Notifications tab
    </button>
  );
}

export type WidgetStepState = {
  step: "reason" | "confirm" | "processing" | "done";
};

interface Props {
  widget: W;
  messageId: string;
  state?: WidgetStepState;
}

export function ChatWidget({ widget, messageId, state }: Props) {
  if (widget.kind === "panel") {
    const C = PANEL_MAP[widget.panelKey];
    return C ? <C /> : null;
  }
  if (widget.kind === "stage_transition") {
    return (
      <InlineTransition
        messageId={messageId}
        leadId={widget.leadId}
        toStage={widget.toStage as Stage}
        step={state?.step ?? "reason"}
      />
    );
  }
  if (widget.kind === "page_link") {
    return <PageLinkChip to={widget.to} label={widget.label} />;
  }
  if (widget.kind === "lead_suggestions") {
    return <LeadSuggestions leadIds={widget.leadIds} />;
  }
  return null;
}

/** Navigation chip for intents whose full view is a real page, not a chat panel. */
function PageLinkChip({ to, label }: { to: string; label: string }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate({ to })}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border-muted)] bg-[var(--color-background)] px-3 py-2 text-xs font-semibold text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors cursor-pointer"
    >
      {label} <ArrowRight size={14} />
    </button>
  );
}

function LeadSuggestions({ leadIds }: { leadIds: string[] }) {
  const profile = useCurrentProfile();
  const { leads: realLeads } = useVisibleLeads();
  const { data: projects = [] } = useProjects();
  const leads = getAssistantVisibleLeads({ leads: realLeads, profile }).filter((lead) =>
    leadIds.includes(lead.id),
  );

  if (leads.length === 0) return null;

  return (
    <div className="space-y-1 rounded-md border border-[var(--color-border-muted)] bg-[var(--color-surface-subtle)] p-2">
      {leads.map((lead, index) => (
        <button
          key={lead.id}
          type="button"
          data-action="lead-suggestion-select"
          data-lead-id={lead.id}
          className="flex w-full items-center justify-between gap-2 rounded-md bg-[var(--color-background)] px-2.5 py-2 text-left text-xs hover:bg-[var(--color-primary-light)]"
        >
          <span className="min-w-0">
            <span className="font-semibold text-[var(--color-text)]">
              {index + 1}. {lead.full_name}
            </span>
            <span className="block truncate text-[var(--color-text-secondary)]">
              {projects.find((p) => p.id === lead.project_id)?.name ?? "No project"}
            </span>
          </span>
          <StageBadge stage={lead.stage as Stage} />
        </button>
      ))}
    </div>
  );
}

function InlineTransition({
  messageId,
  leadId,
  toStage,
  step,
}: {
  messageId: string;
  leadId: string;
  toStage: Stage;
  step: WidgetStepState["step"];
}) {
  const profile = useCurrentProfile();
  const { leads: realLeads } = useVisibleLeads();
  const lead = getAssistantVisibleLeads({ leads: realLeads, profile }).find((l) => l.id === leadId);
  if (!lead) return <div className="text-xs text-[var(--color-danger-solid)]">Lead not found.</div>;
  const reasonId = `wf-reason-${messageId}`;
  return (
    <div className="rounded-md border border-[var(--color-border-muted)] bg-[var(--color-surface-subtle)] p-3 text-sm">
      <div className="mb-2 font-medium">
        {lead.full_name} → <b>{STAGE_LABELS[toStage]}</b>
      </div>
      <Textarea
        id={reasonId}
        rows={2}
        placeholder="Reason / notes (min 5 chars)"
        defaultValue=""
        disabled={step !== "reason"}
      />
      {step === "reason" ? (
        <Button
          size="sm"
          className="mt-2"
          type="button"
          data-action="widget-continue"
          data-msg-id={messageId}
          data-reason-id={reasonId}
        >
          Continue
        </Button>
      ) : (
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            variant="success"
            type="button"
            disabled={step !== "confirm"}
            data-action="widget-confirm-transition"
            data-msg-id={messageId}
            data-lead-id={leadId}
            data-to-stage={toStage}
            data-reason-id={reasonId}
          >
            {step === "processing" ? "⌛ Processing…" : step === "done" ? "✓ Done" : "Confirm move"}
          </Button>
        </div>
      )}
    </div>
  );
}

function FallbackRoutingPanel() {
  const profile = useCurrentProfile();
  const isManager = isManagerish(profile?.role ?? null);

  const buttons = isManager
    ? [
        { label: "🚨 Team Guard", command: "team guard" },
        { label: "⏱️ Bottleneck Alert", command: "bottleneck" },
        { label: "📊 Goal Pace", command: "goal pace" },
        { label: "Reversion Requests", command: "reversion requests" },
      ]
    : [
        { label: "📅 Daily Agenda", command: "agenda" },
        { label: "⏳ Expiry Warnings", command: "expiry warnings" },
        { label: "💤 Stagnant Leads", command: "stagnant leads" },
        { label: "🎯 Goal Tracker", command: "goal progress" },
      ];

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {buttons.map((b) => (
        <button
          key={b.label}
          type="button"
          data-action="chip"
          data-text={b.command}
          className="rounded-lg border border-[var(--color-border-muted)] bg-[var(--color-background)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors cursor-pointer"
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}
