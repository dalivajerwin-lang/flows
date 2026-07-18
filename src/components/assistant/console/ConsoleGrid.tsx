import type { Role } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { DailyAgendaPanel } from "./panels/DailyAgendaPanel";
import { ExpiryWarningsPanel } from "./panels/ExpiryWarningsPanel";
import { StagnantLeadsPanel } from "./panels/StagnantLeadsPanel";
import { GoalTrackerPanel } from "./panels/GoalTrackerPanel";
import { NotificationCenterPanel } from "./panels/NotificationCenterPanel";
import { LinksLibraryPanel } from "./panels/LinksLibraryPanel";
import { TeamGuardPanel } from "./panels/TeamGuardPanel";
import { BottleneckPanel } from "./panels/BottleneckPanel";
import { GoalPaceCalculatorPanel } from "./panels/GoalPaceCalculatorPanel";
import { LinksLibraryAdminPanel } from "./panels/LinksLibraryAdminPanel";
import { ProjectAdminPanel } from "./panels/ProjectAdminPanel";
import { ReversionInboxPanel } from "./panels/ReversionInboxPanel";
import { TopPerformerPanel } from "./panels/TopPerformerPanel";

export function ConsoleGrid({
  role,
  isManager,
  highlightPanel,
  className,
}: {
  role: Role;
  isManager: boolean;
  highlightPanel: string | null;
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      {isManager ? (
        <>
          <TeamGuardPanel />
          <BottleneckPanel />
          <GoalPaceCalculatorPanel />
          <NotificationCenterPanel highlight={highlightPanel === "notifications"} />
          <LinksLibraryAdminPanel />
          <ProjectAdminPanel />
          <ReversionInboxPanel />
          <TopPerformerPanel />
        </>
      ) : (
        <>
          <DailyAgendaPanel />
          <ExpiryWarningsPanel />
          <StagnantLeadsPanel />
          <GoalTrackerPanel />
          <NotificationCenterPanel highlight={highlightPanel === "notifications"} />
          <LinksLibraryPanel />
        </>
      )}
      {/* Silence unused role */}
      <span className="hidden">{role}</span>
    </div>
  );
}
