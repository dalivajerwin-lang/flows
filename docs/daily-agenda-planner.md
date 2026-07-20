# Daily Agenda Planner — Implementation Plan

Status: **implemented** (2026-07-20). Migration 021 still requires a manual
`supabase db push` — see Verification.

## Goal

Every consultant plans and works a **daily agenda** (a per-day checklist).
Managers see the whole team's agenda status **on one screen** and can
**broadcast a reminder** to consultants who haven't done theirs. The agenda is
surfaced on the dashboard and in Quick Links so nobody misses it, and the
assistant can read and write it.

## Current state (what exists today)

- `DailyAgendaPanel` (`src/components/assistant/console/panels/DailyAgendaPanel.tsx`)
  already shows today's appointments + "Personal Todos" — but todos live in
  `assistant-store` (zustand `persist` → localStorage). **Client-side only:**
  managers can't see them, they don't sync across devices, and nothing marks
  a day as "planned" or "done".
- The assistant already has an `agenda` widget keyword (`intent.ts:16`), a
  `todo <text>` command (`command_todo`), and a "📅 Daily Agenda" suggestion
  chip (`ChatWidget.tsx:211`).
- Broadcasts already exist end-to-end: `broadcasts` +
  `broadcast_acknowledgments` tables, `broadcast-composer.tsx`, overlay with
  forced acknowledgment, realtime (`use-broadcasts.ts`). Managers only.
- Quick Links are a customizable shortcut strip on the dashboard
  (`shortcutCatalog` in `dashboard.tsx`) plus the FAB menu (`fab-menu.tsx`).
- Latest migration is `020_sample_leads.sql` → this feature is **021**.

**Core move:** promote agenda items from localStorage to a Postgres table with
RLS, then point the existing panel/intents at it.

## Requirement: visible on desktop AND mobile

The agenda must be reachable and glanceable in both layouts — the app's chrome
differs below `sm` (640px): desktop shows the sidebar; mobile shows the bottom
nav (`sm:hidden`) whose center FAB opens the quick-actions grid
(`fab-menu.tsx`). Concretely:

- **Dashboard cards** (consultant agenda card, manager team-agenda section)
  live in the dashboard's normal flow, so both layouts get them — but they
  must be designed mobile-first per
  [ui-ux-principles.md](ui-ux-principles.md): single column at 360px, ≥ 44px
  touch targets on checklist rows and Remind buttons.
- **Entry points must exist in BOTH quick-action surfaces:** the dashboard
  Quick Links strip (desktop + mobile, `dashboard.tsx`) AND the mobile FAB
  menu (`fab-menu.tsx`) — the FAB grid is the primary mobile entry point and
  does not read from `shortcutCatalog`, so adding one without the other
  leaves a platform blind.
- **Agenda editor** (assistant console panel): the assistant page already
  adapts; verify the panel renders in the mobile chat/console layout, not
  only the desktop expanded console.
- **Manager one-screen view** (`/team-agenda`): a stacked card list on
  mobile, table-like rows on `lg+`. Use the responsive slide-over /
  full-screen-overlay pattern (`responsive-dialog.tsx`) for the expanded
  per-consultant detail.
- The broadcast overlay is already responsive — no change needed.

## Definitions

- **Agenda day** = Manila calendar date (`todayKeyManila()` from
  `src/lib/schedule-time.ts`). Stored as a `date` column, computed client-side
  in Manila time — same convention as the schedule.
- **Planned** = the consultant has ≥ 1 agenda item for today.
- **Done** = planned AND every item for today is checked off.
- Manager overview shows three states per consultant:
  `Not planned` (critical chip) / `In progress x/y` (warning) / `Done` (success).

## Step 1 — Migration `supabase/migrations/021_daily_agenda.sql`

Single table (no parent row needed — "planned/done" derive from the items):

```sql
create table public.daily_agenda_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  agenda_date date not null,
  text        text not null check (char_length(text) between 1 and 500),
  done        boolean not null default false,
  done_at     timestamptz,
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index daily_agenda_items_user_date
  on public.daily_agenda_items (user_id, agenda_date);
create index daily_agenda_items_date
  on public.daily_agenda_items (agenda_date);

alter table public.daily_agenda_items enable row level security;

-- Owner reads their own; managers/superadmin read everyone (one-screen view).
create policy agenda_select on public.daily_agenda_items for select
  using (user_id = auth.uid() or public.my_role() in ('manager','superadmin'));

-- Only the owner writes their own agenda (managers view, not edit).
create policy agenda_insert on public.daily_agenda_items for insert
  with check (user_id = auth.uid());
create policy agenda_update on public.daily_agenda_items for update
  using (user_id = auth.uid());
create policy agenda_delete on public.daily_agenda_items for delete
  using (user_id = auth.uid());
```

