import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AssistantPage } from "@/components/assistant/AssistantPage";
import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/lib/route-boundaries";
import { requireAuth } from "@/lib/route-guards";

// `panel` deep-links into a console panel (or the notifications tab) —
// see the effect in AssistantPage.
const searchSchema = z.object({
  panel: z.string().optional(),
});

export const Route = createFileRoute("/assistant")({
  beforeLoad: requireAuth,
  validateSearch: searchSchema,
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
