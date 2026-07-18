import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PanelCardProps {
  icon?: ReactNode;
  title: string;
  defaultExpanded?: boolean;
  badge?: ReactNode;
  children: ReactNode;
  id?: string;
  className?: string;
}

export function PanelCard({
  icon,
  title,
  defaultExpanded = false,
  badge,
  children,
  id,
  className,
}: PanelCardProps) {
  const [open, setOpen] = useState(defaultExpanded);
  return (
    <section
      id={id}
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white shadow-sm",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-t-[var(--radius-md)] px-4 py-3 text-left hover:bg-[var(--color-surface-subtle)]"
        aria-expanded={open}
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        {icon}
        <span className="flex-1 font-semibold text-[15px]">{title}</span>
        {badge}
      </button>
      {open && <div className="border-t border-[var(--color-border)] p-4">{children}</div>}
    </section>
  );
}
