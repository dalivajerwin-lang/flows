import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useLeads } from "@/hooks/use-leads";
import { useAllProfiles } from "@/hooks/use-profiles";
import { useCurrentProfile } from "@/stores/auth-store";
import { isManagerish } from "@/hooks/use-role";
import {
  selectLeaderboard,
  selectCrfLeaderboard,
  type LeaderboardRow,
  type CrfLeaderboardRow,
} from "@/lib/reports/selectors";
import { weekPeriod, type Period } from "@/lib/reports/time-filter";
import { compactPeso } from "@/lib/format-currency";
import { initials } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PeriodPicker } from "@/components/reports/period-picker";
import { ConsultantProfileDialog } from "@/components/team/consultant-profile-dialog";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/supabase";

type Board = "sales" | "crf";
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Leaderboard avatar — photo when available, initials otherwise. For managers
 * it's a button that opens the consultant profile preview (same dialog as the
 * Team roster).
 */
function ConsultantAvatar({
  consultant,
  onPreview,
  className,
}: {
  consultant: Profile;
  onPreview?: (p: Profile) => void;
  className?: string;
}) {
  const face = consultant.profile_photo_url ? (
    <img
      src={consultant.profile_photo_url}
      alt={consultant.display_name}
      className="h-full w-full rounded-full object-cover"
    />
  ) : (
    initials(consultant.display_name)
  );

  if (!onPreview) {
    return (
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)] font-semibold text-[var(--color-primary-foreground)]",
          className,
        )}
      >
        {face}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onPreview(consultant)}
      aria-label={`View ${consultant.display_name}'s profile`}
      className={cn(
        "flex cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)] font-semibold text-[var(--color-primary-foreground)] transition-tenacious hover:ring-2 hover:ring-[var(--color-primary)] hover:ring-offset-2",
        className,
      )}
    >
      {face}
    </button>
  );
}

