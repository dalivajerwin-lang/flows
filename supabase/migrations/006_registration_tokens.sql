-- ============================================================
-- 006_registration_tokens.sql
-- Single-use invite tokens for self-service /register flow
-- ============================================================

-- 1. TABLE: registration_tokens
create table if not exists public.registration_tokens (
  id                    uuid primary key default gen_random_uuid(),
  token                 uuid unique not null default gen_random_uuid(),
  created_by            uuid not null references public.profiles(id) on delete cascade,
  intended_role         text not null check (intended_role in ('manager','property_consultant')),
  intended_display_name text not null default '',
  intended_agent_number text not null default '',
  expires_at            timestamptz not null default (now() + interval '7 days'),
  used_at               timestamptz,
  used_by               uuid references public.profiles(id) on delete set null,
  created_at            timestamptz not null default now()
);

-- Enable RLS
alter table public.registration_tokens enable row level security;

-- Managers/superadmins can create tokens
drop policy if exists "tokens_insert_manager" on public.registration_tokens;
create policy "tokens_insert_manager"
  on public.registration_tokens for insert
  with check (public.my_role() in ('manager','superadmin'));

-- Managers/superadmins can view all tokens
drop policy if exists "tokens_select_manager" on public.registration_tokens;
create policy "tokens_select_manager"
  on public.registration_tokens for select
  using (public.my_role() in ('manager','superadmin'));

-- 2. RPC: validate_registration_token
--    Returns the token row if it is valid (not used, not expired).
--    Called by the /register page before showing the signup form.
--    SECURITY DEFINER so it can be called without auth (public /register page).
create or replace function public.validate_registration_token(p_token uuid)
returns setof public.registration_tokens
language sql
security definer
stable
as $$
  select * from public.registration_tokens
  where token = p_token
    and used_at is null
    and expires_at > now()
  limit 1;
$$;

-- 3. RPC: consume_registration_token
--    Marks a token as used. Called from the invite-user Edge Function
--    (which runs with the service-role key, so bypasses RLS).
--    We still expose it as a function for clarity.
create or replace function public.consume_registration_token(p_token uuid, p_used_by uuid)
returns void
language sql
security definer
as $$
  update public.registration_tokens
  set used_at = now(),
      used_by  = p_used_by
  where token = p_token;
$$;