This satisfies "only the consultant can see their daily agenda, not other
consultants" **server-side** (RLS), per
[development-principles.md](development-principles.md) — the UI hiding in
later steps is a courtesy on top. Enable realtime for the table so the manager
screen updates live (same `useRealtimeTable` pattern as broadcasts).

## Step 2 — Types

Add `daily_agenda_items` Row/Insert/Update to `src/types/supabase.ts`
(hand-maintained, per [coding-standards.md](coding-standards.md)).

## Step 3 — Data hook `src/hooks/use-daily-agenda.ts`

One file per domain, mutations via the untyped `db` alias:

- `useMyAgenda(date)` — items for `auth.uid()` + date, ordered by `position`.
- `useTeamAgendas(date)` — manager-only: all items for the date, grouped by
  `user_id` client-side; joined with the roster (superadmin rows filtered
  out, as everywhere).
- `addAgendaItem` / `toggleAgendaItem` / `removeAgendaItem` /
  `reorderAgendaItems` mutations (set `done_at` when toggling on).
- `useRealtimeAgenda(date)` — invalidate on INSERT/UPDATE for the manager
  screen and cross-device sync.
- Derived helpers: `agendaStatusFor(items)` → `not_planned | in_progress | done`.

**One-time local migration:** on first mount after release, if the signed-in
user has legacy todos in `assistant-store` (`todos[userId]`), insert the
not-done ones as today's agenda items, then clear the local list. Silent,
best-effort.

## Step 4 — Consultant UI

1. **Rewire `DailyAgendaPanel`** to the DB hook: the "Personal Todos" section
   becomes "Today's Agenda" (add/check/remove items backed by
   `daily_agenda_items`). Appointments section stays as-is. Show a
   `Done x/y` progress line.
2. **Dashboard card "Today's Agenda"** (consultant only), placed near the top
   of `dashboard.tsx`: progress count, first 3 unchecked items, and either a
   "Plan your day" CTA when not planned (warning-soft surface so it reads as
   a to-do) or a success state when done. Tapping it opens the full agenda.
3. **Full agenda surface:** the existing assistant console panel is the full
   editor — the card and quick action navigate to `/assistant` with the
   agenda panel focused (widget key `agenda` already routes there).

## Step 5 — Quick actions

- Add shortcut `{ id: "agenda", label: "My Agenda", icon: ListTodo }` to
  `shortcutCatalog` in `dashboard.tsx` (`consultantOnly: true`), action =
  navigate to the agenda surface. Add it to `CONSULTANT_DEFAULT_SHORTCUTS`
  so existing users see it without re-editing their strip.
- Add the same entry to the mobile FAB quick-actions menu (`fab-menu.tsx`):
  "My Agenda" in `consultantActions`, "Team Agenda" in `managerActions` /
  `superadminActions`. Note the FAB menu keeps its own hardcoded action
  arrays — it does NOT read `shortcutCatalog`, so this is a separate,
  mandatory edit for mobile visibility.
- Manager variant: shortcut `{ id: "team-agenda", label: "Team Agenda",
  managerOnly: true }` → the manager one-screen view (Step 6).

## Step 6 — Manager one-screen view

New manager-only section, reachable from the manager dashboard and the
`team-agenda` quick link. Either a card that expands or a dedicated route
`/team-agenda` gated with `requireManager` — **decision: dashboard section
with a "View all" → route**, so it's both glanceable and complete.

Per consultant (roster minus superadmin):

- Avatar, name, status chip (`StatusChip`: critical `Not planned` /
  warning `In progress x/y` / success `Done`).
- Expand row → read-only list of that consultant's items (RLS already
  permits manager SELECT).
- Sorted worst-first (not planned → in progress → done) so problems surface.
- Header shows the team roll-up ("4 of 7 planned").
- Layout: stacked cards on mobile (one consultant per row, chip + Remind
  button all ≥ 44px), denser table-like rows from `lg` up. Managers check
  this from their phones too — the one-screen view is not desktop-only.

