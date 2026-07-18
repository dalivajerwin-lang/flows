import { createFileRoute } from "@tanstack/react-router";
import { LeaderboardPage } from "@/components/leaderboard/leaderboard-page";
import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/lib/route-boundaries";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — Tenacious CRM" }] }),
  component: LeaderboardPage,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: RouteNotFoundBoundary,
});
