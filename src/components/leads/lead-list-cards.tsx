import { useMemo } from "react";
import { format } from "date-fns";
import type { Lead } from "@/stores/leads-store";
import { StageBadge } from "@/components/ui/status-chip";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProjects } from "@/hooks/use-projects";

export function LeadListCards({ leads, onOpen }: { leads: Lead[]; onOpen: (id: string) => void }) {
  const { data: projects = [] } = useProjects();
  const projectsById = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p.name])),
    [projects],
  );

  return (
    <ul className="flex flex-col gap-2">
      {leads.map((l) => (
        <li key={l.id}>
          <button
            type="button"
            onClick={() => onOpen(l.id)}
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 text-left transition-tenacious hover:bg-[var(--color-surface)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <Avatar className="h-12 w-12 border border-[var(--color-border)] bg-[var(--color-primary-light)]">
                  {l.profile_photo_url && (
                    <AvatarImage src={l.profile_photo_url} alt="" className="object-cover" />
                  )}
                  <AvatarFallback className="bg-[var(--color-primary-light)] text-sm font-semibold text-[var(--color-primary)]">
                    {leadInitials(l.full_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <div className="truncate font-medium text-[var(--color-text)]">{l.full_name}</div>
                  <div className="mt-0.5 truncate text-xs text-[var(--color-text-secondary)]">
                    {l.contact_number || "No phone"}
                  </div>
                  <div className="mt-1 truncate text-xs text-[var(--color-text-secondary)]">
                    {l.project_id ? (projectsById[l.project_id] ?? "-") : "-"} · Added{" "}
                    {format(new Date(l.date_added), "MMM d")}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {l.is_sample && <Badge variant="secondary">Training</Badge>}
                <StageBadge stage={l.stage as any} />
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

function leadInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
