import { createFileRoute } from "@tanstack/react-router";
import { ReportsPage } from "@/components/reports/reports-page";
import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/lib/route-boundaries";
import { requireAuth } from "@/lib/route-guards";

export const Route = createFileRoute("/reports")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Reports — Tenacious CRM" }] }),
  component: ReportsPage,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: RouteNotFoundBoundary,
});
