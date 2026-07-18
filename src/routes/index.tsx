import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/components/dashboard/dashboard";
import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/lib/route-boundaries";
import { requireAuth } from "@/lib/route-guards";

export const Route = createFileRoute("/")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Dashboard — Tenacious CRM" }] }),
  component: Dashboard,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: RouteNotFoundBoundary,
});
