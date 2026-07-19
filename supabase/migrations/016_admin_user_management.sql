-- ============================================================
-- 016_admin_user_management.sql
-- Phase 2/3 of the Superadmin UI plan: sanctioned, audited RPCs
-- for user administration and lead intervention. Every function
-- checks is_superadmin() first and writes audit_trail in the
-- same transaction.
-- ============================================================

-- ------------------------------------------------------------
-- admin_set_role: the sanctioned path through the role-protection
-- trigger from migration 009. Superadmin only; cannot target self
-- (the single-superadmin unique index also blocks minting a second
-- superadmin, but we fail early with a clear message).
-- ------------------------------------------------------------
create or replace function public.admin_set_role(
  p_target_id uuid,
  p_new_role  text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_role text;
  v_name     text;
begin
  if not public.is_superadmin() then
    raise exception 'Superadmin only';
  end if;
  if p_target_id = auth.uid() then
    raise exception 'You cannot change your own role';
  end if;
  if p_new_role not in ('manager','property_consultant') then
    raise exception 'Role must be manager or property_consultant';
  end if;

  select role, display_name into v_old_role, v_name
    from public.profiles where id = p_target_id for update;
  if v_old_role is null then
    raise exception 'User not found';
  end if;
  if v_old_role = 'superadmin' then
    raise exception 'The superadmin role cannot be reassigned';
  end if;
  if v_old_role = p_new_role then
    return;
  end if;

  update public.profiles set role = p_new_role, updated_at = now()
   where id = p_target_id;

  perform public.log_audit(
    'user.role_changed',
    format('%s role changed: %s → %s', v_name, v_old_role, p_new_role),
    null,
    jsonb_build_object('target_id', p_target_id, 'from', v_old_role, 'to', p_new_role),
    'warning'
  );
end;
$$;

revoke execute on function public.admin_set_role(uuid, text) from public;
grant execute on function public.admin_set_role(uuid, text) to authenticated;

-- ------------------------------------------------------------
-- admin_set_active: activate/deactivate with audit. Managers keep
-- their existing UI path (/team uses profiles_manager_update); this
-- RPC exists so the superadmin console's changes are always audited.
-- Session revocation on deactivate is handled by the admin-user-ops
-- edge function (needs the service role).
-- ------------------------------------------------------------
create or replace function public.admin_set_active(
  p_target_id uuid,
  p_active    boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.profiles;
begin
  if not public.is_superadmin() then
    raise exception 'Superadmin only';
  end if;
  if p_target_id = auth.uid() then
    raise exception 'You cannot deactivate your own account';
  end if;

  select * into v_row from public.profiles where id = p_target_id for update;
  if v_row.id is null then
    raise exception 'User not found';
  end if;
  if v_row.is_active = p_active then
    return;
  end if;

  update public.profiles set is_active = p_active, updated_at = now()
   where id = p_target_id;

  perform public.log_audit(
    case when p_active then 'user.activated' else 'user.deactivated' end,
    format('%s account %s', v_row.display_name, case when p_active then 'activated' else 'deactivated' end),
    null,
    jsonb_build_object('target_id', p_target_id),
    'warning'
  );
end;
$$;

revoke execute on function public.admin_set_active(uuid, boolean) from public;
grant execute on function public.admin_set_active(uuid, boolean) to authenticated;

-- ------------------------------------------------------------
-- admin_revoke_token: kill any pending registration token
-- (managers can only see their own flow; superadmin can revoke all).
-- Revocation = expire it now, so the invite-user function's
-- "expires_at > now()" check rejects it.
-- ------------------------------------------------------------
create or replace function public.admin_revoke_token(p_token_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.registration_tokens;
begin
  if not public.is_superadmin() then
    raise exception 'Superadmin only';
  end if;

  select * into v_row from public.registration_tokens where id = p_token_id for update;
  if v_row.id is null then
    raise exception 'Token not found';
  end if;
  if v_row.used_at is not null then
    raise exception 'Token has already been redeemed';
  end if;

  update public.registration_tokens set expires_at = now() where id = p_token_id;

  perform public.log_audit(
    'user.token_revoked',
    format('Registration token for %s (agent #%s) revoked',
           coalesce(v_row.intended_display_name, 'unknown'),
           coalesce(v_row.intended_agent_number, '?')),
    null,
    jsonb_build_object('token_id', p_token_id, 'intended_role', v_row.intended_role),
    'warning'
  );
end;
$$;

revoke execute on function public.admin_revoke_token(uuid) from public;
grant execute on function public.admin_revoke_token(uuid) to authenticated;

-- ------------------------------------------------------------
-- admin_reassign_leads: move a user's open pipeline to someone else.
-- The #1 intervention when a consultant leaves. Reassigns either an
-- explicit list of lead ids or (when p_lead_ids is null) every
-- non-deleted lead currently assigned to p_from_user.
-- ------------------------------------------------------------
create or replace function public.admin_reassign_leads(
  p_from_user uuid,
  p_to_user   uuid,
  p_lead_ids  uuid[] default null
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_name text;
  v_to_name   text;
  v_count     int;
begin
  if not public.is_superadmin() then
    raise exception 'Superadmin only';
  end if;

  select display_name into v_from_name from public.profiles where id = p_from_user;
  select display_name into v_to_name from public.profiles
   where id = p_to_user and is_active;
  if v_to_name is null then
    raise exception 'Target user not found or inactive';
  end if;

  with moved as (
    update public.leads
       set assigned_to = p_to_user,
           last_activity_at = now(),
           updated_at = now()
     where assigned_to = p_from_user
       and deleted_at is null
       and (p_lead_ids is null or id = any(p_lead_ids))
    returning id
  )
  select count(*) into v_count from moved;

  if v_count > 0 then
    perform public.log_audit(
      'lead.reassigned',
      format('%s lead(s) reassigned from %s to %s', v_count, coalesce(v_from_name, 'unknown'), v_to_name),
      null,
      jsonb_build_object('from_user', p_from_user, 'to_user', p_to_user, 'count', v_count,
                         'lead_ids', p_lead_ids),
      'warning'
    );
  end if;

  return v_count;
end;
$$;

revoke execute on function public.admin_reassign_leads(uuid, uuid, uuid[]) from public;
grant execute on function public.admin_reassign_leads(uuid, uuid, uuid[]) to authenticated;

-- ------------------------------------------------------------
-- admin_force_stage: bypass the reversion-request workflow. Requires
-- a reason so the audit entry is meaningful. Deliberately does not
-- run the full transition_lead() stage machine — this is the escape
-- hatch for when that machine is exactly what's stuck.
-- ------------------------------------------------------------
create or replace function public.admin_force_stage(
  p_lead_id  uuid,
  p_to_stage text,
  p_reason   text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead public.leads;
begin
  if not public.is_superadmin() then
    raise exception 'Superadmin only';
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'A reason is required';
  end if;
  if p_to_stage not in ('new_lead','crf','reserved','documentation','closed_sale','cancelled','archived') then
    raise exception 'Unknown stage: %', p_to_stage;
  end if;

  select * into v_lead from public.leads where id = p_lead_id for update;
  if v_lead.id is null then
    raise exception 'Lead not found';
  end if;
  if v_lead.stage = p_to_stage then
    return;
  end if;

  update public.leads
     set previous_stage   = v_lead.stage,
         stage            = p_to_stage,
         stage_changed_at = now(),
         last_activity_at = now(),
         version          = v_lead.version + 1,
         updated_at       = now()
   where id = p_lead_id;

  perform public.log_audit(
    'lead.stage_forced',
    format('Stage forced: %s → %s (%s)', v_lead.stage, p_to_stage, v_lead.full_name),
    p_lead_id,
    jsonb_build_object('from', v_lead.stage, 'to', p_to_stage, 'reason', trim(p_reason)),
    'critical'
  );
end;
$$;

revoke execute on function public.admin_force_stage(uuid, text, text) from public;
grant execute on function public.admin_force_stage(uuid, text, text) to authenticated;

-- ------------------------------------------------------------
-- admin_restore_lead: clear deleted_at on a trashed lead.
-- ------------------------------------------------------------
create or replace function public.admin_restore_lead(p_lead_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead public.leads;
begin
  if not public.is_superadmin() then
    raise exception 'Superadmin only';
  end if;

  select * into v_lead from public.leads where id = p_lead_id for update;
  if v_lead.id is null then
    raise exception 'Lead not found';
  end if;
  if v_lead.deleted_at is null then
    return;
  end if;

  update public.leads
     set deleted_at = null,
         reactivated_at = now(),
         last_activity_at = now(),
         updated_at = now()
   where id = p_lead_id;

  perform public.log_audit(
    'lead.restored',
    format('Deleted lead restored: %s', v_lead.full_name),
    p_lead_id,
    jsonb_build_object('was_deleted_at', v_lead.deleted_at),
    'warning'
  );
end;
$$;

revoke execute on function public.admin_restore_lead(uuid) from public;
grant execute on function public.admin_restore_lead(uuid) to authenticated;

-- ------------------------------------------------------------
-- admin_health_snapshot: single round-trip feed for the /admin
-- dashboard status strip (Phase 4).
-- ------------------------------------------------------------
create or replace function public.admin_health_snapshot()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v jsonb;
begin
  if not public.is_superadmin() then
    raise exception 'Superadmin only';
  end if;

  select jsonb_build_object(
    'critical_events_24h', (
      select count(*) from audit_trail
      where severity = 'critical' and created_at > now() - interval '24 hours'
    ),
    'failed_logins_24h', (
      select count(*) from audit_trail
      where type = 'auth.login_failed' and created_at > now() - interval '24 hours'
    ),
    'stuck_reversions', (
      select count(*) from stage_reversion_requests
      where status = 'pending' and created_at < now() - interval '2 days'
    ),
    'stuck_crf_extensions', (
      select count(*) from crf_extensions
      where status = 'pending' and requested_at < now() - interval '2 days'
    ),
    'orphaned_leads', (
      select count(*) from leads l
      where l.deleted_at is null
        and (l.assigned_to is null
             or exists (select 1 from profiles p
                        where p.id = l.assigned_to and not p.is_active))
    ),
    'stale_users', (
      select count(*) from profiles
      where is_active
        and role <> 'superadmin'
        and (last_login_at is null or last_login_at < now() - interval '7 days')
    ),
    'registration_locked', (
      select registration_locked from system_settings where id = 1
    ),
    'active_users_today', (
      select count(distinct actor_id) from audit_trail
      where actor_id is not null and created_at > date_trunc('day', now())
    ),
    'leads_touched_today', (
      select count(*) from leads
      where deleted_at is null and last_activity_at > date_trunc('day', now())
    ),
    'deleted_leads', (
      select count(*) from leads where deleted_at is not null
    ),
    'generated_at', now()
  ) into v;

  return v;
end;
$$;

revoke execute on function public.admin_health_snapshot() from public;
grant execute on function public.admin_health_snapshot() to authenticated;
