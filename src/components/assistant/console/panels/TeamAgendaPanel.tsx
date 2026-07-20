import { useNavigate } from "@tanstack/react-router";
import { ListTodo, ArrowRight } from "lucide-react";
import { PanelCard } from "../PanelCard";
import { useTeamAgendaOverview } from "@/hooks/use-daily-agenda";
import { AgendaStatusChip } from "@/components/agenda/team-agenda-overview";
import { initials } from "@/lib/format";

/**
 * Compact manager view of today's team agenda status inside chat/console —
 * one row per consultant, worst-first. The full screen (expandable items,
 * Remind buttons) lives at /team-agenda.
 */
export function TeamAgendaPanel() {
  const { rows, isLoading } = useTeamAgendaOverview();
  const navigate = useNavigate();
  const planned = rows.filter((r) => r.status !== "not_planned").length;

  return (
    <PanelCard
      id="panel-team_agenda"
      defaultExpanded
      icon={<ListTodo size={16} className="text-[var(--color-primary)]" />}
      title="Team Agenda"
      badge={
        rows.length > 0 ? (
          <span className="text-xs font-medium text-[var(--color-text-secondary)] tabular-nums">
            {planned}/{rows.length} planned
          </span>
        ) : null
      }
    >
      {isLoading ? (
        <p className="text-sm text-[var(--color-text-secondary)]">Loading team agendas…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)]">
          No active consultants on the roster.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map(({ consultant, items, status, doneCount }) => (
            <li key={consultant.id} className="flex items-center gap-2 text-sm">
              <span className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--color-primary-light)] text-[10px] font-semibold text-[var(--color-primary-hover)]">
                {consultant.profile_photo_url ? (
                  <img
                    src={consultant.profile_photo_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials(consultant.display_name)
                )}
              </span>
              <span className="min-w-0 flex-1 truncate">{consultant.display_name}</span>
              <AgendaStatusChip status={status} doneCount={doneCount} total={items.length} />
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={() => navigate({ to: "/team-agenda" })}
        className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[var(--color-border-muted)] bg-[var(--color-background)] px-3 py-2 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]"
      >
        Open Team Agenda <ArrowRight size={14} />
      </button>
    </PanelCard>
  );
}
