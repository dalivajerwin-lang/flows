-- Create public.offline_outbox table for syncing changes enqueued offline
create table if not exists public.offline_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  action_kind text not null check (action_kind in ('update', 'note')),
  payload jsonb not null,
  base_version integer not null,
  queued_at timestamptz not null default now(),
  synced_at timestamptz,
  conflict boolean not null default false
);

-- Enable RLS
alter table public.offline_outbox enable row level security;

-- Drop policy if exists
drop policy if exists "Users manage own outbox" on public.offline_outbox;

-- Create policy for CRUD access
create policy "Users manage own outbox"
  on public.offline_outbox for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
