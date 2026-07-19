import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireSuperadmin } from "@/lib/route-guards";
import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/lib/route-boundaries";

/**
 * Layout route for the superadmin area. One guard covers every /admin
 * page; the database (RLS + SECURITY DEFINER RPCs) remains the real
 * enforcement — this redirect is UX only.
 */
export const Route = createFileRoute("/admin")({
  beforeLoad: requireSuperadmin,
  component: AdminLayout,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: RouteNotFoundBoundary,
});

function AdminLayout() {
  return <Outlet />;
}
