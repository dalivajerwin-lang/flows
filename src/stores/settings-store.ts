import { create } from "zustand";

const KEY = "tenacious.settings.v1";

interface SettingsState {
  sidebarCollapsed: boolean;
  splashShown: boolean;
  toggleSidebar: () => void;
  markSplashShown: () => void;
  hydrate: () => void;
}

function read(): { sidebarCollapsed: boolean } {
  if (typeof window === "undefined") return { sidebarCollapsed: false };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { sidebarCollapsed: false };
}

function write(v: { sidebarCollapsed: boolean }) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(v));
}

export const useSettings = create<SettingsState>((set, get) => ({
  sidebarCollapsed: false,
  splashShown: false,
  hydrate: () => set({ sidebarCollapsed: read().sidebarCollapsed }),
  toggleSidebar: () => {
    const v = !get().sidebarCollapsed;
    write({ sidebarCollapsed: v });
    set({ sidebarCollapsed: v });
  },
  markSplashShown: () => set({ splashShown: true }),
}));
