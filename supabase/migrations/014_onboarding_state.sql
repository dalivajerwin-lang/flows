-- Onboarding progress, per user. Null = never started.
-- Shape (jsonb): { version, role, steps: {stepId: "done"|"skipped"|null}, xp,
--                  badges: [], startedAt, completedAt, skippedAt,
--                  firstDay: {itemId: bool}, firstDayDismissed }
alter table public.profiles add column if not exists onboarding jsonb;

-- Rollout flag (§12.4): onboarding ships dark until enabled.
alter table public.system_settings
  add column if not exists onboarding_enabled boolean not null default true;

-- No new RLS needed: profiles_update_own already lets users write their own
-- row, and profiles_read_authenticated covers reads. Managers can observe
-- team onboarding completion through the existing profile read policy.
