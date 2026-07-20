# Architecture

Where things live and how the pieces connect.

## Directory map

| Area | Path |
| --- | --- |
| Routes (file-based; see `src/routes/README.md`) | `src/routes/*.tsx`, admin console in `src/routes/admin/` |
| Route auth gates (`requireAuth`, `requireManager`, `requireSuperadmin`) | `src/lib/route-guards.ts` |
| Auth session + profile store | `src/stores/auth-store.ts` (Zustand; purges all client state on sign-out) |
| Supabase client | `src/lib/supabase.ts` — typed `supabase` for selects/auth, untyped `db` alias for mutations |
| Generated-style DB types (hand-maintained) | `src/types/supabase.ts` |
| Data hooks (one file per domain) | `src/hooks/use-*.ts` |
| Domain stores (pipeline, leads, schedule, onboarding, assistant) | `src/stores/` |
| Business constants (stages, validity windows, `Role` type) | `src/lib/constants.ts` |
| Design tokens (single source of truth for color/radius/shadow) | `src/styles/tokens.css` |
| Tailwind theme + base/motion/print styles | `src/styles.css` |
| Shared UI components (shadcn + Tenacious variants) | `src/components/ui/` |
| Onboarding wizard (manager + consultant journeys, XP/badges) | `src/components/onboarding/`, config in `src/lib/onboarding-config.ts`, state in `src/stores/onboarding-store.ts` + `profiles.onboarding` jsonb |
| Team roster + invite dialog | `src/routes/team.tsx` |
| Daily Agenda Planner (consultant card, manager overview + `/team-agenda` route) | `src/components/agenda/`, `src/hooks/use-daily-agenda.ts`, `src/routes/team-agenda.tsx` |
| Superadmin user console (direct account creation, role changes) | `src/routes/admin/users.tsx` |
| Invite edge-function client wrapper | `src/lib/invite-user.ts` |
| AI assistant | `src/components/assistant/`, `src/lib/assistant/` |
| SQL migrations (numbered, append-only) | `supabase/migrations/` |
| Edge functions | `supabase/functions/{invite-user, agent-login, admin-user-ops}/` |
| Known issues / user-reported problems | `docs/problems.md` |

## Role enforcement (three layers)

Managers may invite ONLY property consultants; creating a manager is
superadmin-only. Enforced in three layers — keep all three intact when
touching any of them:

1. **UI:** role selects only show "Manager" when
   `currentProfile.role === "superadmin"` (`team.tsx`, `admin/users.tsx`;
   onboarding invite hardcodes consultant).
2. **RLS:** `tokens_insert_manager` policy (migration 017) — manager inserts
   into `registration_tokens` must have `intended_role = 'property_consultant'`.
3. **Edge function `invite-user`:** direct invites reject `role = 'manager'`
   unless the caller is superadmin; token redemptions pin the role from the
   token row server-side (the client can never choose it).

Role changes go through `admin_set_role()` RPC (superadmin-only, audited).
A `protect_profile_role` trigger (migration 009) blocks any other role UPDATE.

## Invite / registration flows (two paths, one backend)

Both paths converge on the `invite-user` edge function, which creates the auth
user + `profiles` row with the service role (RLS bypassed) and audits it.

1. **Token invite (normal + onboarding):** manager generates a single-use
   registration token (`useCreateRegistrationToken` → insert into
   `registration_tokens` with `intended_role/display_name/agent_number`),
   shares the `/register?token=...` link. The invitee validates it via
   `validate_registration_token` RPC and submits email+password to
   `invite-user` with the token; the function takes the role FROM THE TOKEN,
   never the body. Used by `team.tsx` (invite dialog) and onboarding
   `step-invite-team.tsx`.
2. **Direct creation (superadmin console):** `admin/users.tsx` →
   `inviteUser()` in `src/lib/invite-user.ts` → `invite-user` with
   email/password/role; the caller's JWT must resolve to an active
   manager/superadmin profile.

`registration_locked` in `system_settings` blocks only token
self-registration, not direct admin invites. Tokens expire after 7 days and
are consumed via `consume_registration_token`.

## Login

No public email login. The `agent-login` edge function resolves agent number →
email server-side (migration 012 removed client-side resolution), rate-limits
per IP, and returns session tokens. `src/routes/login.tsx` + auth-store.

## Lead pipeline data flow

All stage transitions go through DB RPCs (`transition_lead`,
`undo_transition`, `request_stage_reversion` / `approve_reversion` /
`deny_reversion` — migrations 002 + 007), never direct updates. Consultants
see only their own leads; managers see all (RLS). Training/sample leads carry
`is_sample = true` (migration 020) and are excluded from all metrics via
`isReportableLead()` in the dashboard/report selectors.

## Build config

`vite.config.ts` uses `@lovable.dev/vite-tanstack-config`, which already
bundles the standard plugins — do NOT add tanstackStart, viteReact,
tailwindcss, tsConfigPaths, etc. manually (duplicate-plugin break).
