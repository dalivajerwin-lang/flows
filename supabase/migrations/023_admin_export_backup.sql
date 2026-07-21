-- 023: admin_export_backup — full-data JSON backup for the superadmin.
--
-- The admin console had no way to back up the workspace; only partial report
-- CSVs existed. This RPC returns every business table as one jsonb document,
-- which the client downloads as a .json file. Superadmin-only, audited,
-- SECURITY DEFINER so the export is complete regardless of per-table RLS.
--
-- offline_outbox is excluded (legacy, purged client-side). auth.users is not
-- exportable from SQL here — account emails live in profiles already.
create or replace function public.admin_export_backup()
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
    'meta', jsonb_build_object(
      'exported_at', now(),
      'exported_by', auth.uid(),
      'format_version', 1
    ),
    'profiles',                  coalesce((select jsonb_agg(to_jsonb(t)) from public.profiles t), '[]'::jsonb),
    'projects',                  coalesce((select jsonb_agg(to_jsonb(t)) from public.projects t), '[]'::jsonb),
    'leads',                     coalesce((select jsonb_agg(to_jsonb(t)) from public.leads t), '[]'::jsonb),
    'lead_notes',                coalesce((select jsonb_agg(to_jsonb(t)) from public.lead_notes t), '[]'::jsonb),
    'lead_buyers',               coalesce((select jsonb_agg(to_jsonb(t)) from public.lead_buyers t), '[]'::jsonb),
    'appointments',              coalesce((select jsonb_agg(to_jsonb(t)) from public.appointments t), '[]'::jsonb),
    'stage_reversion_requests',  coalesce((select jsonb_agg(to_jsonb(t)) from public.stage_reversion_requests t), '[]'::jsonb),
    'crf_extensions',            coalesce((select jsonb_agg(to_jsonb(t)) from public.crf_extensions t), '[]'::jsonb),
    'notifications',             coalesce((select jsonb_agg(to_jsonb(t)) from public.notifications t), '[]'::jsonb),
    'broadcasts',                coalesce((select jsonb_agg(to_jsonb(t)) from public.broadcasts t), '[]'::jsonb),
    'broadcast_acknowledgments', coalesce((select jsonb_agg(to_jsonb(t)) from public.broadcast_acknowledgments t), '[]'::jsonb),
    'daily_agenda_items',        coalesce((select jsonb_agg(to_jsonb(t)) from public.daily_agenda_items t), '[]'::jsonb),
    'team_goals',                coalesce((select jsonb_agg(to_jsonb(t)) from public.team_goals t), '[]'::jsonb),
    'system_settings',           coalesce((select jsonb_agg(to_jsonb(t)) from public.system_settings t), '[]'::jsonb),
    'registration_tokens',       coalesce((select jsonb_agg(to_jsonb(t)) from public.registration_tokens t), '[]'::jsonb),
    'audit_trail',               coalesce((select jsonb_agg(to_jsonb(t)) from public.audit_trail t), '[]'::jsonb)
  ) into v;

  return v;
end;
$$;

revoke execute on function public.admin_export_backup() from public;
grant execute on function public.admin_export_backup() to authenticated;

-- Audit the export from a separate wrapper so the main function can stay
-- STABLE (log_audit writes). The client calls this one.
create or replace function public.admin_export_backup_logged()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v jsonb;
begin
  v := public.admin_export_backup();
  perform public.log_audit(
    'system.backup_exported',
    'Full data backup downloaded',
    null,
    jsonb_build_object(
      'leads', jsonb_array_length(v->'leads'),
      'profiles', jsonb_array_length(v->'profiles'),
      'audit_rows', jsonb_array_length(v->'audit_trail')
    ),
    'warning'
  );
  return v;
end;
$$;

revoke execute on function public.admin_export_backup_logged() from public;
grant execute on function public.admin_export_backup_logged() to authenticated;
