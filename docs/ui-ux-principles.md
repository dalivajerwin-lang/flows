# UI/UX Principles

The audience is a Philippine real-estate sales team, often on mobile, often
mid-conversation with a client. Optimize for speed, clarity, and one-handed
use.

## Mobile-first

- Every screen must work at 360px width. Breakpoints: `sm` 640px, `lg` 1024px,
  `xl` 1280px (defined in `src/styles.css` `@theme`).
- Detail views: slide-over on desktop (`lg+`), full-screen overlay on mobile —
  see `LeadDetailSlideOver` / `src/components/ui/responsive-dialog.tsx` for
  the established pattern.
- Touch targets ≥ 44px (the Tenacious button default is `min-h-[44px]`).
- Share actions (invite links) must support the mobile share sheet — links are
  passed around over Viber/Messenger.

## Hierarchy & status at a glance

- Pipeline stage, urgency, and validity windows are the core information —
  surface them as `StatusChip` / `StageBadge` chips
  (`src/components/ui/status-chip.tsx`), never as bare text.
- Use the soft palettes (success/warning/danger/info) for status surfaces and
  the solid colors only for primary actions and true alerts.
- Time pressure (CRF expiry, reservation countdown, escalations) uses the
  warning → critical progression; don't invent new urgency colors.

## Feedback & safety

- Every mutation gets immediate feedback: `toast.success` / `toast.error`
  (sonner).
- Destructive or hard-to-reverse actions (trash, stage reversions, role
  changes) require a confirmation modal (`TrashConfirmModal`,
  `ReversionRequestModal` are the patterns).
- Stage transitions have a 10-minute undo grace — show the undo affordance
  (`UndoTransitionCard`) rather than burying it.
- Empty states use `EmptyState` (`src/components/ui/empty-state.tsx`) with a
  next-step action, never a blank panel.
- Loading uses skeletons (`tenacious-skeleton.tsx`), not spinners, for list
  and card content.

## Motion

- Transitions use `.transition-tenacious` (180ms, opacity/transform/color
  only); entrances use `.anim-rise` (320ms). Don't add bespoke animation
  timings.
- All motion is disabled globally under `prefers-reduced-motion` — never
  rely on animation to convey information.

## Role-aware UI

- Render only what the current role can do: consultants never see
  manager-only controls (the check is `isManagerish()` from
  `src/hooks/use-role.ts`). Hiding is required but not sufficient — the
  server enforces the rule (see [architecture.md](architecture.md)).
- Superadmin is excluded from all team rosters and leaderboards.

## Language & formatting

- English UI copy; short, action-oriented labels.
- Currency is Philippine peso — use `compactPeso` / `exactPeso` from
  `src/lib/format-currency.ts`.
- All dates/times display in `Asia/Manila` (helpers in
  `src/lib/schedule-time.ts`).
