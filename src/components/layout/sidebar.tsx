import { Link, useLocation } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import type { NavItem } from "./nav-config";
import { cn } from "@/lib/utils";
import { formatBadgeCount } from "@/lib/format";
import { useSettings } from "@/stores/settings-store";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useCurrentProfile } from "@/stores/auth-store";
import { initials } from "@/lib/format";
import { ProfileMenu } from "./profile-menu";

export function Sidebar({
  items,
  unreadCount,
  onQuickActions,
}: {
  items: NavItem[];
  unreadCount: number;
  onQuickActions: () => void;
}) {
  const location = useLocation();
  const isExpandedBreakpoint = useMediaQuery("(min-width: 1024px)");
  const collapsedPref = useSettings((s) => s.sidebarCollapsed);
  const toggle = useSettings((s) => s.toggleSidebar);
  const profile = useCurrentProfile();
  const [profileOpen, setProfileOpen] = useState(false);

  // 640–1023px: forced icon-only 64px. >=1024px: user preference.
  const collapsed = !isExpandedBreakpoint || collapsedPref;
  const badge = formatBadgeCount(unreadCount);

  return (
    <aside
      className={cn(
        "hidden sm:flex fixed inset-y-0 left-0 z-30 flex-col bg-[var(--color-sidebar)] text-white transition-tenacious",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Wordmark */}
      <div className="flex h-16 items-center px-4">
        {collapsed ? (
          <span className="mx-auto text-xl font-semibold">T</span>
        ) : (
          <span className="text-xl font-semibold">Tenacious</span>
        )}
      </div>

      {/* Add client */}
      <div className={cn("px-3 pb-3", collapsed && "px-2")}>
        <button
          onClick={onQuickActions}
          aria-label="Add client"
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-3 py-2.5 text-sm font-semibold text-[var(--color-primary-foreground)] transition-tenacious hover:bg-[var(--color-primary-hover)]",
          )}
        >
          <Plus size={18} />
          {!collapsed && <span>Add Client</span>}
        </button>
      </div>

      {/* Nav */}
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative mb-0.5 flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium min-h-[40px] transition-tenacious",
                active
                  ? "bg-white/[0.08] text-white"
                  : "text-[var(--color-text-placeholder)] hover:bg-white/[0.06] hover:text-white",
                collapsed && "justify-center px-0",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r bg-[var(--color-primary)]" />
              )}
              <Icon size={18} />
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {item.showBadge && badge && !collapsed && (
                <span className="rounded-full bg-[var(--color-error)] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                  {badge}
                </span>
              )}
              {item.showBadge && badge && collapsed && (
                <span className="absolute right-1 top-1 rounded-full bg-[var(--color-error)] px-1 py-0.5 text-[9px] font-semibold leading-none text-white">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User zone */}
      <div className="border-t border-white/[0.08] p-2 relative">
        <button
          onClick={() => setProfileOpen((v) => !v)}
          className={cn(
            "flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2 text-left hover:bg-white/[0.06]",
            collapsed && "justify-center px-0",
          )}
          aria-label="Open profile menu"
          aria-haspopup="menu"
          aria-expanded={profileOpen}
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-hover)] text-sm font-semibold text-white overflow-hidden">
            {profile?.profile_photo_url ? (
              <img src={profile.profile_photo_url} alt="" className="h-full w-full object-cover" />
            ) : profile ? (
              initials(profile.display_name)
            ) : (
              "?"
            )}
          </div>
          {!collapsed && profile && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-white">{profile.display_name}</div>
              <div className="text-xs text-[var(--color-text-secondary)]">
                {profile.role === "property_consultant"
                  ? "Property Consultant"
                  : profile.role === "manager"
                    ? "Manager"
                    : "Super Admin"}
              </div>
            </div>
          )}
        </button>
        {profileOpen && (
          <div className="absolute bottom-full left-2 right-2 mb-2">
            <ProfileMenu onClose={() => setProfileOpen(false)} />
          </div>
        )}
      </div>

      {/* Collapse toggle (>=1024px only) */}
      {isExpandedBreakpoint && (
        <button
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-placeholder)] hover:bg-white/[0.06]"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      )}
    </aside>
  );
}
