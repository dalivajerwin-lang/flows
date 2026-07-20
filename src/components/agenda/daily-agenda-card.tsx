import { useNavigate } from "@tanstack/react-router";
import { ListTodo, ChevronRight, CheckCircle2 } from "lucide-react";
import { useCurrentProfile } from "@/stores/auth-store";
import { useMyAgenda, agendaStatusFor } from "@/hooks/use-daily-agenda";
import { cn } from "@/lib/utils";

/**
 * Consultant dashboard card: today's agenda at a glance. Warning-soft surface
 * when nothing is planned (it reads as a to-do), success state when done.
 * Tapping opens the full editor — the assistant console agenda panel.
 */
export function DailyAgendaCard() {
  const profile = useCurrentProfile();
  const navigate = useNavigate();
  const { data: items = [], isLoading } = useMyAgenda();
  if (!profile || isLoading) return null;

  const status = agendaStatusFor(items);
  const doneCount = items.filter((i) => i.done).length;
  const nextUp = items.filter((i) => !i.done).slice(0, 3);

  const open = () => navigate({ to: "/assistant", search: { panel: "agenda" } });

  return (
    <button
      onClick={open}
      className={cn(
        "w-full rounded-(--radius-md) border p-4 text-left shadow-(--shadow-sm) transition-tenacious hover:border-(--color-primary) active:scale-[0.99]",
        status === "not_planned"
          ? "border-[var(--color-warning-soft-border)] bg-[var(--color-warning-soft-bg)]"
          : status === "done"
            ? "border-[var(--color-border)] bg-[var(--color-success-soft-bg)]"
            : "border-(--color-border) bg-[var(--color-background)]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ListTodo
            className={cn(
              "h-4 w-4",
              status === "not_planned"
                ? "text-[var(--color-warning-soft-fg-icon)]"
                : "text-(--color-primary)",
            )}
            aria-hidden
          />
          <span className="text-sm font-semibold">Today's Agenda</span>
        </div>
        {status !== "not_planned" && (
          <span
            className={cn(
              "text-xs font-medium tabular-nums",
              status === "done"
                ? "text-[var(--color-success-soft-fg)]"
                : "text-(--color-text-secondary)",
            )}
          >
            Done {doneCount}/{items.length}
          </span>
        )}
      </div>

      {status === "not_planned" ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-sm text-[var(--color-warning-soft-fg)]">
            You haven't planned today yet — a planned day is a closed day.
          </p>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--color-warning-soft-fg-strong)]">
            Plan your day <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
      ) : status === "done" ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-[var(--color-success-soft-fg)]">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          All {items.length} item{items.length === 1 ? "" : "s"} done — great work!
        </p>
      ) : (
        <ul className="mt-2 space-y-1">
          {nextUp.map((i) => (
            <li
              key={i.id}
              className="flex items-center gap-2 text-sm text-(--color-text-secondary)"
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-(--color-primary)"
              />
              <span className="truncate">{i.text}</span>
            </li>
          ))}
          {items.length - doneCount > 3 && (
            <li className="text-xs text-(--color-text-secondary)">
              +{items.length - doneCount - 3} more
            </li>
          )}
        </ul>
      )}
    </button>
  );
}
