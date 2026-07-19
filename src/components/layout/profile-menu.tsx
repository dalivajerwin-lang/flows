import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth, useCurrentProfile } from "@/stores/auth-store";
import { useSettings, type Theme } from "@/stores/settings-store";
import { LogOut, Monitor, Moon, Settings, Sun, User } from "lucide-react";

const THEME_CYCLE: Record<Theme, Theme> = { light: "dark", dark: "system", system: "light" };
const THEME_LABEL: Record<Theme, string> = { light: "Light", dark: "Dark", system: "System" };
const THEME_ICON: Record<Theme, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };

export function ProfileMenu({ onClose }: { onClose: () => void }) {
  const profile = useCurrentProfile();
  const logout = useAuth((s) => s.logout);
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);
  const navigate = useNavigate();
  if (!profile) return null;
  const ThemeIcon = THEME_ICON[theme];
  return (
    <div
      role="menu"
      className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] p-1.5 shadow-[var(--shadow-md)] text-[var(--color-text)]"
    >
      <Link
        to="/profile"
        onClick={onClose}
        className="flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm hover:bg-[var(--color-surface)]"
      >
        <User size={16} /> My Profile
      </Link>
      <Link
        to="/settings"
        onClick={onClose}
        className="flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm hover:bg-[var(--color-surface)]"
      >
        <Settings size={16} /> Settings
      </Link>
      <button
        onClick={() => setTheme(THEME_CYCLE[theme])}
        className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm hover:bg-[var(--color-surface)]"
      >
        <ThemeIcon size={16} /> Theme
        <span className="ml-auto text-xs text-[var(--color-text-secondary)]">
          {THEME_LABEL[theme]}
        </span>
      </button>
      <button
        onClick={() => {
          logout();
          onClose();
          navigate({ to: "/login" });
        }}
        className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm text-[var(--color-error)] hover:bg-[var(--color-surface)]"
      >
        <LogOut size={16} /> Log Out
      </button>
    </div>
  );
}
