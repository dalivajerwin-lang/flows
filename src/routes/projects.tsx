import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/ui/empty-state";
import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/lib/route-boundaries";

export const Route = createFileRoute("/projects")({
  head: () => ({ meta: [{ title: "Projects Computation — Tenacious CRM" }] }),
  component: () => (
    <div>
      <div className="mb-4 hidden sm:block">
        <h1 className="text-[22px] font-semibold sm:text-3xl">Projects Computation</h1>
      </div>
      <EmptyState
        headline="Projects computation coming soon"
        description="Price calculators and payment schedules arrive in a later phase."
      />
    </div>
  ),
  errorComponent: RouteErrorBoundary,
  notFoundComponent: RouteNotFoundBoundary,
});
