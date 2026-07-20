import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BellRing, ChevronDown, ChevronRight, Check } from "lucide-react";
import {
  useTeamAgendaOverview,
  type TeamAgendaRow,
  type AgendaStatus,
} from "@/hooks/use-daily-agenda";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/tenacious-button";
import { BroadcastComposer } from "@/components/broadcast/broadcast-composer";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const AGENDA_REMINDER_PREFILL =
  "⏰ Reminder: please complete your Daily Agenda for today. Plan your day in the Assistant — Daily Agenda panel.";

/** Status chip for a consultant's agenda day: critical / warning / success. */
export function AgendaStatusChip({
  status,
  doneCount,
  total,
}: {
  status: AgendaStatus;
  doneCount: number;
  total: number;
}) {
  if (status === "not_planned") return <StatusChip variant="critical">Not planned</StatusChip>;
  if (status === "done") return <StatusChip variant="success">Done</StatusChip>;
  return (
    <StatusChip variant="warning">
      In progress {doneCount}/{total}
    </StatusChip>
  );
}

/**
 * Manager one-screen view of the whole team's agenda status for today.
 * Rows are sorted worst-first (not planned → in progress → done). Expanding a
 * row shows that consultant's items read-only (RLS grants managers SELECT,
 * never write). "Remind" reuses the existing broadcast pipeline, prefilled.
 *
 * Stacked cards on mobile; denser rows from lg up. Used on the manager
 * dashboard (with `viewAllLink`) and as the full `/team-agenda` screen.
 */
export function TeamAgendaOverview({ viewAllLink = false }: { viewAllLink?: boolean }) {
  const { rows, isLoading } = useTeamAgendaOverview();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const planned = rows.filter((r) => r.status !== "not_planned").length;
  const pending = rows.filter((r) => r.status !== "done").length;

  const remind = () => setComposerOpen(true);

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-sm)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Team Agenda</h2>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {rows.length > 0
              ? `${planned} of ${rows.length} planned today`
              : "No active consultants"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pending > 0 && (
            <Button size="sm" variant="secondary" onClick={remind} className="min-h-[44px]">
              <BellRing size={14} />
              Remind all pending
            </Button>
          )}
          {viewAllLink && (
            <button
              onClick={() => navigate({ to: "/team-agenda" })}
              className="inline-flex min-h-[44px] items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:underline"
            >
              View all <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <p className="py-4 text-center text-sm text-[var(--color-text-secondary)]">
          Loading team agendas…
        </p>
      ) : rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-[var(--color-text-secondary)]">
          No active consultants on the roster.
        </p>
      ) : (
        <ul className="space-y-2 lg:space-y-1">
          {rows.map((row) => (
            <ConsultantRow
              key={row.consultant.id}
              row={row}
              expanded={expandedId === row.consultant.id}
              onToggle={() =>
                setExpandedId((cur) => (cur === row.consultant.id ? null : row.consultant.id))
              }
              onRemind={remind}
            />
          ))}
        </ul>
      )}

      <BroadcastComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        prefill={AGENDA_REMINDER_PREFILL}
      />
    </div>
  );
}

function ConsultantRow({
  row,
  expanded,
  onToggle,
  onRemind,
}: {
  row: TeamAgendaRow;
  expanded: boolean;
  onToggle: () => void;
  onRemind: () => void;
}) {
  const { consultant, items, status, doneCount } = row;
  return (
    <li className="rounded-[var(--radius-md)] border border-[var(--color-border)] lg:border-x-0 lg:border-t-0 lg:rounded-none lg:last:border-b-0">
      <div className="flex flex-wrap items-center gap-2 p-3 lg:py-2">
        <button
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Collapse" : "Expand"} ${consultant.display_name}'s agenda`}
          className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 text-left"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-text-placeholder)]" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-placeholder)]" />
          )}
          <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--color-primary-light)] text-xs font-semibold text-[var(--color-primary-hover)]">
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
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {consultant.display_name}
          </span>
        </button>
        <AgendaStatusChip status={status} doneCount={doneCount} total={items.length} />
        {status !== "done" && (
          <Button size="sm" variant="secondary" onClick={onRemind} className="min-h-[44px]">
            <BellRing size={14} />
            Remind
          </Button>
        )}
      </div>
      {expanded && (
        <ul className="space-y-1 border-t border-[var(--color-border-subtle)] px-4 py-3 lg:px-10">
          {items.length === 0 ? (
            <li className="text-xs text-[var(--color-text-secondary)]">
              No agenda items for today.
            </li>
          ) : (
            items.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm">
                <span
                  aria-hidden
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    item.done
                      ? "border-[var(--color-primary-hover)] bg-[var(--color-primary-hover)] text-white"
                      : "border-[var(--color-border)]",
                  )}
                >
                  {item.done && <Check size={10} />}
                </span>
                <span
                  className={cn(
                    item.done && "text-[var(--color-text-subtle)] line-through",
                  )}
                >
                  {item.text}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </li>
  );
}
