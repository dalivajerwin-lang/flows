# Project Overview

Flow is a CRM for a Philippine real-estate sales team ("Team Tenacious"). One
superadmin, managers, and property consultants work a lead pipeline from new
lead to closed sale. Deployed at https://tenaciouscrm.netlify.app.

## Stack

- **Frontend:** React 19 + TypeScript, TanStack Start (SSR) + TanStack Router
  (file-based routes), TanStack Query, Zustand stores, Tailwind v4, shadcn/Radix
  UI ("Tenacious" styled variants in `src/components/ui/`).
- **Backend:** Supabase — Postgres + RLS, Auth, Storage, Deno Edge Functions.
  Project ref: `ivcnhqteahhwiphtdebr`.
- **Hosting:** Netlify (Nitro `netlify` preset — static assets in `dist/`, SSR
  handler in `.netlify/functions-internal/`). See `netlify.toml`.

## Roles (core domain rule)

Roles (text enum on `profiles.role`): `superadmin` | `manager` | `property_consultant`.

- **Exactly one superadmin**, enforced by a partial unique index (migration 009).
  Created only via `bootstrap_superadmin()` RPC on first run. Superadmin is
  excluded from team lists and skips onboarding.
- **Managers** may invite ONLY property consultants. Creating a manager is a
  superadmin-only power (see [architecture.md](architecture.md) for the
  three-layer enforcement).
- **Consultants** see only their own leads; managers see all (RLS).
- `isManagerish()` in `src/hooks/use-role.ts` = manager or superadmin.

## Lead pipeline

Stages: `new_lead → crf → reserved → documentation → closed_sale`, plus
`cancelled` and `archived` (`src/lib/constants.ts`). Business rules: CRF valid
30 days (warning at 3), reservation 24h, escalation 4h, stagnant after 7 days,
undo grace 10 min.

## Environment

- Timezone `Asia/Manila`, currency ₱ (`src/lib/constants.ts`).
- Users are on mobile a lot; invite links are shared over Viber/Messenger.
- `docs/problems.md` is the running list of user-reported issues.