## Step 7 — Manager broadcast reminder

Reuses the existing broadcast pipeline (no new backend):

- On the team-agenda screen, a **"Remind"** button per not-planned/unfinished
  consultant and a **"Remind all pending"** header button.
- Both open the existing `broadcast-composer.tsx` **prefilled**, e.g.
  "⏰ Reminder: please complete your Daily Agenda for today." — the manager
  can edit before sending. Sending uses `useAddBroadcast` as today; the
  overlay + forced acknowledgment + read receipts all come free.
- Broadcasts go to everyone (current system has no per-user targeting).
  Acceptable for v1 — the message names no one. **Out of scope:** targeted
  broadcasts would need a `broadcasts.target_user_ids` column and overlay
  filter; note it in the plan as a follow-up if the team finds all-hands
  reminders too noisy.
- Manual only. No automated cron/edge-function nag in v1 — the user asked for
  "manager can broadcast", which is a human decision.

## Step 8 — Assistant integration

- `agenda` keyword + "📅 Daily Agenda" chip already route to the panel —
  after Step 4 they show DB data with zero intent changes.
- **`todo <text>` command** (`ChatCanvas.tsx` `command_todo` case): write to
  `daily_agenda_items` (today, Manila) instead of the local store. Reply:
  "Added to today's agenda ✓".
- **New consultant phrases:** `plan my day`, `add to agenda <text>` → same
  command; `did I finish my agenda` → agenda widget with the progress line.
- **New manager intent:** `/\b(team agenda|agenda status|who.*planned)\b/i`
  → new `team_agenda` widget key rendering a compact version of the Step 6
  overview inside chat, with a page link to the full screen.
- **Daily briefing:** when composing the briefing, if today is not planned,
  prepend "You haven't planned today's agenda yet — say `plan my day` to
  start." Managers get "N consultants haven't planned today."

## Step 9 — Docs & housekeeping

- Update [architecture.md](architecture.md) directory map
  (`use-daily-agenda.ts`, team-agenda route) and
  [do-not-do.md](do-not-do.md) if any new invariant emerges.
- `docs/problems.md`: note that localStorage todos were migrated.

## Files touched

| File | Change |
| --- | --- |
| `supabase/migrations/021_daily_agenda.sql` | new table + RLS + realtime |
| `src/types/supabase.ts` | add table types |
| `src/hooks/use-daily-agenda.ts` | new domain hook |
| `src/components/assistant/console/panels/DailyAgendaPanel.tsx` | DB-backed items |
| `src/components/dashboard/dashboard.tsx` | consultant agenda card, shortcuts |
| `src/components/layout/fab-menu.tsx` | agenda quick action |
| `src/routes/team-agenda.tsx` | manager one-screen view (requireManager) |
| `src/components/broadcast/broadcast-composer.tsx` | accept prefill text prop |
| `src/lib/assistant/intent.ts` | new phrases + `team_agenda` widget |
| `src/components/assistant/chat/ChatCanvas.tsx` | `command_todo` → DB |
| `src/stores/assistant-store.ts` | legacy-todo migration + cleanup |

## Verification

1. `npm run build` and `npm run lint` pass.
2. **Deploy note:** the migration does nothing until `supabase db push`
   (Netlify ships only the frontend; CLI not in PATH — manual step).
3. Manual, as consultant A: plan 3 items → dashboard card shows 0/3;
   check all → Done state; sign in as consultant B → cannot see A's agenda
   (and a direct PostgREST query returns nothing — RLS, not just UI).
4. As manager: team screen shows A `Done`, B `Not planned`; expanding A shows
   items read-only; "Remind" opens prefilled composer; sent broadcast pops
   the overlay for consultants and read receipts work.
5. Assistant: `todo call Ms. Cruz` adds a DB item visible on the dashboard
   card; `agenda` shows it; manager `team agenda` shows the overview.
6. **Responsive check at 360px and 1280px:** dashboard agenda card, Quick
   Links tile, FAB menu entry, agenda editor panel, and the team-agenda
   screen all render and are operable in both widths (FAB entry only exists
   below `sm` — that's expected; the Quick Links tile covers desktop).
7. `scripts/a11y-audit.mjs` over the new route; 44px touch targets on the
   checklist rows ([accessibility.md](accessibility.md)).
