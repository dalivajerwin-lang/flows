-- ============================================================
-- 015_superadmin_permissions.sql
-- Phase 0 of the Superadmin UI plan (docs/superadmin-ui-plan.md).
--
-- Adds the server-side superadmin check that all /admin RPCs and
-- policies build on. Client route guards are UX only; every
-- superadmin power must pass through is_superadmin() in Postgres.
-- ============================================================

-- 1. Superadmin check. Unlike my_role(), this also requires the
--    account to be active, so a deactivated superadmin row (should
--    never exist, but belt-and-braces) grants nothing.
create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'superadmin'
      and is_active
  );
$$;

revoke execute on function public.is_superadmin() from public;
grant execute on function public.is_superadmin() to authenticated;

-- 2. Central audit writer. SECURITY DEFINER so RPCs can log without
--    depending on the caller's audit_trail INSERT policy, and so the
--    row is written in the same transaction as the change it records.
--    Not granted to clients directly — only called from other
--    SECURITY DEFINER functions.
create or replace function public.log_audit(
  p_type     text,
  p_summary  text,
  p_lead_id  uuid default null,
  p_meta     jsonb default null,
  p_severity text default 'info'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_trail (lead_id, actor_id, type, summary, meta, severity)
  values (p_lead_id, auth.uid(), p_type, p_summary, p_meta, p_severity);
end;
$$;

revoke execute on function public.log_audit(text, text, uuid, jsonb, text) from public;

-- 3. audit_trail.severity so the dashboard can ask "anything critical
--    today?" cheaply. Backfill-free: existing rows default to 'info'.
alter table public.audit_trail
  add column if not exists severity text not null default 'info'
  check (severity in ('info','warning','critical'));

-- 3b. Security events (failed logins, anonymous registration attempts)
--     have no profile to attribute — allow actor-less rows. These are
--     only written by edge functions with the service role; the client
--     insert policy still requires an authenticated user.
alter table public.audit_trail
  alter column actor_id drop not null;

-- 4. Viewer/dashboard indexes (audit log is append-only and hot on
--    created_at-desc scans).
create index if not exists audit_trail_created_at_idx
  on public.audit_trail (created_at desc);
create index if not exists audit_trail_actor_created_idx
  on public.audit_trail (actor_id, created_at desc);
create index if not exists audit_trail_type_created_idx
  on public.audit_trail (type, created_at desc);

-- 5. RLS split: superadmin reads everything; managers keep reading
--    operational entries but not the security-sensitive families
--    (auth.*, user.*, settings.*) introduced by the admin tooling.
--    Existing entry types are unaffected.
drop policy if exists "audit_select" on public.audit_trail;
create policy "audit_select_superadmin" on public.audit_trail
  for select using (public.is_superadmin());
create policy "audit_select_manager" on public.audit_trail
  for select using (
    public.my_role() = 'manager'
    and type not like 'auth.%'
    and type not like 'user.%'
    and type not like 'settings.%'
  );

-- 6. Audited system-settings update. Routes the superadmin toggles
--    through a single RPC so every change lands in the audit log in
--    the same transaction. Direct UPDATEs stay possible under the
--    existing settings_write policy, but the app should use this.
create or replace function public.admin_update_system_settings(
  p_registration_locked boolean default null,
  p_onboarding_enabled  boolean default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old public.system_settings;
begin
  if not public.is_superadmin() then
    raise exception 'Superadmin only';
  end if;

  select * into v_old from public.system_settings where id = 1;

  update public.system_settings
     set registration_locked = coalesce(p_registration_locked, registration_locked),
         onboarding_enabled  = coalesce(p_onboarding_enabled, onboarding_enabled)
   where id = 1;

  perform public.log_audit(
    'settings.changed',
    'System settings updated',
    null,
    jsonb_strip_nulls(jsonb_build_object(
      'registration_locked', case when p_registration_locked is distinct from v_old.registration_locked
                                  then jsonb_build_object('from', v_old.registration_locked, 'to', p_registration_locked) end,
      'onboarding_enabled',  case when p_onboarding_enabled is distinct from v_old.onboarding_enabled
                                  then jsonb_build_object('from', v_old.onboarding_enabled, 'to', p_onboarding_enabled) end
    )),
    'warning'
  );
end;
$$;

revoke execute on function public.admin_update_system_settings(boolean, boolean) from public;
grant execute on function public.admin_update_system_settings(boolean, boolean) to authenticated;
