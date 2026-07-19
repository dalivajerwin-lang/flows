import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { queryClient } from "./lib/query-client";

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Preload route code on hover/touchstart so tab switches feel instant.
    defaultPreload: "intent",
    defaultPreloadStaleTime: 30 * 1000,
  });

  return router;
};
