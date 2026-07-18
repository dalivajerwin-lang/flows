import { useMemo, useRef, useEffect, useState } from "react";
import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, RotateCcw } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useCurrentProfile } from "@/stores/auth-store";
import { useProjects } from "@/hooks/use-projects";
import { isManagerish } from "@/hooks/use-role";
import { STAGE_LABELS } from "@/lib/constants";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useVisibleLeads, useLeadsUI, filterAndSortLeads, restoreLead } from "@/stores/leads-store";
import { useLeadDialogs } from "@/stores/lead-dialogs-store";
import { LeadFilters } from "@/components/leads/lead-filters";
import { LeadListCards } from "@/components/leads/lead-list-cards";
import { LeadListTable } from "@/components/leads/lead-list-table";
import { LeadDetailSlideOver } from "@/components/leads/lead-detail-slideover";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog";
import { RestoreConflictModal } from "@/components/leads/restore-conflict-modal";
import { toast } from "sonner";

import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/lib/route-boundaries";
import { requireAuth } from "@/lib/route-guards";

const searchSchema = z.object({
  lead: z.string().optional(),
  stage: z
    .enum(["new_lead", "crf", "reserved", "documentation", "closed_sale", "cancelled", "archived"])
    .optional(),
  assigned: z.string().optional(),
});

export const Route = createFileRoute("/leads")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Leads — Tenacious CRM" }] }),
  validateSearch: searchSchema,
  component: LeadsPage,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: RouteNotFoundBoundary,
});

function LeadsPage() {
  const search = useSearch({ from: "/leads" });
  const navigate = useNavigate();
  const profile = useCurrentProfile();
  const isManager = isManagerish(profile?.role ?? null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const ui = useLeadsUI();
  const debouncedSearch = useDebouncedValue(ui.search, 350);

  // Apply incoming dashboard filters (?stage= / ?assigned=) once, then strip them
  // from the URL so subsequent chip edits aren't overridden.
  useEffect(() => {
    if (!search.stage && !search.assigned) return;
    if (search.stage) ui.setStageChip(search.stage);
    if (search.assigned) ui.setConsultantFilter(search.assigned);
    navigate({
      to: "/leads",
      search: search.lead ? { lead: search.lead } : {},
      replace: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.stage, search.assigned]);

  const trashView = ui.stageChips.has("trash");
  const activeResult = useVisibleLeads({ includeTrash: false });
  const trashedResult = useVisibleLeads({ includeTrash: true });
  const sourceResult = trashView ? trashedResult : activeResult;
  const source = sourceResult.leads;

  const { data: projects = [] } = useProjects();
  const projectsById = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p.name])),
    [projects],
  );

  const filtered = useMemo(
    () =>
      filterAndSortLeads(source, { ...ui, search: debouncedSearch }, projectsById, STAGE_LABELS),
    [source, ui, debouncedSearch, projectsById],
  );

  const visible = filtered.slice(0, ui.visibleCount);

  const dialog = useLeadDialogs();
  const [restoreConflict, setRestoreConflict] = useState<string | null>(null);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && ui.visibleCount < filtered.length) {
          ui.setVisibleCount(ui.visibleCount + 20);
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length, ui]);

  const openLead = (id: string) => navigate({ to: "/leads", search: { lead: id } });
  const closeLead = () => navigate({ to: "/leads", search: {} });

  const hasFilterActive =
    debouncedSearch.length >= 2 ||
    ui.consultantFilter !== "" ||
    (!ui.stageChips.has("all") && !trashView);

  const totalForCount = filtered.length;

  return (
    <div>
      <div className="mb-4 hidden items-center justify-between sm:flex">
        <h1 className="text-[22px] font-semibold sm:text-3xl">
          {isManager ? "All Leads" : "My Leads"}
        </h1>
        <Button onClick={() => dialog.setAddOpen(true)}>
          <Plus size={16} /> {isManager ? "Add & Assign Client" : "Add Client"}
        </Button>
      </div>

      <div className="mb-4">
        <LeadFilters />
      </div>

      <div className="mb-2 text-xs text-[var(--color-text-secondary)]">
        Showing {visible.length} of {totalForCount} leads
      </div>

      {sourceResult.isError ? (
        <ErrorState
          message="Couldn't load leads. Check your connection and try again."
          onRetry={sourceResult.refetch}
        />
      ) : sourceResult.isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyStateForContext
          hasFilterActive={hasFilterActive}
          isManager={isManager}
          trashView={trashView}
          onAdd={() => dialog.setAddOpen(true)}
          onClear={() => ui.clearFilters()}
        />
      ) : isDesktop ? (
        <LeadListTable
          leads={visible}
          onOpen={
            trashView
              ? (id) => {
                  const res = restoreLead(id);
                  if ("ok" in res && res.ok) {
                    toast.success("Lead restored");
                  } else if ("conflict" in res) {
                    setRestoreConflict("another consultant");
                  }
                }
              : openLead
          }
        />
      ) : (
        <div>
          {trashView ? (
            <ul className="flex flex-col gap-2">
              {visible.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-3"
                >
                  <span className="truncate text-sm">{l.full_name}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const res = restoreLead(l.id);
                      if ("ok" in res && res.ok) toast.success("Lead restored");
                      else if ("conflict" in res) setRestoreConflict("another consultant");
                    }}
                  >
                    <RotateCcw size={14} /> Restore
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <LeadListCards leads={visible} onOpen={openLead} />
          )}
        </div>
      )}

      {ui.visibleCount < filtered.length && (
        <div ref={sentinelRef} className="mt-4 flex flex-col gap-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}

      <LeadDetailSlideOver leadId={search.lead ?? null} onClose={closeLead} />
      <AddLeadDialog open={dialog.addOpen} onOpenChange={dialog.setAddOpen} />
      <RestoreConflictModal
        open={restoreConflict != null}
        onOpenChange={(v) => !v && setRestoreConflict(null)}
        activeAgentName="[Active Agent]"
      />
    </div>
  );
}

function EmptyStateForContext({
  hasFilterActive,
  isManager,
  trashView,
  onAdd,
  onClear,
}: {
  hasFilterActive: boolean;
  isManager: boolean;
  trashView: boolean;
  onAdd: () => void;
  onClear: () => void;
}) {
  if (hasFilterActive) {
    return (
      <EmptyState
        headline="No leads match your current filter"
        description="Try adjusting your search or clearing the filters."
        actionLabel="Clear Filters"
        onAction={onClear}
      />
    );
  }
  if (trashView) {
    return (
      <EmptyState
        headline="Trash is empty"
        description="Deleted leads appear here for 30 days before permanent removal."
      />
    );
  }
  if (isManager) {
    return (
      <EmptyState
        headline="No leads yet"
        description="Add your first client or assign an existing one to a consultant."
        actionLabel="Add & Assign Client"
        onAction={onAdd}
      />
    );
  }
  return (
    <EmptyState
      headline="Your pipeline is empty"
      description="Tap the (+) button to register your first client!"
      actionLabel="Add Client"
      onAction={onAdd}
    />
  );
}
