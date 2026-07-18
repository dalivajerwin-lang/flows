import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth, useCurrentProfile } from "@/stores/auth-store";
import { LogOut, Settings, User } from "lucide-react";

export function ProfileMenu({ onClose }: { onClose: () => void }) {
  const profile = useCurrentProfile();
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();
  if (!profile) return null;
  return (
    <div
      role="menu"
      className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-1.5 shadow-[var(--shadow-md)] text-[var(--color-text)]"
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
