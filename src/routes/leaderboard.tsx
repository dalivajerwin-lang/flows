import { createFileRoute } from "@tanstack/react-router";
import { LeaderboardPage } from "@/components/leaderboard/leaderboard-page";
import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/lib/route-boundaries";
import { requireAuth } from "@/lib/route-guards";

export const Route = createFileRoute("/leaderboard")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Leaderboard — Tenacious CRM" }] }),
  component: LeaderboardPage,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: RouteNotFoundBoundary,
});