export function LeaderboardPage() {
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: profiles = [], isLoading: profilesLoading } = useAllProfiles();
  const me = useCurrentProfile();
  const manager = isManagerish(me?.role ?? null);
  const [period, setPeriod] = useState<Period>(weekPeriod());
  const [board, setBoard] = useState<Board>("sales");
  // Managers can tap an avatar to preview the consultant's profile.
  const [previewProfile, setPreviewProfile] = useState<Profile | null>(null);
  const openPreview = manager ? setPreviewProfile : undefined;

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
  const crfRows = selectCrfLeaderboard(dbData, period);

  const anyConsultants = profiles.some((p) => p.role === "property_consultant");
  const hasSales = rows.some((r) => r.closedValue > 0 || r.closedCount > 0);
  const hasCrfs = crfRows.some((r) => r.crfCount > 0);

  if (!anyConsultants) {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] p-8 text-center">
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

  const crfPodium = crfRows.slice(0, 3);
  const crfRest = crfRows.slice(3, 10);
  const myCrfRow = me ? crfRows.find((r) => r.consultant.id === me.id) : null;
  const showCrfPinned = myCrfRow && myCrfRow.rank > 10;
  const crfLeader = crfRows[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="hidden sm:block">
          <h1 className="text-2xl font-semibold">Leaderboard</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {board === "sales"
              ? "Property Consultants only — ranked by verified sales value."
              : "Property Consultants only — ranked by CRFs submitted this period."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Board toggle — sales is the money board, CRF is the hustle board. */}
          <div className="flex rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background)] p-0.5">
            {(
              [
                ["sales", "🏆 Sales"],
                ["crf", "📝 CRFs"],
              ] as [Board, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setBoard(key)}
                className={cn(
                  "rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold transition-tenacious",
                  board === key
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <PeriodPicker value={period} onChange={setPeriod} />
        </div>
      </div>

      {board === "crf" ? (
        !hasCrfs ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] p-8 text-center text-sm text-[var(--color-text-secondary)]">
            No CRFs submitted for this period yet. First CRF in takes the crown! 👑
          </div>
        ) : (
          <>
            {/* CRF Podium — order 2 | 1 | 3 */}
            <div className="grid grid-cols-3 items-end gap-3 sm:gap-4">
              {[crfPodium[1], crfPodium[0], crfPodium[2]].map((r, idx) => {
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
                        : "border-[var(--color-border)] bg-[var(--color-background)] shadow-[var(--shadow-sm)]",
                      isMe && !isFirst && "bg-[var(--color-primary-light)]",
                    )}
                  >
                    <div className="text-2xl">{medal}</div>
                    <ConsultantAvatar
                      consultant={r.consultant}
                      onPreview={openPreview}
                      className="mx-auto mt-1 h-10 w-10 text-sm sm:h-14 sm:w-14 sm:text-base"
                    />
                    <div className="mt-2 truncate text-sm font-semibold">
                      {r.consultant.display_name}
                    </div>
                    {r.isInactive && (
                      <div className="text-[10px] text-[var(--color-text-secondary)]">
                        [Inactive]
                      </div>
                    )}
                    <div
                      className={cn(
                        "mt-1 font-bold",
                        isFirst ? "text-lg text-[var(--color-primary)]" : "text-sm",
                      )}
                    >
                      {r.crfCount} CRF{r.crfCount === 1 ? "" : "s"}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-secondary)]">
                      {r.progressedCount} progressed
                    </div>
                  </div>
                );
              })}
            </div>

            {crfRest.length > 0 && (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)]">
                <ul>
                  {crfRest.map((r) => (
                    <CrfLeaderRow
                      key={r.consultant.id}
                      row={r}
                      me={me?.id ?? null}
                      leader={crfLeader}
                      onPreview={openPreview}
                    />
                  ))}
                </ul>
              </div>
            )}

            {showCrfPinned && myCrfRow && (
              <div className="rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-primary)] bg-[var(--color-primary-light)] p-3">
                <div className="mb-1 text-[10px] font-medium uppercase text-[var(--color-primary)]">
                  Your Position
                </div>
                <CrfLeaderRow
                  row={myCrfRow}
                  me={me?.id ?? null}
                  leader={crfLeader}
                  bare
                  onPreview={openPreview}
                />
              </div>
            )}
          </>
        )
      ) : !hasSales ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] p-8 text-center text-sm text-[var(--color-text-secondary)]">
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
                      : "border-[var(--color-border)] bg-[var(--color-background)] shadow-[var(--shadow-sm)]",
                    isMe && !isFirst && "bg-[var(--color-primary-light)]",
                  )}
                >
                  <div className="text-2xl">{medal}</div>
                  <ConsultantAvatar
                    consultant={r.consultant}
                    onPreview={openPreview}
                    className="mx-auto mt-1 h-10 w-10 text-sm sm:h-14 sm:w-14 sm:text-base"
                  />
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
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)]">
              <ul>
                {rest.map((r) => (
                  <LeaderRow
                    key={r.consultant.id}
                    row={r}
                    me={me?.id ?? null}
                    leader={leader}
                    onPreview={openPreview}
                  />
                ))}
              </ul>
            </div>
          )}

          {showPinned && myRow && (
            <div className="rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-primary)] bg-[var(--color-primary-light)] p-3">
              <div className="mb-1 text-[10px] font-medium uppercase text-[var(--color-primary)]">
                Your Position
              </div>
              <LeaderRow
                row={myRow}
                me={me?.id ?? null}
                leader={leader}
                bare
                onPreview={openPreview}
              />
            </div>
          )}
        </>
      )}

      {/* Consultant profile preview — managers only, opened from any avatar */}
      {manager && (
        <ConsultantProfileDialog
          profile={previewProfile}
          onOpenChange={(v) => !v && setPreviewProfile(null)}
        />
      )}
    </div>
  );
}

function LeaderRow({
  row,
  me,
  leader,
  bare = false,
  onPreview,
}: {
  row: LeaderboardRow;
  me: string | null;
  leader: LeaderboardRow;
  bare?: boolean;
  onPreview?: (p: Profile) => void;
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
      <ConsultantAvatar
        consultant={row.consultant}
        onPreview={onPreview}
        className="h-8 w-8 shrink-0 text-xs"
      />
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

function CrfLeaderRow({
  row,
  me,
  leader,
  bare = false,
  onPreview,
}: {
  row: CrfLeaderboardRow;
  me: string | null;
  leader: CrfLeaderboardRow;
  bare?: boolean;
  onPreview?: (p: Profile) => void;
}) {
  const isMe = me === row.consultant.id;
  const pct = leader.crfCount > 0 ? (row.crfCount / leader.crfCount) * 100 : 0;
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
      <ConsultantAvatar
        consultant={row.consultant}
        onPreview={onPreview}
        className="h-8 w-8 shrink-0 text-xs"
      />
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
        <div className="text-sm font-semibold">
          {row.crfCount} CRF{row.crfCount === 1 ? "" : "s"}
        </div>
        <div className="text-[10px] text-[var(--color-text-secondary)]">
          {row.progressedCount} progressed
        </div>
      </div>
    </li>
  );
}
