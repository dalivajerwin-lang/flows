import { createFileRoute } from "@tanstack/react-router";
import { AssistantPage } from "@/components/assistant/AssistantPage";
import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/lib/route-boundaries";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "Assistant — Team Tenacious CRM" },
      {
        name: "description",
        content: "Conversational and console assistant for property consultants and managers.",
      },
    ],
  }),
  component: AssistantPage,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: RouteNotFoundBoundary,
});
