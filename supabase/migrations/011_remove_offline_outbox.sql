-- ============================================================
-- 011_remove_offline_outbox.sql
-- The CRM is online-only: the offline queue/replay system was
-- removed from the client, so the outbox table is dead weight.
-- ============================================================

drop table if exists public.offline_outbox;
