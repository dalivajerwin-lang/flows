import type { Role } from "@/lib/constants";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  Calendar,
  Bot,
  Trophy,
  Calculator,
  UsersRound,
  BarChart3,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  showBadge?: boolean;
  managerOnly?: boolean;
}

// Sidebar order per spec §8.
export const consultantSidebar: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "My Leads", icon: Users },
  { to: "/workflow", label: "Workflow", icon: KanbanSquare },
  { to: "/schedule", label: "Schedule", icon: Calendar },
  { to: "/assistant", label: "Assistant", icon: Bot, showBadge: true },
  { to: "/reports", label: "My Report", icon: BarChart3 },
  { to: "/projects", label: "Projects Computation", icon: Calculator },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export const managerSidebar: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "All Leads", icon: Users },
  { to: "/workflow", label: "Workflow", icon: KanbanSquare },
  { to: "/schedule", label: "Schedule", icon: Calendar },
  { to: "/team", label: "Team", icon: UsersRound, managerOnly: true },
  { to: "/reports", label: "Reports", icon: BarChart3, managerOnly: true },
  { to: "/assistant", label: "Assistant", icon: Bot, showBadge: true },
  { to: "/projects", label: "Projects Computation", icon: Calculator },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

// Bottom tab bar (mobile) — 4 items + center FAB slot per role.
export const consultantBottom: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "My Leads", icon: Users },
  { to: "/workflow", label: "Workflow", icon: KanbanSquare },
  { to: "/assistant", label: "Assistant", icon: Bot, showBadge: true },
];

export const managerBottom: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "All Leads", icon: Users },
  { to: "/workflow", label: "Workflow", icon: KanbanSquare },
  { to: "/assistant", label: "Assistant", icon: Bot, showBadge: true },
];

export function sidebarFor(role: Role): NavItem[] {
  return role === "property_consultant" ? consultantSidebar : managerSidebar;
}

export function bottomNavFor(role: Role): NavItem[] {
  return role === "property_consultant" ? consultantBottom : managerBottom;
}

// /reports is accessible to both roles; consultants see only their own data.
export const managerOnlyPaths = new Set<string>(["/team"]);
