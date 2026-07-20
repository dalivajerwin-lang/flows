-- 019: admin_purge_trash — permanently delete every trashed lead.
--
-- The Deleted Leads panel could only restore; trash accumulated forever.
-- Superadmin-only, mirrors the other admin_* RPCs (migration 016): single
-- audited SECURITY DEFINER function, never a raw client delete.
--
-- Hard-deleting a lead cascades to its children (notes, stage_transitions,
-- reversion_requests, crf_extensions — all `on delete cascade`, 001) and
-- nulls audit_trail.lead_id (`on delete set null`), so history rows survive.

create or replace function public.admin_purge_trash()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_names text[];
begin
  if not public.is_superadmin() then
    raise exception 'Superadmin only';
  end if;

  select array_agg(full_name), count(*)
    into v_names, v_count
    from public.leads
   where deleted_at is not null;

  if coalesce(v_count, 0) = 0 then
    return 0;
  end if;

  delete from public.leads where deleted_at is not null;

  perform public.log_audit(
    'lead.trash_purged',
    format('Trash emptied: %s lead(s) permanently deleted', v_count),
    null,
    jsonb_build_object('count', v_count, 'names', to_jsonb(v_names)),
    'critical'
  );

  return v_count;
end;
$$;

revoke execute on function public.admin_purge_trash() from public;
grant execute on function public.admin_purge_trash() to authenticated;
