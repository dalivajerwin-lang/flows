-- 020: training/sample leads
--
-- Onboarding creates a practice lead ("Sample Client (practice)") that until
-- now was indistinguishable from a real lead and polluted dashboards, reports
-- and leaderboards. Flag such leads persistently so the client can exclude
-- them from all metrics while keeping them visible for training.

alter table public.leads add column is_sample boolean not null default false;

-- Backfill: mark existing onboarding practice leads by their creation signature
-- (see src/components/onboarding/step-first-lead.tsx).
update public.leads
   set is_sample = true
 where full_name = 'Sample Client (practice)'
   and source_other_description = 'Onboarding practice lead';
