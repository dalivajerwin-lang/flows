import type { Role } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { DailyAgendaPanel } from "./panels/DailyAgendaPanel";
import { ExpiryWarningsPanel } from "./panels/ExpiryWarningsPanel";
import { StagnantLeadsPanel } from "./panels/StagnantLeadsPanel";
import { GoalTrackerPanel } from "./panels/GoalTrackerPanel";
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
          <LinksLibraryPanel />
        </>
      )}
      {/* Silence unused props (highlightPanel kept for future panel deep-links) */}
      <span className="hidden">
        {role}
        {highlightPanel}
      </span>
    </div>
  );
}
