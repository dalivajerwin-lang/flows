-- ============================================================
-- 009_single_superadmin.sql
-- Enforce "exactly one superadmin, created server-side" rule.
--
-- Fixes: any visitor with the public anon key could sign up and
-- insert their own profile with role = 'superadmin', because
-- profiles_insert_own only checked id = auth.uid() and the
-- "setup only runs before any users exist" gate was client-side.
-- ============================================================

-- 1. Remove client-side self-insert entirely.
--    Profiles are created only by:
--      a) the invite-user Edge Function (service role, bypasses RLS)
--      b) the bootstrap_superadmin() RPC below (first user only)
drop policy if exists "profiles_insert_own" on public.profiles;

-- 2. Hard DB-level guarantee: at most ONE superadmin row can ever
--    exist, regardless of which code path tries to create it.
create unique index if not exists profiles_single_superadmin
  on public.profiles ((role))
  where role = 'superadmin';

-- 3. Block role escalation via UPDATE. profiles_update_own has no
--    WITH CHECK, so without this a user could flip their own role.
--    Service-role connections (edge functions) have auth.uid() = null
--    and are allowed through; anon/authenticated users can only change
--    a role if they are already the superadmin.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is not null
       and public.my_role() is distinct from 'superadmin' then
      raise exception 'Only the superadmin can change user roles';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_role on public.profiles;
create trigger trg_protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- 4. Server-side first-run check. The client-side "does any profile
--    exist" count always returns 0 for anon users under RLS, so the
--    /setup page needs a SECURITY DEFINER probe instead.
create or replace function public.setup_available()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (select 1 from public.profiles);
$$;

revoke execute on function public.setup_available() from public;
grant execute on function public.setup_available() to anon, authenticated;

-- 5. Bootstrap RPC: creates the FIRST profile as superadmin, and only
--    if no profile exists yet. Role is pinned server-side; the caller
--    cannot choose it. Advisory lock serializes concurrent attempts so
--    two racing signups cannot both pass the emptiness check.
create or replace function public.bootstrap_superadmin(
  p_display_name text,
  p_agent_number text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  perform pg_advisory_xact_lock(hashtext('bootstrap_superadmin'));

  if exists (select 1 from public.profiles) then
    raise exception 'Setup has already been completed';
  end if;

  if coalesce(trim(p_display_name), '') = '' then
    raise exception 'Display name is required';
  end if;
  if coalesce(trim(p_agent_number), '') = '' then
    raise exception 'Agent number is required';
  end if;

  select email into v_email from auth.users where id = v_uid;

  insert into public.profiles (id, role, display_name, agent_number, email, is_active)
  values (v_uid, 'superadmin', trim(p_display_name), trim(p_agent_number), coalesce(v_email, ''), true);
end;
$$;

revoke execute on function public.bootstrap_superadmin(text, text) from public;
grant execute on function public.bootstrap_superadmin(text, text) to authenticated;
