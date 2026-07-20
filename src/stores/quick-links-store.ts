import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Per-user dashboard quick-link shortcuts.
 * Stores only shortcut IDs (ordered). The catalog of what each ID does —
 * icon, label, action, role restriction — lives in the dashboard component,
 * so stale/unknown IDs are silently dropped on render.
 */

export const CONSULTANT_DEFAULT_SHORTCUTS = ["add", "agenda", "crf", "schedule", "sellers"];
export const MANAGER_DEFAULT_SHORTCUTS = [
  "add",
  "team-agenda",
  "broadcast",
  "reassign",
  "export",
  "sellers",
];

interface QuickLinksState {
  /** userId -> ordered shortcut ids; absent key = role defaults */
  byUser: Record<string, string[]>;
  setShortcuts: (userId: string, ids: string[]) => void;
  reset: (userId: string) => void;
}

export const useQuickLinks = create<QuickLinksState>()(
  persist(
    (set) => ({
      byUser: {},
      setShortcuts: (userId, ids) => set((s) => ({ byUser: { ...s.byUser, [userId]: ids } })),
      reset: (userId) =>
        set((s) => {
          const next = { ...s.byUser };
          delete next[userId];
          return { byUser: next };
        }),
    }),
    { name: "tenacious:quick-links" },
  ),
);
