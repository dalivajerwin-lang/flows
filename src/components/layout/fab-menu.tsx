import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { useLeadDialogs } from "@/stores/lead-dialogs-store";
import { useCurrentProfile } from "@/stores/auth-store";
import type { Role } from "@/lib/constants";
import {
  UserPlus,
  Calculator,
  Link as LinkIcon,
  CalendarPlus,
  ClipboardCheck,
  FileBarChart,
  Store,
  Trophy,
  UsersRound,
  Building,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Blueprint: official attendance submission form (office or manning attendance).
const ATTENDANCE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSe3Oz5L_zFGdYdFavvAGgI5oFYC5YkifXfIN3AHssQK4fqm9Q/viewform?pli=1";

interface Action {
  label: string;
  icon: LucideIcon;
  handler?: "add_lead" | "schedule";
}

const consultantActions: Action[] = [
  { label: "Add a Client", icon: UserPlus, handler: "add_lead" },
  { label: "Projects Computation", icon: Calculator },
  { label: "CRF Link", icon: LinkIcon },
  { label: "Schedule", icon: CalendarPlus, handler: "schedule" },
  { label: "Submit Attendance", icon: ClipboardCheck },
  { label: "Report", icon: FileBarChart },
  { label: "Sellers Portal", icon: Store },
  { label: "Leaderboard", icon: Trophy },
];

const managerActions: Action[] = [
  { label: "Add & Assign Client", icon: UserPlus, handler: "add_lead" },
  { label: "Projects", icon: Building },
  { label: "Projects Computation", icon: Calculator },
  { label: "CRF Link", icon: LinkIcon },
  { label: "Reports", icon: FileBarChart },
  { label: "Sellers Portal", icon: Store },
  { label: "Schedule", icon: CalendarPlus, handler: "schedule" },
  { label: "Team", icon: UsersRound },
  { label: "Leaderboard", icon: Trophy },
];

// Superadmin = manager actions + the admin console at the top (mirrors sidebarFor).
const superadminActions: Action[] = [{ label: "Admin", icon: ShieldCheck }, ...managerActions];

export function FabMenu({
  open,
  onOpenChange,
  role,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  role: Role;
}) {
  const profile = useCurrentProfile();
  const setAddOpen = useLeadDialogs((s) => s.setAddOpen);
  const navigate = useNavigate();
  const actions =
    role === "property_consultant"
      ? consultantActions
      : role === "superadmin"
        ? superadminActions
        : managerActions;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Quick Actions">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={async () => {
                onOpenChange(false);
                if (action.handler === "add_lead") {
                  navigate({ to: "/leads", search: {} });
                  setTimeout(() => setAddOpen(true), 50);
                } else if (action.handler === "schedule") {
                  navigate({ to: "/schedule" });
                } else if (action.label === "Projects Computation") {
                  navigate({ to: "/projects" });
                } else if (action.label === "Projects") {
                  navigate({ to: "/projects-admin" });
                } else if (action.label === "CRF Link") {
                  if (!profile?.crf_link) {
                    toast("No CRF link on your profile", {
                      description: "Add one in your profile.",
                    });
                    navigate({ to: "/profile" });
                    return;
                  }
                  try {
                    await navigator.clipboard.writeText(profile.crf_link);
                    toast("📋 CRF Link copied to clipboard!");
                  } catch {
                    toast.error("Could not copy — check clipboard permissions.");
                  }
                } else if (action.label === "Submit Attendance") {
                  window.open(ATTENDANCE_FORM_URL, "_blank");
                } else if (action.label === "Report" || action.label === "Reports") {
                  navigate({ to: "/reports" });
                } else if (action.label === "Sellers Portal") {
                  window.open("https://seller.dmcihomes.com/Login/Auth", "_blank");
                } else if (action.label === "Leaderboard") {
                  navigate({ to: "/leaderboard" });
                } else if (action.label === "Team") {
                  navigate({ to: "/team" });
                } else if (action.label === "Admin") {
                  navigate({ to: "/admin" });
                } else {
                  toast("Coming in a later phase", { description: action.label });
                }
              }}
              className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-3 text-center text-sm font-medium text-[var(--color-text)] transition-tenacious hover:bg-[var(--color-surface)]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary-hover)]">
                <Icon size={20} />
              </span>
              {action.label}
            </button>
          );
        })}
      </div>
    </ResponsiveDialog>
  );
}
