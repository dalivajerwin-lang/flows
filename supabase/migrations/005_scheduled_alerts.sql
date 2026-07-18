-- 005_scheduled_alerts.sql
-- Migration to set up scheduled daily stagnant lead alerts

create or replace function public.sweep_stagnant_leads()
returns void language plpgsql security definer as $$
declare
  r record;
  mgr record;
  v_now timestamptz := now();
begin
  -- Loop through active pipeline leads that are stagnant (no activity in 7 days)
  for r in
    select id, full_name, assigned_to, last_activity_at, updated_at
    from public.leads
    where stage in ('new_lead', 'crf', 'reserved', 'documentation')
      and deleted_at is null
      and coalesce(last_activity_at, updated_at, created_at) < v_now - interval '7 days'
  loop
    if r.assigned_to is not null and r.assigned_to != '00000000-0000-0000-0000-000000000000'::uuid then
      -- Notify assigned agent
      -- Only if not notified in last 24h
      if not exists (
        select 1 from public.notifications
        where user_id = r.assigned_to
          and type = 'stagnant_lead_alert'
          and body like r.full_name || '%'
          and created_at > v_now - interval '24 hours'
      ) then
        insert into public.notifications (user_id, title, body, target_route, type)
        values (
          r.assigned_to,
          'Stagnant Lead Alert',
          r.full_name || ' has been stagnant for 7+ days. Please follow up.',
          '/leads',
          'stagnant_lead_alert'
        );
      end if;
    else
      -- Unassigned stagnant lead: Notify Managers
      for mgr in select id from public.profiles where role in ('manager', 'superadmin') loop
        if not exists (
          select 1 from public.notifications
          where user_id = mgr.id
            and type = 'unassigned_stagnant_lead_alert'
            and body like r.full_name || '%'
            and created_at > v_now - interval '24 hours'
        ) then
          insert into public.notifications (user_id, title, body, target_route, type)
          values (
            mgr.id,
            'Unassigned Stagnant Lead',
            r.full_name || ' is unassigned and stagnant for 7+ days.',
            '/leads',
            'unassigned_stagnant_lead_alert'
          );
        end if;
      end loop;
    end if;
  end loop;
end;
$$;

-- Register scheduled sweep via pg_cron (runs daily at 8:00 AM)
select cron.unschedule(jobid) from cron.job where jobname = 'sweep-stagnant-leads-daily';
select cron.schedule('sweep-stagnant-leads-daily', '0 8 * * *', 'select public.sweep_stagnant_leads();');
