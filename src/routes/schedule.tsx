import { createFileRoute } from "@tanstack/react-router";
import { SchedulePage } from "@/components/schedule/schedule-page";
import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/lib/route-boundaries";
import { requireAuth } from "@/lib/route-guards";

export const Route = createFileRoute("/schedule")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: [
      { title: "Schedule — Tenacious CRM" },
      {
        name: "description",
        content:
          "Client meetings, presentations, and manning shifts for the Team Tenacious real-estate team.",
      },
    ],
  }),
  component: SchedulePage,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: RouteNotFoundBoundary,
});
