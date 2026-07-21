# Flow — Team Tenacious Real-Estate CRM

CRM for a Philippine real-estate sales team: a superadmin, managers, and
property consultants working a lead pipeline from new lead to closed sale.
Live at https://tenaciouscrm.netlify.app.

**Stack:** React 19 + TypeScript, TanStack Start/Router/Query, Zustand,
Tailwind v4 + shadcn/Radix, on Netlify (SSR). Backend is Supabase — Postgres
with RLS, Auth, Storage, and Deno edge functions (project ref
`ivcnhqteahhwiphtdebr`).

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the Supabase keys
npm run dev
```

`npm run build` — production build · `npm run lint` / `npm run format` —
eslint / prettier. There is no test suite; `scripts/a11y-audit.mjs` is a
standalone axe-core audit (see [docs/accessibility.md](docs/accessibility.md)).

Netlify deploys only the frontend. Database migrations and edge functions
ship separately via `npx supabase db push` / `npx supabase functions deploy`
— see [docs/development-principles.md](docs/development-principles.md).

## Documentation

Start with [docs/project-overview.md](docs/project-overview.md), then
[docs/architecture.md](docs/architecture.md) for where things live and how
roles/invites/pipeline are enforced. [docs/do-not-do.md](docs/do-not-do.md)
lists hard prohibitions — read it before changing anything. `CLAUDE.md` is
the AI-agent entry point and indexes the full doc set.
