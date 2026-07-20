-- 021: Daily Agenda Planner
--
-- Consultants plan a per-day checklist. Items live server-side so managers
-- can see the whole team's agenda status on one screen and the agenda syncs
-- across devices (previously "Personal Todos" lived in localStorage only).
--
-- Visibility rule: owner reads/writes their own items; managers/superadmin
-- read everyone's (view only — they never edit a consultant's agenda).
-- "Planned" = >=1 item today; "done" = all items checked. Derived, not stored.

create table public.daily_agenda_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  agenda_date date not null,
  text        text not null check (char_length(text) between 1 and 500),
  done        boolean not null default false,
  done_at     timestamptz,
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index daily_agenda_items_user_date
  on public.daily_agenda_items (user_id, agenda_date);
create index daily_agenda_items_date
  on public.daily_agenda_items (agenda_date);

alter table public.daily_agenda_items enable row level security;

create policy "agenda_select" on public.daily_agenda_items for select
  using (user_id = auth.uid() or public.my_role() in ('manager', 'superadmin'));

create policy "agenda_insert" on public.daily_agenda_items for insert
  with check (user_id = auth.uid());

create policy "agenda_update" on public.daily_agenda_items for update
  using (user_id = auth.uid());

create policy "agenda_delete" on public.daily_agenda_items for delete
  using (user_id = auth.uid());

-- Realtime for the manager one-screen view and cross-device sync.
do $$
begin
  alter publication supabase_realtime add table public.daily_agenda_items;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;
