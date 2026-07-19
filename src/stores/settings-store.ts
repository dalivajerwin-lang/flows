import { create } from "zustand";

const KEY = "tenacious.settings.v1";

export type Theme = "light" | "dark" | "system";

const THEME_COLOR_LIGHT = "#069494";
const THEME_COLOR_DARK = "#0f1417";

interface SettingsState {
  sidebarCollapsed: boolean;
  splashShown: boolean;
  theme: Theme;
  /** The applied theme with "system" resolved — kept in sync by applyTheme(). */
  resolvedTheme: "light" | "dark";
  toggleSidebar: () => void;
  markSplashShown: () => void;
  setTheme: (theme: Theme) => void;
  hydrate: () => void;
}

interface PersistedSettings {
  sidebarCollapsed: boolean;
  theme: Theme;
}

function read(): PersistedSettings {
  const fallback: PersistedSettings = { sidebarCollapsed: false, theme: "system" };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        sidebarCollapsed: parsed.sidebarCollapsed ?? false,
        theme: parsed.theme === "light" || parsed.theme === "dark" ? parsed.theme : "system",
      };
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

function write(v: PersistedSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(v));
}

export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Applies the resolved theme to <html> and syncs the meta theme-color tag. */
function applyTheme(theme: Theme): "light" | "dark" {
  const resolved = resolveTheme(theme);
  if (typeof document === "undefined") return resolved;
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.dataset.theme = resolved;
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((el) =>
      el.setAttribute("content", resolved === "dark" ? THEME_COLOR_DARK : THEME_COLOR_LIGHT),
    );
  return resolved;
}

// Follow OS theme changes while in "system" mode. Module-level singleton —
// the store itself is a singleton, so one listener for the app lifetime.
if (typeof window !== "undefined") {
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (useSettings.getState().theme === "system") {
        useSettings.setState({ resolvedTheme: applyTheme("system") });
      }
    });
}

export const useSettings = create<SettingsState>((set, get) => ({
  sidebarCollapsed: false,
  splashShown: false,
  theme: "system",
  resolvedTheme: "light",
  hydrate: () => {
    const v = read();
    set({ sidebarCollapsed: v.sidebarCollapsed, theme: v.theme, resolvedTheme: applyTheme(v.theme) });
  },
  toggleSidebar: () => {
    const v = !get().sidebarCollapsed;
    write({ sidebarCollapsed: v, theme: get().theme });
    set({ sidebarCollapsed: v });
  },
  setTheme: (theme) => {
    write({ sidebarCollapsed: get().sidebarCollapsed, theme });
    set({ theme, resolvedTheme: applyTheme(theme) });
  },
  markSplashShown: () => set({ splashShown: true }),
}));

/** The currently applied theme ("light" | "dark") — resolves "system". */
export function useResolvedTheme(): "light" | "dark" {
  return useSettings((s) => s.resolvedTheme);
}
