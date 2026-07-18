-- ============================================================
-- 010_hot_table_indexes.sql
-- Indexes for hot query paths. Before this, the only indexed
-- tables were notifications (007) and the superadmin guard (009);
-- every leads/notes/buyers query was a sequential scan.
-- ============================================================

-- LEADS
-- Consultant list view: where assigned_to = X and deleted_at is null
-- (also backs the leads_consultant_read RLS policy).
create index if not exists leads_assigned_to_idx
  on public.leads (assigned_to)
  where deleted_at is null;

-- Default list ordering: order by last_activity_at desc.
create index if not exists leads_last_activity_idx
  on public.leads (last_activity_at desc)
  where deleted_at is null;

-- Trash view: where deleted_at is not null order by deleted_at desc.
create index if not exists leads_deleted_at_idx
  on public.leads (deleted_at desc)
  where deleted_at is not null;

-- Board/stage filters and scheduled expiry sweeps.
create index if not exists leads_stage_idx
  on public.leads (stage)
  where deleted_at is null;

-- Duplicate checks on create/edit/restore.
create index if not exists leads_contact_number_idx
  on public.leads (contact_number)
  where deleted_at is null and contact_number <> '';

create index if not exists leads_facebook_canonical_idx
  on public.leads (facebook_canonical_id)
  where deleted_at is null and facebook_canonical_id is not null;

-- CHILD TABLES (fetched per lead, and probed by RLS subqueries)
create index if not exists lead_notes_lead_id_idx
  on public.lead_notes (lead_id);

create index if not exists lead_buyers_lead_id_idx
  on public.lead_buyers (lead_id);

-- AUDIT TRAIL: per-lead history, newest first.
create index if not exists audit_trail_lead_id_idx
  on public.audit_trail (lead_id, created_at desc);

-- APPOINTMENTS: calendar views query by consultant and time range.
create index if not exists appointments_consultant_starts_idx
  on public.appointments (consultant_id, starts_at);

create index if not exists appointments_lead_id_idx
  on public.appointments (lead_id)
  where lead_id is not null;

-- REVERSION REQUESTS / CRF EXTENSIONS: inbox panels filter by status,
-- detail views by lead.
create index if not exists reversion_requests_lead_id_idx
  on public.stage_reversion_requests (lead_id);

create index if not exists reversion_requests_status_idx
  on public.stage_reversion_requests (status)
  where status = 'pending';

create index if not exists crf_extensions_lead_id_idx
  on public.crf_extensions (lead_id);

-- BROADCAST ACKNOWLEDGMENTS: per-broadcast ack counts.
-- (unique (broadcast_id, user_id) already covers broadcast_id lookups;
-- this covers the reverse "my acks" direction.)
create index if not exists broadcast_acks_user_id_idx
  on public.broadcast_acknowledgments (user_id);

-- REGISTRATION TOKENS: token lookup is already unique-indexed; index
-- the admin list view's creator column.
create index if not exists registration_tokens_created_by_idx
  on public.registration_tokens (created_by);
