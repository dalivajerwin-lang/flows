import { useMemo } from "react";
import { format } from "date-fns";
import { Phone } from "lucide-react";
import type { Lead } from "@/stores/leads-store";
import { useProjects } from "@/hooks/use-projects";
import { StageBadge } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { LEAD_SOURCE_LABELS } from "@/lib/lead-sources";
import { cn } from "@/lib/utils";

export function LeadListTable({ leads, onOpen }: { leads: Lead[]; onOpen: (id: string) => void }) {
  const { data: projects = [] } = useProjects();
  const projectsById = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p.name])),
    [projects],
  );
  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-[var(--color-surface)]">
          <tr className="border-b border-[var(--color-border)]">
            {["Name", "Phone", "Stage", "Project", "Source", "Date Added", "Last Updated", ""].map(
              (h) => (
                <th
                  key={h}
                  className={cn(
                    "px-4 py-2 text-left text-[12px] font-medium uppercase tracking-wide text-[var(--color-text-secondary)]",
                  )}
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr
              key={l.id}
              onClick={() => onOpen(l.id)}
              className="group h-12 cursor-pointer border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface)]"
            >
              <td className="px-4">{l.full_name}</td>
              <td className="px-4 text-[var(--color-text-secondary)]">{l.contact_number || "—"}</td>
              <td className="px-4">
                <StageBadge stage={l.stage as any} />
              </td>
              <td className="px-4 text-[var(--color-text-secondary)]">
                {l.project_id ? (projectsById[l.project_id] ?? "—") : "—"}
              </td>
              <td className="px-4 text-[var(--color-text-secondary)]">
                {LEAD_SOURCE_LABELS[l.source as keyof typeof LEAD_SOURCE_LABELS]}
              </td>
              <td className="px-4 text-[var(--color-text-secondary)]">
                {format(new Date(l.date_added), "MMM d, yyyy")}
              </td>
              <td className="px-4 text-[var(--color-text-secondary)]">
                {format(new Date(l.updated_at), "MMM d")}
              </td>
              <td className="px-4">
                <div className="flex justify-end gap-1 opacity-0 transition-tenacious group-hover:opacity-100">
                  {l.contact_number && (
                    <Button asChild size="sm" variant="ghost" onClick={(e) => e.stopPropagation()}>
                      <a href={`tel:${l.contact_number}`} aria-label="Call">
                        <Phone size={14} />
                        Call
                      </a>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(l.id);
                    }}
                  >
                    Open
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
