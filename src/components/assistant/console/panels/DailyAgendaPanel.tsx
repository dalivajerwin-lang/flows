import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Calendar, Plus, Trash2, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PanelCard } from "../PanelCard";
import { useAppointments } from "@/hooks/use-appointments";
import { db as supabase } from "@/lib/supabase";
import { useCurrentProfile } from "@/stores/auth-store";
import {
  useMyAgenda,
  addAgendaItem,
  toggleAgendaItem,
  removeAgendaItem,
} from "@/hooks/use-daily-agenda";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/tenacious-button";

export function DailyAgendaPanel() {
  const profile = useCurrentProfile();
  const { data: appointments = [] } = useAppointments(
    profile ? { consultantId: profile.id } : undefined,
  );
  // Today's audit entries by this user — used to flag past appointments that
  // still need an activity log (schedule-store writes activities to audit_trail).
  const { data: todaysActivities = [] } = useQuery({
    queryKey: ["audit_trail", "today", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("audit_trail")
        .select("lead_id, actor_id, created_at")
        .eq("actor_id", profile!.id)
        .gte("created_at", start.toISOString());
      if (error) throw new Error(error.message);
      return (data ?? []) as { lead_id: string | null; actor_id: string; created_at: string }[];
    },
  });
  const { data: todos = [] } = useMyAgenda();
  const [draft, setDraft] = useState("");
  const doneCount = todos.filter((t) => t.done).length;

  const today = useMemo(() => {
    if (!profile) return [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return appointments
      .filter((a) => a.consultant_id === profile.id)
      .filter((a) => {
        const d = new Date(a.starts_at).getTime();
        return d >= start.getTime() && d <= end.getTime();
      })
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }, [appointments, profile]);

  if (!profile) return null;

  return (
    <PanelCard
      id="panel-agenda"
      defaultExpanded
      icon={<Calendar size={16} className="text-[var(--color-primary)]" />}
      title="Daily Agenda Planner"
    >
      {today.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)]">Nothing scheduled today.</p>
      ) : (
        <ul className="mb-4 space-y-2">
          {today.map((a) => {
            const past = new Date(a.starts_at).getTime() < Date.now();
            const hasActivityToday = todaysActivities.some(
              (act) =>
                act.lead_id === a.lead_id &&
                act.actor_id === profile.id &&
                new Date(act.created_at).toDateString() === new Date().toDateString(),
            );
            const needsLog = past && !hasActivityToday && !!a.lead_id;
            return (
              <li
                key={a.id}
                className={cn(
                  "rounded-md border p-3 text-sm",
                  needsLog
                    ? "border-[var(--color-warning-soft-border)] bg-[var(--color-warning-soft-bg)]"
                    : "border-[var(--color-border-muted)]",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">
                      {format(new Date(a.starts_at), "HH:mm")} · {a.title}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      {a.appointment_type.replace(/_/g, " ")}
                    </div>
                    {needsLog && (
                      <div className="mt-2 text-xs text-[var(--color-warning-soft-fg)]">
                        Logging required: How did the session go?
                      </div>
                    )}
                  </div>
                  {needsLog && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        window.location.href = `/leads?lead=${a.lead_id}`;
                      }}
                    >
                      📝 Log Activity
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="border-t border-[var(--color-border-subtle)] pt-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-[var(--color-text-secondary)]">
            Today's Agenda
          </span>
          {todos.length > 0 && (
            <span
              className={cn(
                "text-xs font-medium",
                doneCount === todos.length
                  ? "text-[var(--color-success-soft-fg)]"
                  : "text-[var(--color-text-secondary)]",
              )}
            >
              Done {doneCount}/{todos.length}
            </span>
          )}
        </div>
        <form
          className="mb-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) {
              addAgendaItem(profile.id, draft.trim());
              setDraft("");
            }
          }}
        >
          <input
            className="flex-1 rounded-md border border-[var(--color-border-muted)] px-3 py-2 text-sm"
            placeholder="Add an agenda item…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <Button type="submit" size="sm" variant="secondary">
            <Plus size={14} />
          </Button>
        </form>
        <ul className="space-y-1">
          {todos.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-[var(--color-surface-subtle)]"
            >
              <button
                onClick={() => toggleAgendaItem(t)}
                aria-label={t.done ? `Mark "${t.text}" as not done` : `Mark "${t.text}" as done`}
                aria-pressed={t.done}
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                  t.done
                    ? "border-[var(--color-primary-hover)] bg-[var(--color-primary-hover)] text-white"
                    : "border-[var(--color-border)]",
                )}
              >
                {t.done && <Check size={12} />}
              </button>
              <span
                className={cn("flex-1", t.done && "text-[var(--color-text-subtle)] line-through")}
              >
                {t.text}
              </span>
              <button
                onClick={() => removeAgendaItem(t.id)}
                aria-label={`Remove "${t.text}"`}
                className="text-[var(--color-text-subtle)] hover:text-[var(--color-danger-solid)]"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
          {todos.length === 0 && (
            <li className="text-xs text-[var(--color-text-subtle)]">
              Nothing planned yet — add your first item to start today's agenda.
            </li>
          )}
        </ul>
      </div>
    </PanelCard>
  );
}
