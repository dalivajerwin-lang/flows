# Flow — Team Tenacious Real-Estate CRM

A CRM for a Philippine real-estate sales team (Team Tenacious): superadmin,
managers, and property consultants working a lead pipeline from new lead to
closed sale. React 19 + TanStack Start frontend on Netlify, Supabase backend.

## Documentation — read before generating code

Detailed guidance lives in `docs/`. **Before writing or modifying any code,
read the documents relevant to the task and follow them.** They override
default behavior.

| Document | Read when |
| --- | --- |
| [docs/project-overview.md](docs/project-overview.md) | Always — domain, stack, roles, pipeline stages |
| [docs/development-principles.md](docs/development-principles.md) | Always — server-first enforcement, migrations, deploys, verification |
| [docs/architecture.md](docs/architecture.md) | Touching any code — directory map, auth/invite flows, role enforcement layers |
| [docs/coding-standards.md](docs/coding-standards.md) | Writing TypeScript, SQL, or styles |
| [docs/ui-ux-principles.md](docs/ui-ux-principles.md) | Building or changing any UI |
| [docs/branding-guidelines.md](docs/branding-guidelines.md) | Anything visual — tokens, colors, typography, components |
| [docs/accessibility.md](docs/accessibility.md) | Building or changing any UI |
| [docs/do-not-do.md](docs/do-not-do.md) | Always — hard prohibitions; check before finalizing changes |

Also: `docs/problems.md` is the running list of user-reported issues, and
feature plans live alongside (e.g. `docs/daily-agenda-planner.md`).

## Quick facts

- Commands: `npm run dev` / `npm run build` / `npm run lint` / `npm run format`.
  No test suite.
- Supabase project ref `ivcnhqteahhwiphtdebr`; the Supabase CLI is NOT in PATH
  on this machine. Netlify deploys only the frontend — migrations and edge
  functions require a separate `supabase db push` / `functions deploy`
  (see development-principles.md).
- Timezone `Asia/Manila`, currency ₱.
