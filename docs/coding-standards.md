# Coding Standards

## TypeScript & React

- React 19 function components; hooks for data (`src/hooks/use-*.ts`, one file
  per domain), Zustand stores for cross-cutting client state (`src/stores/`).
- Types for DB rows derive from `Database["public"]["Tables"][...]` in
  `src/types/supabase.ts` (hand-maintained). Update it whenever the schema
  changes so types propagate everywhere.
- Path alias `@/` → `src/`.

## Supabase access

- Use the typed `supabase` client (`src/lib/supabase.ts`) for selects and
  auth.
- Use the untyped `db` alias for mutations — the hand-written `Database` type
  causes `never` inference on inserts.
- Never bypass RPCs for guarded operations (stage transitions, role changes).

## Routing

- File-based routes under `src/routes/` (see `src/routes/README.md`).
- `routeTree.gen.ts` is auto-generated — never edit it.
- Gate routes with `requireAuth` / `requireManager` / `requireSuperadmin` from
  `src/lib/route-guards.ts`.

## Styling

- Tailwind v4 utility classes, referencing design tokens as
  `bg-[var(--color-primary)]`-style arbitrary values or the mapped theme
  colors. Never hard-code hex colors in components — all colors live in
  `src/styles/tokens.css` (see [branding-guidelines.md](branding-guidelines.md)).
- Reuse the shared components in `src/components/ui/` (Tenacious button,
  StatusChip/StageBadge, EmptyState, responsive dialog/slide-over, skeletons)
  before writing new primitives.

## SQL / migrations

- New migration = next number, descriptive snake_case name
  (`supabase/migrations/021_....sql`). Append-only; never edit old ones.
- Start each migration with a short comment explaining the why.
- RLS policies and triggers carry the enforcement; add them alongside any new
  table.

## Housekeeping

- Superadmin rows are filtered out of rosters; guard new list UIs the same way.
- Every privileged action writes `audit_trail` (best-effort, never blocks).
- Run `npm run lint` (prettier is enforced via eslint) and `npm run build`
  before calling work done.
