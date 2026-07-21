# Development Principles

How to approach any change in this codebase, before writing code.

## Server-side rules are the real rules

Client-side checks are UX, not security. Every business rule that matters
(roles, stage transitions, invite permissions, single superadmin) is enforced
in Postgres — RLS policies, triggers, or `security definer` RPCs. When adding
a rule, enforce it in the database first, then mirror it in the UI. Never rely
on the client alone.

## Defense in layers

Existing privileged flows enforce rules in three layers (UI → RLS → edge
function). Follow that pattern for anything new that touches roles, invites,
or money. See [architecture.md](architecture.md).

## Stage transitions go through RPCs

Never `update leads set stage = ...` directly. All transitions go through
`transition_lead`, `undo_transition`, and the reversion RPCs (migrations
002 + 007) so validity windows, audit, and undo grace are honored.

## Migrations are append-only

Numbered `NNN_description.sql` under `supabase/migrations/`. Add a new one
(next number); never edit an existing migration. Keep
`src/types/supabase.ts` in sync by hand when the schema changes.

## Audit everything privileged

Every privileged action writes to `audit_trail` — best-effort (a failed audit
insert must never block the operation itself).

## Frontend deploys ≠ backend deploys

Netlify only builds/deploys the frontend. Changes under `supabase/migrations/`
and `supabase/functions/` do NOTHING until pushed to the Supabase project:

```
supabase link --project-ref ivcnhqteahhwiphtdebr
supabase db push                       # apply new migrations
supabase functions deploy invite-user  # redeploy a changed edge function
```

If a server-side rule "isn't working" in production but the local SQL/function
code looks correct, check deployment status first. The Supabase CLI is NOT in
PATH on this machine — flag the push as a manual step for the user.

## Environment variables

Copy `.env.example` to `.env.local` and fill it in (`.env.local` is
gitignored). The app itself needs only two, read in `src/lib/supabase.ts`:

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — from the Supabase
  dashboard (Settings → API). `VITE_*` values are embedded in the client
  bundle; the anon key is public by design (RLS is the boundary), but the
  service role key must never appear in one. Netlify needs the same two vars
  set in its build environment.

Optional `A11Y_*` vars drive `scripts/a11y-audit.mjs` (see
[accessibility.md](accessibility.md)). Edge functions get `SUPABASE_URL` /
`SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` injected automatically by
the Supabase runtime — nothing to configure locally.

## Verification

- `npm run dev` — dev server (vite)
- `npm run build` — production build; must pass before considering work done
- `npm run lint` / `npm run format` — eslint / prettier
- No test suite exists. `scripts/a11y-audit.mjs` is a standalone axe-core
  audit against a running dev server (see [accessibility.md](accessibility.md)).
