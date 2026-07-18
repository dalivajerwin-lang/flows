import { useCallback, useSyncExternalStore } from "react";

/**
 * Media-query hook backed by useSyncExternalStore so the FIRST render already
 * reflects the real viewport (no false→true flash on route mount, which used
 * to cause a one-frame mobile-layout glitch on desktop navigations).
 * Server snapshot is `false`; components that differ per-breakpoint render
 * null pre-hydration anyway (profile gate), so no mismatch in practice.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useIsMobileNav = () => !useMediaQuery("(min-width: 640px)");
export const useIsSidebarExpanded = () => useMediaQuery("(min-width: 1024px)");
