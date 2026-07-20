# Do Not Do

Hard prohibitions. Each of these has bitten the project before or breaks a
security invariant.

## Build & codegen

- Do NOT add tanstackStart, viteReact, tailwindcss, tsConfigPaths, or similar
  plugins to `vite.config.ts` — `@lovable.dev/vite-tanstack-config` already
  bundles them; duplicates break the build.
- Do NOT edit `routeTree.gen.ts` — it is auto-generated.

## Database & backend

- Do NOT edit an existing migration — migrations are append-only; add the
  next number instead.
- Do NOT update `leads.stage` directly — use `transition_lead` /
  `undo_transition` / the reversion RPCs.
- Do NOT change `profiles.role` outside `admin_set_role()` — a trigger blocks
  it, and any workaround breaks the audit trail.
- Do NOT let a client choose a role during token redemption — the
  `invite-user` function pins the role from the token row; keep it that way.
- Do NOT use the typed `supabase` client for inserts/updates — the
  hand-written `Database` type infers `never`; use the `db` alias.
- Do NOT assume a migration or edge-function change is live after a Netlify
  deploy — Supabase deploys are separate (`supabase db push` /
  `supabase functions deploy`).

## Security model

- Do NOT enforce a business rule only in the UI — RLS/RPC/edge-function
  enforcement is mandatory; the UI check is a courtesy.
- Do NOT show manager-role options to non-superadmins, or expose superadmin
  rows in any roster, leaderboard, or list UI.
- Do NOT add a public email login path — login is agent-number-only via the
  `agent-login` edge function.
- Do NOT let an `audit_trail` failure block the underlying operation.

## Design system

- Do NOT hard-code colors in components — every color comes from
  `src/styles/tokens.css` via `var(--color-…)`.
- Do NOT add a light-mode-only token — dark mode is a designed palette and
  every token needs both values.
- Do NOT convey status by color alone, suppress `:focus-visible` outlines, or
  add motion that ignores `prefers-reduced-motion`.
- Do NOT ship touch targets under 44px or layouts that break at 360px width.

## Data & metrics

- Do NOT count trashed or sample/training leads (`is_sample = true`) in any
  dashboard, report, or leaderboard — filter through `isReportableLead()`.
- Do NOT format currency or dates ad hoc — peso helpers in
  `src/lib/format-currency.ts`, Manila-time helpers in
  `src/lib/schedule-time.ts`.
