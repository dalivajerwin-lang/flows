import { createFileRoute } from "@tanstack/react-router";
import { ReportsPage } from "@/components/reports/reports-page";
import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/lib/route-boundaries";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — Tenacious CRM" }] }),
  component: ReportsPage,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: RouteNotFoundBoundary,
});
