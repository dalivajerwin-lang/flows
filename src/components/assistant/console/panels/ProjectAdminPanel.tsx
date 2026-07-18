import { Building2, Info } from "lucide-react";
import { PanelCard } from "../PanelCard";
import { useProjects } from "@/hooks/use-projects";

export function ProjectAdminPanel() {
  const { data: projects = [] } = useProjects();
  return (
    <PanelCard
      icon={<Building2 size={16} className="text-[var(--color-primary)]" />}
      title="Project Management (Admin)"
    >
      <div className="mb-2 flex items-center gap-2 rounded-md bg-[var(--color-info-soft-bg)] p-2 text-xs text-[var(--color-info-soft-fg)]">
        <Info size={14} /> Full add/edit with computation upload is available on the Projects page.
      </div>
      <ul className="space-y-2">
        {projects.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between rounded-md border border-[var(--color-border-muted)] px-3 py-2 text-sm"
          >
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-[var(--color-text-secondary)]">{p.developer}</div>
            </div>
            <span
              className={`rounded px-2 py-0.5 text-xs ${p.is_active ? "bg-[var(--color-success-soft-bg-stronger)] text-[var(--color-success-soft-fg)]" : "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]"}`}
            >
              {p.is_active ? "Active" : "Inactive"}
            </span>
          </li>
        ))}
      </ul>
    </PanelCard>
  );
}
