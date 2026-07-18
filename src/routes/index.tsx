import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/components/dashboard/dashboard";
import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/lib/route-boundaries";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — Tenacious CRM" }] }),
  component: Dashboard,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: RouteNotFoundBoundary,
});
