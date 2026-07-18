-- ==========================================
-- 001_initial_schema.sql
-- Initial Schema Setup for Team Tenacious CRM
-- ==========================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- 1. PROFILES (extends auth.users)
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          text not null check (role in ('superadmin','manager','property_consultant')),
  display_name  text not null,
  agent_number  text unique not null,
  email         text unique not null,
  phone         text not null default '',
  profile_photo_url text,
  crf_link      text,
  is_active     boolean not null default true,
  last_login_at timestamptz,
  personal_monthly_target bigint not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2. PROJECTS
create table if not exists public.projects (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  developer  text not null default 'DMCI Homes',
  sort_order int  not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3. LEADS
create table if not exists public.leads (
  id                        uuid primary key default gen_random_uuid(),
  full_name                 text not null,
  contact_number            text not null default '',
  email                     text,
  stage                     text not null default 'new_lead',
  previous_stage            text,
  assigned_to               uuid references public.profiles(id) on delete set null,
  project_id                uuid references public.projects(id) on delete set null,
  source                    text not null,
  source_other_description  text,
  unit_types                text[] not null default '{}',
  date_added                date not null default current_date,
  facebook_url              text,
  facebook_canonical_id     text,
  profile_photo_url         text,
  sale_price                bigint,
  deleted_at                timestamptz,
  reactivated_at            timestamptz,
  stage_changed_at          timestamptz not null default now(),
  last_activity_at          timestamptz not null default now(),
  crf_submission_date       date,
  crf_first_entered_at      timestamptz,
  crf_expires_at            timestamptz,
  unit_description          text,
  unit_payment_date         date,
  unit_payment_status       text check (unit_payment_status in ('paid','unpaid')),
  reservation_expires_at    timestamptz,
  reservation_status        text check (reservation_status in ('active','expired')),
  documentation_start_date  date,
  sale_payment_date         date,
  cancellation_reason       text,
  closed_sale_status        text check (closed_sale_status in ('pending_verification','verified')),
  closed_sale_verified_by   uuid references public.profiles(id) on delete set null,
  closed_sale_verified_at   timestamptz,
  closed_sale_rejection_reason text,
  undo_deadline             timestamptz,
  undo_actor_id             uuid references public.profiles(id) on delete set null,
  archived_at               timestamptz,
  archive_reason            text,
  version                   int not null default 1,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- 4. LEAD NOTES
create table if not exists public.lead_notes (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null,
  is_internal boolean not null default false,
  created_at  timestamptz not null default now()
);

-- 5. LEAD BUYERS
create table if not exists public.lead_buyers (
  id        uuid primary key default gen_random_uuid(),
  lead_id   uuid not null references public.leads(id) on delete cascade,
  name      text not null,
  kind      text not null check (kind in ('primary','co_buyer','co_owner')),
  docs      jsonb not null default '{"valid_id":false,"valid_id_selfie":false,"tin":false,"account":false}',
  created_at timestamptz not null default now()
);

-- 6. AUDIT TRAIL
create table if not exists public.audit_trail (
  id        uuid primary key default gen_random_uuid(),
  lead_id   uuid references public.leads(id) on delete set null,
  actor_id  uuid not null references public.profiles(id) on delete cascade,
  type      text not null,
  summary   text not null,
  meta      jsonb,
  created_at timestamptz not null default now()
);

-- 7. APPOINTMENTS
create table if not exists public.appointments (
  id                          uuid primary key default gen_random_uuid(),
  appointment_type            text not null,
  consultant_id               uuid not null references public.profiles(id) on delete cascade,
  lead_id                     uuid references public.leads(id) on delete set null,
  project_id                  uuid references public.projects(id) on delete set null,
  title                       text not null,
  location                    text not null default '',
  notes                       text not null default '',
  starts_at                   timestamptz not null,
  ends_at                     timestamptz not null,
  is_public                   boolean not null default false,
  cancellation_requested_by   uuid references public.profiles(id) on delete set null,
  cancellation_requested_at   timestamptz,
  reminder_sent_at            timestamptz,
  created_by                  uuid not null references public.profiles(id) on delete cascade,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- 8. STAGE REVERSION REQUESTS
create table if not exists public.stage_reversion_requests (
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid not null references public.leads(id) on delete cascade,
  agent_id        uuid not null references public.profiles(id) on delete cascade,
  from_stage      text not null,
  to_stage        text not null,
  reason          text not null,
  status          text not null default 'pending' check (status in ('pending','approved','denied')),
  resolved_by     uuid references public.profiles(id) on delete set null,
  resolved_at     timestamptz,
  correction_reason text,
  deny_reason     text,
  created_at      timestamptz not null default now()
);

-- 9. CRF EXTENSIONS
create table if not exists public.crf_extensions (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references public.leads(id) on delete cascade,
  actor_id      uuid not null references public.profiles(id) on delete cascade,
  reason        text not null,
  status        text not null default 'pending' check (status in ('auto_approved','pending','approved','denied')),
  resolved_by   uuid references public.profiles(id) on delete set null,
  resolved_at   timestamptz,
  requested_at  timestamptz not null default now()
);

-- 10. NOTIFICATIONS
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  body         text not null,
  is_read      boolean not null default false,
  target_route text,
  type         text,
  layers       jsonb,
  meta         jsonb,
  created_at   timestamptz not null default now()
);

-- 11. BROADCASTS
create table if not exists public.broadcasts (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null references public.profiles(id) on delete cascade,
  message       text not null,
  image_url     text,   -- storage bucket path
  link_url      text,
  file_name     text,
  file_url      text,   -- storage bucket path
  file_size     bigint,
  created_at    timestamptz not null default now()
);

-- 12. BROADCAST ACKNOWLEDGMENTS
create table if not exists public.broadcast_acknowledgments (
  id              uuid primary key default gen_random_uuid(),
  broadcast_id    uuid not null references public.broadcasts(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  acknowledged_at timestamptz not null default now(),
  unique (broadcast_id, user_id)
);

-- 13. TEAM GOALS
create table if not exists public.team_goals (
  id            uuid primary key default gen_random_uuid(),
  month         text not null unique,
  target_amount bigint not null default 0
);

-- 14. SYSTEM SETTINGS
create table if not exists public.system_settings (
  id                    int primary key default 1 check (id = 1),
  company_timezone      text not null default 'Asia/Manila',
  registration_locked   boolean not null default false
);

-- Initialize default single-row system settings if not exists
insert into public.system_settings (id, company_timezone, registration_locked)
values (1, 'Asia/Manila', false)
on conflict (id) do nothing;


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.leads enable row level security;
alter table public.lead_notes enable row level security;
alter table public.lead_buyers enable row level security;
alter table public.audit_trail enable row level security;
alter table public.appointments enable row level security;
alter table public.stage_reversion_requests enable row level security;
alter table public.crf_extensions enable row level security;
alter table public.notifications enable row level security;
alter table public.broadcasts enable row level security;
alter table public.broadcast_acknowledgments enable row level security;
alter table public.team_goals enable row level security;
alter table public.system_settings enable row level security;

-- Role Helper Function
create or replace function public.my_role()
returns text language sql stable security definer as $$
  select role from public.profiles where id = auth.uid();
$$;

-- PROFILES Policies
drop policy if exists "profiles_read_all"       on public.profiles;
drop policy if exists "profiles_update_own"     on public.profiles;
drop policy if exists "profiles_manager_update" on public.profiles;
drop policy if exists "profiles_insert_admin"   on public.profiles;
drop policy if exists "profiles_insert_own"     on public.profiles;
create policy "profiles_read_all"       on public.profiles for select using (true);
create policy "profiles_update_own"     on public.profiles for update using (id = auth.uid());
create policy "profiles_manager_update" on public.profiles for update using (public.my_role() in ('manager','superadmin'));
create policy "profiles_insert_admin"   on public.profiles for insert with check (public.my_role() in ('manager','superadmin'));
create policy "profiles_insert_own"     on public.profiles for insert with check (id = auth.uid());

-- PROJECTS Policies
drop policy if exists "projects_read_all"   on public.projects;
drop policy if exists "projects_write_admin" on public.projects;
create policy "projects_read_all"   on public.projects for select using (true);
create policy "projects_write_admin" on public.projects for all using (public.my_role() in ('manager','superadmin'));

-- LEADS Policies
drop policy if exists "leads_consultant_read"   on public.leads;
drop policy if exists "leads_trash_manager"     on public.leads;
drop policy if exists "leads_insert_auth"       on public.leads;
drop policy if exists "leads_update_consultant" on public.leads;
drop policy if exists "leads_delete_manager"    on public.leads;
create policy "leads_consultant_read"   on public.leads for select using (
  deleted_at is null and (assigned_to = auth.uid() or public.my_role() in ('manager','superadmin'))
);
create policy "leads_trash_manager"     on public.leads for select using (
  deleted_at is not null and public.my_role() in ('manager','superadmin')
);
create policy "leads_insert_auth"       on public.leads for insert with check (auth.uid() is not null);
create policy "leads_update_consultant" on public.leads for update using (
  assigned_to = auth.uid() or public.my_role() in ('manager','superadmin')
);
create policy "leads_delete_manager"    on public.leads for update using (
  public.my_role() in ('manager','superadmin')
);

-- LEAD NOTES Policies
drop policy if exists "notes_read"           on public.lead_notes;
drop policy if exists "notes_insert_manager"  on public.lead_notes;
drop policy if exists "notes_insert_own_lead" on public.lead_notes;
create policy "notes_read" on public.lead_notes for select using (
  exists (select 1 from public.leads l where l.id = lead_id and (l.assigned_to = auth.uid() or public.my_role() in ('manager','superadmin')))
);
create policy "notes_insert_manager"  on public.lead_notes for insert with check (public.my_role() in ('manager','superadmin'));
create policy "notes_insert_own_lead" on public.lead_notes for insert with check (
  exists (select 1 from public.leads where id = lead_id and assigned_to = auth.uid())
);

-- LEAD BUYERS Policies
drop policy if exists "buyers_read"  on public.lead_buyers;
drop policy if exists "buyers_write" on public.lead_buyers;
create policy "buyers_read" on public.lead_buyers for select using (
  exists (select 1 from public.leads l where l.id = lead_id and (l.assigned_to = auth.uid() or public.my_role() in ('manager','superadmin')))
);
create policy "buyers_write" on public.lead_buyers for all using (
  exists (select 1 from public.leads l where l.id = lead_id and (l.assigned_to = auth.uid() or public.my_role() in ('manager','superadmin')))
);

-- AUDIT TRAIL Policies
drop policy if exists "audit_insert" on public.audit_trail;
drop policy if exists "audit_select" on public.audit_trail;
create policy "audit_insert" on public.audit_trail for insert with check (auth.uid() is not null);
create policy "audit_select" on public.audit_trail for select using (public.my_role() in ('manager','superadmin'));

-- APPOINTMENTS Policies
drop policy if exists "appt_public_read"       on public.appointments;
drop policy if exists "appt_own_read"          on public.appointments;
drop policy if exists "appt_manager_read"      on public.appointments;
drop policy if exists "appt_manager_write"     on public.appointments;
drop policy if exists "appt_consultant_insert" on public.appointments;
drop policy if exists "appt_consultant_update" on public.appointments;
create policy "appt_public_read"     on public.appointments for select using (is_public = true);
create policy "appt_own_read"        on public.appointments for select using (consultant_id = auth.uid());
create policy "appt_manager_read"    on public.appointments for select using (public.my_role() in ('manager','superadmin'));
create policy "appt_manager_write"   on public.appointments for all using (public.my_role() in ('manager','superadmin'));
create policy "appt_consultant_insert" on public.appointments for insert with check (consultant_id = auth.uid());
create policy "appt_consultant_update" on public.appointments for update using (consultant_id = auth.uid());

-- STAGE REVERSION REQUESTS Policies
drop policy if exists "reversions_read"  on public.stage_reversion_requests;
drop policy if exists "reversions_write" on public.stage_reversion_requests;
create policy "reversions_read"   on public.stage_reversion_requests for select using (agent_id = auth.uid() or public.my_role() in ('manager','superadmin'));
create policy "reversions_write"  on public.stage_reversion_requests for all using (agent_id = auth.uid() or public.my_role() in ('manager','superadmin'));

-- CRF EXTENSIONS Policies
drop policy if exists "extensions_read"  on public.crf_extensions;
drop policy if exists "extensions_write" on public.crf_extensions;
create policy "extensions_read"   on public.crf_extensions for select using (actor_id = auth.uid() or public.my_role() in ('manager','superadmin'));
create policy "extensions_write"  on public.crf_extensions for all using (actor_id = auth.uid() or public.my_role() in ('manager','superadmin'));

-- NOTIFICATIONS Policies
drop policy if exists "notif_own" on public.notifications;
create policy "notif_own" on public.notifications for all using (user_id = auth.uid());

-- BROADCASTS Policies
drop policy if exists "broadcasts_read"           on public.broadcasts;
drop policy if exists "broadcasts_insert_manager" on public.broadcasts;
create policy "broadcasts_read"          on public.broadcasts for select using (auth.uid() is not null);
create policy "broadcasts_insert_manager" on public.broadcasts for insert with check (public.my_role() in ('manager','superadmin'));

-- BROADCAST ACKNOWLEDGMENTS Policies
drop policy if exists "ack_own_insert"   on public.broadcast_acknowledgments;
drop policy if exists "ack_own_read"     on public.broadcast_acknowledgments;
drop policy if exists "ack_manager_read" on public.broadcast_acknowledgments;
create policy "ack_own_insert" on public.broadcast_acknowledgments for insert with check (user_id = auth.uid());
create policy "ack_own_read"   on public.broadcast_acknowledgments for select using (user_id = auth.uid());
create policy "ack_manager_read" on public.broadcast_acknowledgments for select using (public.my_role() in ('manager','superadmin'));

-- TEAM GOALS Policies
drop policy if exists "goals_read"  on public.team_goals;
drop policy if exists "goals_write" on public.team_goals;
create policy "goals_read"      on public.team_goals for select using (auth.uid() is not null);
create policy "goals_write"     on public.team_goals for all using (public.my_role() in ('manager','superadmin'));

-- SYSTEM SETTINGS Policies
drop policy if exists "settings_read"  on public.system_settings;
drop policy if exists "settings_write" on public.system_settings;
create policy "settings_read"   on public.system_settings for select using (true);
create policy "settings_write"  on public.system_settings for update using (public.my_role() in ('superadmin'));

