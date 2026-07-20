# Flow — Team Tenacious Real-Estate CRM

A CRM for a Philippine real-estate sales team (Team Tenacious). One superadmin,
managers, and property consultants work a lead pipeline from new lead to closed
sale. Deployed at https://tenacious.netlify.app.

## Stack

- **Frontend:** React 19 + TypeScript, TanStack Start (SSR) + TanStack Router
  (file-based routes), TanStack Query, Zustand stores, Tailwind v4, shadcn/Radix
  UI ("Tenacious" styled variants in `src/components/ui/`).
- **Backend:** Supabase — Postgres + RLS, Auth, Storage, Deno Edge Functions.
  Project ref: `ivcnhqteahhwiphtdebr`.
- **Hosting:** Netlify (Nitro `netlify` preset — static assets in `dist/`, SSR
  handler in `.netlify/functions-internal/`). See `netlify.toml`.
- **Build config:** `vite.config.ts` uses `@lovable.dev/vite-tanstack-config`,
  which already bundles the standard plugins — do NOT add tanstackStart,
  viteReact, tailwindcss, tsConfigPaths, etc. manually (duplicate-plugin break).

## Commands

- `npm run dev` — dev server (vite)
- `npm run build` — production build
- `npm run lint` / `npm run format` — eslint / prettier
- No test suite exists. `scripts/a11y-audit.mjs` is a standalone a11y audit.
- Supabase CLI is NOT in PATH on this machine. Edge functions and migrations
  are deployed separately from Netlify (see "Deployment gotcha" below).

## Where things live

| Area | Path |
| --- | --- |
| Routes (file-based; see `src/routes/README.md`) | `src/routes/*.tsx`, admin console in `src/routes/admin/` |
| Route auth gates (`requireAuth`, `requireManager`, `requireSuperadmin`) | `src/lib/route-guards.ts` |
| Auth session + profile store | `src/stores/auth-store.ts` (Zustand; purges all client state on sign-out) |
| Supabase client | `src/lib/supabase.ts` — typed `supabase` for selects/auth, untyped `db` alias for mutations (hand-written `Database` type causes `never` inference on inserts) |
| Generated-style DB types (hand-maintained) | `src/types/supabase.ts` |
| Data hooks (one file per domain) | `src/hooks/use-*.ts` |
| Domain stores (pipeline, leads, schedule, onboarding, assistant) | `src/stores/` |
| Business constants (stages, validity windows, `Role` type) | `src/lib/constants.ts` |
| Onboarding wizard (manager + consultant journeys, XP/badges) | `src/components/onboarding/`, config in `src/lib/onboarding-config.ts`, state in `src/stores/onboarding-store.ts` + `profiles.onboarding` jsonb |
| Team roster + invite dialog | `src/routes/team.tsx` |
| Superadmin user console (direct account creation, role changes) | `src/routes/admin/users.tsx` |
| Invite edge-function client wrapper | `src/lib/invite-user.ts` |
| AI assistant | `src/components/assistant/`, `src/lib/assistant/` |
| SQL migrations (001–017, numbered, append-only) | `supabase/migrations/` |
| Edge functions | `supabase/functions/{invite-user, agent-login, admin-user-ops}/` |
| Known issues / user-reported problems | `docs/problems.md` |

## Roles & permissions (core domain rule)

Roles (text enum on `profiles.role`): `superadmin` | `manager` | `property_consultant`.

- **Exactly one superadmin**, enforced by a partial unique index (migration 009).
  Created only via `bootstrap_superadmin()` RPC on first run. Superadmin is
  excluded from team lists and skips onboarding.
- **Managers** may invite ONLY property consultants. Creating a manager is a
  superadmin-only power. Enforced in three layers:
  1. UI: role selects only show "Manager" when `currentProfile.role === "superadmin"`
     (`team.tsx`, `admin/users.tsx`; onboarding invite hardcodes consultant).
  2. RLS: `tokens_insert_manager` policy (migration 017) — manager inserts into
     `registration_tokens` must have `intended_role = 'property_consultant'`.
  3. Edge function `invite-user`: direct invites reject `role = 'manager'`
     unless the caller is superadmin; token redemptions pin the role from the
     token row server-side (client can never choose it).
- Role changes go through `admin_set_role()` RPC (superadmin-only, audited).
  A `protect_profile_role` trigger (migration 009) blocks any other role UPDATE.
- `isManagerish()` in `src/hooks/use-role.ts` = manager or superadmin.

## Invite / registration flows (two paths, one backend)

Both paths converge on the `invite-user` edge function, which creates the auth
user + `profiles` row with the service role (RLS bypassed) and audits it.

1. **Token invite (normal + onboarding):** manager generates a single-use
   registration token (`useCreateRegistrationToken` → insert into
   `registration_tokens` with `intended_role/display_name/agent_number`), shares
   the `/register?token=...` link. The invitee validates it via
   `validate_registration_token` RPC and submits email+password to `invite-user`
   with the token; the function takes the role FROM THE TOKEN, never the body.
   Used by `team.tsx` (invite dialog) and onboarding `step-invite-team.tsx`.
2. **Direct creation (superadmin console):** `admin/users.tsx` →
   `inviteUser()` in `src/lib/invite-user.ts` → `invite-user` with
   email/password/role; caller's JWT must resolve to an active
   manager/superadmin profile.

`registration_locked` in `system_settings` blocks only token self-registration,
not direct admin invites. Tokens expire after 7 days and are consumed via
`consume_registration_token`.

## Login

No public email login. `agent-login` edge function resolves agent number →
email server-side (migration 012 removed client-side resolution), rate-limits
per IP, and returns session tokens. `src/routes/login.tsx` + auth-store.

## Lead pipeline

Stages: `new_lead → crf → reserved → documentation → closed_sale`, plus
`cancelled` and `archived` (`src/lib/constants.ts`). Business rules: CRF valid
30 days (warning at 3), reservation 24h, escalation 4h, stagnant after 7 days,
undo grace 10 min. All stage transitions go through DB RPCs
(`transition_lead`, `undo_transition`, `request_stage_reversion` /
`approve_reversion` / `deny_reversion` — migrations 002 + 007), never direct
updates. Consultants see only their own leads; managers see all (RLS).

## Conventions & gotchas

- Timezone `Asia/Manila`, currency ₱ (`src/lib/constants.ts`).
- Invite links are shared over Viber/Messenger — mobile share-sheet support matters.
- Mutations use the untyped `db` alias; keep `src/types/supabase.ts` in sync by
  hand when schema changes.
- Migrations are append-only and numbered; add `018_...` etc., never edit old ones.
- Every privileged action writes `audit_trail` (best-effort, never blocks the op).
- `routeTree.gen.ts` is auto-generated — never edit.
- Superadmin rows are filtered out of rosters; guard new list UIs the same way.
- `docs/problems.md` is the running list of user-reported issues.

## Deployment gotcha (bites repeatedly)

Netlify only builds/deploys the FRONTEND. Changes under `supabase/migrations/`
and `supabase/functions/` do NOTHING until pushed to the Supabase project:

```
supabase link --project-ref ivcnhqteahhwiphtdebr
supabase db push                       # apply new migrations
supabase functions deploy invite-user  # redeploy a changed edge function
```

If a server-side rule "isn't working" in production but the local SQL/function
code looks correct, check deployment status first.
