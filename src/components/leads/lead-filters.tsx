import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { STAGES, STAGE_LABELS, type Stage } from "@/lib/constants";
import { useLeadsUI, type SortKey } from "@/stores/leads-store";
import { useProfiles } from "@/hooks/use-profiles";
import { useCurrentProfile } from "@/stores/auth-store";
import { isManagerish } from "@/hooks/use-role";

const CHIPS: Array<{ key: Stage | "all" | "trash"; label: string; managerOnly?: boolean }> = [
  { key: "all", label: "All" },
  ...STAGES.map((s) => ({ key: s, label: STAGE_LABELS[s] })),
  { key: "trash", label: "Trash", managerOnly: true },
];

export function LeadFilters() {
  const ui = useLeadsUI();
  const profile = useCurrentProfile();
  const isManager = isManagerish(profile?.role ?? null);
  const { data: profiles = [] } = useProfiles();
  const consultants = profiles.filter(
    (p) => p.role === "property_consultant" || p.role === "manager",
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
          <Input
            value={ui.search}
            onChange={(e) => ui.setSearch(e.target.value)}
            placeholder="Search leads…"
            className="pl-9"
            aria-label="Search leads"
          />
        </div>
        {isManager && (
          <div className="flex gap-2">
            <Select
              value={ui.consultantFilter || "__all"}
              onValueChange={(v) => ui.setConsultantFilter(v === "__all" ? "" : v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Consultant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All consultants</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {consultants.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ui.sortKey} onValueChange={(v) => ui.setSortKey(v as SortKey)}>
              <SelectTrigger className="w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_desc">Date Added</SelectItem>
                <SelectItem value="updated_desc">Last Updated</SelectItem>
                <SelectItem value="name_asc">Name A–Z</SelectItem>
                <SelectItem value="stage">Stage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {CHIPS.filter((c) => !c.managerOnly || isManager).map((c) => {
          const active = ui.stageChips.has(c.key);
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => ui.toggleStageChip(c.key)}
              className={cn(
                "min-h-[32px] rounded-[var(--radius-pill)] border px-3 text-xs font-medium transition-tenacious",
                active
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary-hover)]"
                  : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]",
              )}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
