import { Link, useLocation } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import type { NavItem } from "./nav-config";
import { cn } from "@/lib/utils";
import { formatBadgeCount } from "@/lib/format";

export function BottomNav({
  items,
  onFabClick,
  unreadCount,
}: {
  items: NavItem[];
  onFabClick: () => void;
  unreadCount: number;
}) {
  const location = useLocation();
  const [left, right] = [items.slice(0, 2), items.slice(2, 4)];
  const badge = formatBadgeCount(unreadCount);

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-background)] sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="relative mx-auto grid h-16 max-w-md grid-cols-5 items-stretch">
        {left.map((item) => (
          <NavTab
            key={item.to}
            item={item}
            active={location.pathname === item.to}
            badge={item.showBadge ? badge : ""}
          />
        ))}
        <div className="flex items-center justify-center">
          <button
            onClick={onFabClick}
            aria-label="Open quick actions menu"
            aria-haspopup="dialog"
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[var(--shadow-md)]",
              "bg-[var(--color-primary-hover)] active:brightness-110 active:scale-95",
              "transition-tenacious -translate-y-3",
            )}
          >
            <Plus size={26} />
          </button>
        </div>
        {right.map((item) => (
          <NavTab
            key={item.to}
            item={item}
            active={location.pathname === item.to}
            badge={item.showBadge ? badge : ""}
          />
        ))}
      </div>
    </nav>
  );
}

function NavTab({ item, active, badge }: { item: NavItem; active: boolean; badge: string }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className={cn(
        "relative flex min-h-[48px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-tenacious",
        active ? "text-[var(--color-primary)]" : "text-[var(--color-text-secondary)]",
      )}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={cn(
          "flex h-7 w-12 items-center justify-center rounded-full transition-tenacious",
          active && "bg-[var(--color-primary-light)]",
        )}
      >
        <Icon size={20} />
      </span>
      <span>{item.label}</span>
      {badge && (
        <span className="absolute right-3 top-1 rounded-full bg-[var(--color-error)] px-1.5 py-0.5 text-[10px] font-semibold text-white leading-none">
          {badge}
        </span>
      )}
    </Link>
  );
}
