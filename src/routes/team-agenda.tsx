import { createFileRoute } from "@tanstack/react-router";
import { TeamAgendaOverview } from "@/components/agenda/team-agenda-overview";
import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/lib/route-boundaries";
import { requireManager } from "@/lib/route-guards";

export const Route = createFileRoute("/team-agenda")({
  beforeLoad: requireManager,
  head: () => ({ meta: [{ title: "Team Agenda — Tenacious CRM" }] }),
  component: TeamAgendaPage,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: RouteNotFoundBoundary,
});

function TeamAgendaPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Team Agenda</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Who has planned their day, who's in progress, and who needs a nudge.
        </p>
      </div>
      <TeamAgendaOverview />
    </div>
  );
}
