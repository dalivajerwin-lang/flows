import { Search } from "lucide-react";
import { useState } from "react";
import { useCurrentProfile } from "@/stores/auth-store";
import { NotificationBell } from "./notification-bell";
import { ProfileMenu } from "./profile-menu";
import { initials } from "@/lib/format";

export function TopBar({ title }: { title: string }) {
  const profile = useCurrentProfile();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex sticky top-0 z-20 h-14 items-center border-b border-[var(--color-border)] bg-white px-4 lg:px-6">
      <h1 className="text-lg font-semibold text-[var(--color-text)] lg:text-xl">{title}</h1>
      <div className="ml-6 hidden max-w-[480px] flex-1 lg:block">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-placeholder)]"
          />
          <input
            aria-label="Global search"
            placeholder="Search… ⌘K"
            className="h-10 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>
      <div className="ml-auto flex items-center gap-1 relative">
        <NotificationBell />
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Open profile menu"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-hover)] text-sm font-semibold text-white overflow-hidden"
        >
          {profile?.profile_photo_url ? (
            <img src={profile.profile_photo_url} alt="" className="h-full w-full object-cover" />
          ) : profile ? (
            initials(profile.display_name)
          ) : (
            "?"
          )}
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-12 z-40 w-56">
              <ProfileMenu onClose={() => setMenuOpen(false)} />
            </div>
          </>
        )}
      </div>
    </header>
  );
}
