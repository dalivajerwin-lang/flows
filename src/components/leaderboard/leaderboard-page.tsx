import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useLeads } from "@/hooks/use-leads";
import { useAllProfiles } from "@/hooks/use-profiles";
import { useCurrentProfile } from "@/stores/auth-store";
import { isManagerish } from "@/hooks/use-role";
import { selectLeaderboard, type LeaderboardRow } from "@/lib/reports/selectors";
import { weekPeriod, type Period } from "@/lib/reports/time-filter";
import { compactPeso } from "@/lib/format-currency";
import { initials } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PeriodPicker } from "@/components/reports/period-picker";
import { cn } from "@/lib/utils";

export function LeaderboardPage() {
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: profiles = [], isLoading: profilesLoading } = useAllProfiles();
  const me = useCurrentProfile();
  const manager = isManagerish(me?.role ?? null);
  const [period, setPeriod] = useState<Period>(weekPeriod());

  if (leadsLoading || profilesLoading) {
    return (
      <div className="text-center py-12 text-sm text-[var(--color-text-secondary)]">
        Loading leaderboard...
      </div>
    );
  }

  const dbData = {
    leads,
    profiles,
    team_goals: [],
    appointments: [],
    audit_trail: [],
  };

  const rows = selectLeaderboard(dbData, period);

  const anyConsultants = profiles.some((p) => p.role === "property_consultant");
  const hasSales = rows.some((r) => r.closedValue > 0 || r.closedCount > 0);

  if (!anyConsultants) {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-8 text-center">
        <p className="text-sm text-[var(--color-text-secondary)]">
          No consultants have been added to the team yet.
        </p>
        {manager && (
          <div className="mt-4">
            <Link to="/team">
              <Button>👥 Go to Team Page</Button>
            </Link>
          </div>
        )}
      </div>
    );
  }

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3, 10);
  const myRow = me ? rows.find((r) => r.consultant.id === me.id) : null;
  const showPinned = myRow && myRow.rank > 10;
  const leader = rows[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="hidden sm:block">
          <h1 className="text-2xl font-semibold">Leaderboard</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Property Consultants only — ranked by verified sales value.
          </p>
        </div>
        <PeriodPicker value={period} onChange={setPeriod} />
      </div>

      {!hasSales ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-8 text-center text-sm text-[var(--color-text-secondary)]">
          No verified sales recorded for this period yet. Keep pushing — the board updates as soon
          as a sale is approved!
        </div>
      ) : (
        <>
          {/* Podium — order 2 | 1 | 3 */}
          <div className="grid grid-cols-3 items-end gap-3 sm:gap-4">
            {[podium[1], podium[0], podium[2]].map((r, idx) => {
              if (!r) return <div key={idx} />;
              const isFirst = r.rank === 1;
              const medal = r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : "🥉";
              const isMe = me?.id === r.consultant.id;
              return (
                <div
                  key={r.consultant.id}
                  className={cn(
                    "rounded-[var(--radius-md)] border p-3 text-center transition-tenacious sm:p-4",
                    isFirst
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] shadow-[var(--shadow-md)] -translate-y-2"
                      : "border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]",
                    isMe && !isFirst && "bg-[var(--color-primary-light)]",
                  )}
                >
                  <div className="text-2xl">{medal}</div>
                  <div className="mx-auto mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-semibold text-white sm:h-14 sm:w-14 sm:text-base">
                    {initials(r.consultant.display_name)}
                  </div>
                  <div className="mt-2 truncate text-sm font-semibold">
                    {r.consultant.display_name}
                  </div>
                  {r.isInactive && (
                    <div className="text-[10px] text-[var(--color-text-secondary)]">[Inactive]</div>
                  )}
                  <div
                    className={cn(
                      "mt-1 font-bold",
                      isFirst ? "text-lg text-[var(--color-primary)]" : "text-sm",
                    )}
                  >
                    {compactPeso(r.closedValue)}
                  </div>
                  <div className="text-[11px] text-[var(--color-text-secondary)]">
                    {r.closedCount} sale{r.closedCount === 1 ? "" : "s"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rest of the list */}
          {rest.length > 0 && (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white">
              <ul>
                {rest.map((r) => (
                  <LeaderRow key={r.consultant.id} row={r} me={me?.id ?? null} leader={leader} />
                ))}
              </ul>
            </div>
          )}

          {showPinned && myRow && (
            <div className="rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-primary)] bg-[var(--color-primary-light)] p-3">
              <div className="mb-1 text-[10px] font-medium uppercase text-[var(--color-primary)]">
                Your Position
              </div>
              <LeaderRow row={myRow} me={me?.id ?? null} leader={leader} bare />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LeaderRow({
  row,
  me,
  leader,
  bare = false,
}: {
  row: LeaderboardRow;
  me: string | null;
  leader: LeaderboardRow;
  bare?: boolean;
}) {
  const isMe = me === row.consultant.id;
  const pct = leader.closedValue > 0 ? (row.closedValue / leader.closedValue) * 100 : 0;
  return (
    <li
      className={cn(
        "flex items-center gap-3 px-4 py-2.5",
        !bare && "border-t border-[var(--color-border)] first:border-t-0",
        isMe && !bare && "bg-[var(--color-primary-light)]",
      )}
    >
      <span className="w-6 text-sm font-semibold text-[var(--color-text-secondary)]">
        #{row.rank}
      </span>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-semibold text-white">
        {initials(row.consultant.display_name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {row.consultant.display_name}
          {row.isInactive && (
            <span className="ml-1 text-[10px] text-[var(--color-text-secondary)]">[Inactive]</span>
          )}
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface)]">
          <div className="h-full bg-[var(--color-primary)]" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold">{compactPeso(row.closedValue)}</div>
        <div className="text-[10px] text-[var(--color-text-secondary)]">
          {row.closedCount} sale{row.closedCount === 1 ? "" : "s"}
        </div>
      </div>
    </li>
  );
}
