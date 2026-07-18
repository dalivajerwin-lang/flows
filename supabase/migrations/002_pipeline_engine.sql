-- ==========================================
-- 002_pipeline_engine.sql
-- Database-Enforced Stage Transitions, Undo, Reversions, and Scheduled Sweeps
-- ==========================================

create extension if not exists pg_cron;

-- 1. TRANSITION LEAD RPC
create or replace function public.transition_lead(
  p_lead_id uuid,
  p_to_stage text,
  p_fields jsonb,
  p_actor_id uuid,
  p_auto boolean default false,
  p_skip_undo boolean default false
)
returns jsonb language plpgsql security definer as $$
declare
  v_lead record;
  v_actor record;
  v_now timestamptz := now();
  v_patch jsonb := '{}'::jsonb;
  v_validation_error text;
  v_crf_expires timestamptz;
  v_reservation_expires timestamptz;
  v_undo_deadline timestamptz := null;
  v_undo_actor uuid := null;
  v_buyer_count int;
  v_incomplete_docs_count int;
  v_mgr record;
  v_stage_labels jsonb := '{
    "new_lead": "New Lead",
    "crf": "CRF",
    "reserved": "Reserved",
    "documentation": "Documentation",
    "closed_sale": "Closed Sale",
    "cancelled": "Cancelled",
    "archived": "Archived"
  }'::jsonb;
  v_cancellation_reason text;
begin
  -- Load lead
  select * into v_lead from public.leads where id = p_lead_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Lead not found.');
  end if;
  if v_lead.deleted_at is not null then
    return jsonb_build_object('ok', false, 'error', 'Cannot transition a trashed lead.');
  end if;

  -- Load actor (allow system UUID '00000000-0000-0000-0000-000000000000' for auto-jobs)
  if p_actor_id != '00000000-0000-0000-0000-000000000000'::uuid then
    select * into v_actor from public.profiles where id = p_actor_id;
    if not found then
      return jsonb_build_object('ok', false, 'error', 'Actor profile not found.');
    end if;
  end if;

  -- Check stage rules for consultants
  if not p_auto and v_actor is not null and v_actor.role = 'property_consultant' then
    -- Forward only check
    declare
      v_stages text[] := array['new_lead', 'crf', 'reserved', 'documentation', 'closed_sale', 'cancelled', 'archived'];
      v_curr_idx int;
      v_to_idx int;
    begin
      v_curr_idx := array_position(v_stages, v_lead.stage);
      v_to_idx := array_position(v_stages, p_to_stage);
      
      -- PC can't move backward except to cancelled
      if v_to_idx < v_curr_idx and p_to_stage != 'cancelled' then
        return jsonb_build_object('ok', false, 'error', 'You cannot move a lead backward. Request a stage reversion instead.');
      end if;
      
      -- Cannot transition from cancelled or archived
      if v_lead.stage in ('cancelled', 'archived') then
        return jsonb_build_object('ok', false, 'error', 'Cannot transition an inactive lead.');
      end if;
    end;
  end if;

  -- Check expired reservation block
  if not p_auto and v_lead.stage = 'reserved' and v_lead.reservation_status = 'expired' 
     and p_to_stage != 'cancelled' 
     and not (p_to_stage = 'documentation' and (p_fields->>'unit_payment_status') = 'paid') 
     and v_actor is not null and v_actor.role = 'property_consultant' then
    return jsonb_build_object('ok', false, 'error', 'Reservation is expired. Confirm payment or request manager reactivation.');
  end if;

  -- Validate required fields
  if p_to_stage = 'crf' then
    if p_fields->>'crf_submission_date' is null or p_fields->>'crf_submission_date' = '' then
      return jsonb_build_object('ok', false, 'error', 'CRF submission date is required.');
    end if;
  elsif p_to_stage = 'reserved' then
    if v_lead.crf_submission_date is null and (p_fields->>'crf_submission_date' is null or p_fields->>'crf_submission_date' = '') then
      return jsonb_build_object('ok', false, 'error', 'CRF must be submitted before reserving a unit.');
    end if;
    if p_fields->>'unit_description' is null or p_fields->>'unit_description' = '' then
      return jsonb_build_object('ok', false, 'error', 'Unit description is required.');
    end if;
    if p_fields->>'unit_payment_date' is null or p_fields->>'unit_payment_date' = '' then
      return jsonb_build_object('ok', false, 'error', 'Unit payment date is required.');
    end if;
    if p_fields->>'unit_payment_status' is null or p_fields->>'unit_payment_status' = '' then
      return jsonb_build_object('ok', false, 'error', 'Unit payment status is required.');
    end if;
  elsif p_to_stage = 'documentation' then
    if p_fields->>'documentation_start_date' is null or p_fields->>'documentation_start_date' = '' then
      return jsonb_build_object('ok', false, 'error', 'Documentation start date is required.');
    end if;
  elsif p_to_stage = 'closed_sale' then
    if p_fields->>'sale_price' is null or (p_fields->>'sale_price')::bigint <= 0 then
      return jsonb_build_object('ok', false, 'error', 'Valid sale price is required.');
    end if;
    if p_fields->>'sale_payment_date' is null or p_fields->>'sale_payment_date' = '' then
      return jsonb_build_object('ok', false, 'error', 'Sale payment date is required.');
    end if;
  elsif p_to_stage = 'cancelled' then
    v_cancellation_reason := trim(p_fields->>'cancellation_reason');
    if v_cancellation_reason is null or v_cancellation_reason = '' then
      return jsonb_build_object('ok', false, 'error', 'Cancellation reason is required.');
    end if;
    if not p_auto and length(v_cancellation_reason) < 5 then
      return jsonb_build_object('ok', false, 'error', 'Cancellation reason must be at least 5 characters.');
    end if;
  end if;

  -- Closed sale buyer/document validation
  if p_to_stage = 'closed_sale' then
    select count(*) into v_buyer_count from public.lead_buyers where lead_id = p_lead_id;
    if v_buyer_count = 0 then
      return jsonb_build_object('ok', false, 'error', 'At least one buyer with completed documents is required.');
    end if;
    
    select count(*) into v_incomplete_docs_count 
    from public.lead_buyers 
    where lead_id = p_lead_id
      and (
        (docs->>'valid_id')::boolean is not true or
        (docs->>'valid_id_selfie')::boolean is not true or
        (docs->>'tin')::boolean is not true or
        (docs->>'account')::boolean is not true
      );
    if v_incomplete_docs_count > 0 then
      return jsonb_build_object('ok', false, 'error', 'All buyer documents must be checked before closing the sale.');
    end if;
  end if;

  -- Calculate Expiries and Deadlines
  if p_to_stage = 'crf' then
    v_crf_expires := v_lead.crf_expires_at;
    if v_lead.crf_first_entered_at is null then
      v_crf_expires := v_now + interval '30 days';
    end if;
  elsif p_to_stage = 'reserved' then
    v_reservation_expires := v_now + interval '24 hours';
    if v_lead.crf_first_entered_at is null then
      v_crf_expires := v_now + interval '30 days';
    else
      v_crf_expires := v_lead.crf_expires_at;
    end if;
  end if;

  if not p_auto and not p_skip_undo and v_actor is not null and v_actor.role = 'property_consultant' then
    v_undo_deadline := v_now + interval '10 minutes';
    v_undo_actor := p_actor_id;
  end if;

  -- Perform Update on Lead
  update public.leads
  set stage = p_to_stage,
      previous_stage = v_lead.stage,
      stage_changed_at = v_now,
      last_activity_at = v_now,
      updated_at = v_now,
      crf_submission_date = case when p_to_stage in ('crf', 'reserved') then coalesce(crf_submission_date, (p_fields->>'crf_submission_date')::date) else crf_submission_date end,
      crf_first_entered_at = case when p_to_stage in ('crf', 'reserved') then coalesce(crf_first_entered_at, v_now) else crf_first_entered_at end,
      crf_expires_at = case when p_to_stage in ('crf', 'reserved') then coalesce(crf_expires_at, v_crf_expires) else crf_expires_at end,
      unit_description = case when p_to_stage = 'reserved' then p_fields->>'unit_description' else unit_description end,
      unit_payment_date = case when p_to_stage = 'reserved' then (p_fields->>'unit_payment_date')::date else unit_payment_date end,
      unit_payment_status = case when p_to_stage = 'reserved' then p_fields->>'unit_payment_status' else unit_payment_status end,
      reservation_expires_at = case when p_to_stage = 'reserved' then v_reservation_expires else reservation_expires_at end,
      reservation_status = case when p_to_stage = 'reserved' then 'active' when p_to_stage = 'documentation' then null else reservation_status end,
      documentation_start_date = case when p_to_stage = 'documentation' then (p_fields->>'documentation_start_date')::date else documentation_start_date end,
      sale_price = case when p_to_stage = 'closed_sale' then (p_fields->>'sale_price')::bigint else sale_price end,
      sale_payment_date = case when p_to_stage = 'closed_sale' then (p_fields->>'sale_payment_date')::date else sale_payment_date end,
      closed_sale_status = case when p_to_stage = 'closed_sale' then (case when (v_actor is not null and v_actor.role = 'property_consultant') then 'pending_verification' else 'verified' end) else closed_sale_status end,
      closed_sale_verified_by = case when p_to_stage = 'closed_sale' and (v_actor is null or v_actor.role != 'property_consultant') then p_actor_id else closed_sale_verified_by end,
      closed_sale_verified_at = case when p_to_stage = 'closed_sale' and (v_actor is null or v_actor.role != 'property_consultant') then v_now else closed_sale_verified_at end,
      cancellation_reason = case when p_to_stage = 'cancelled' then v_cancellation_reason else cancellation_reason end,
      undo_deadline = v_undo_deadline,
      undo_actor_id = v_undo_actor
  where id = p_lead_id;

  -- Insert Primary Buyer in Documentation if none exists
  if p_to_stage = 'documentation' then
    select count(*) into v_buyer_count from public.lead_buyers where lead_id = p_lead_id;
    if v_buyer_count = 0 then
      insert into public.lead_buyers (lead_id, name, kind, docs)
      values (p_lead_id, v_lead.full_name, 'primary', '{"valid_id":false,"valid_id_selfie":false,"tin":false,"account":false}'::jsonb);
    end if;
  end if;

  -- Audit Trail
  declare
    v_audit_type text := 'stage_transition';
  begin
    if p_auto then
      if p_to_stage = 'cancelled' and v_cancellation_reason = 'CRF Expired' then
        v_audit_type := 'auto_cancelled_crf';
      elsif p_to_stage = 'cancelled' and v_cancellation_reason = 'Reservation Expired – No Action' then
        v_audit_type := 'auto_cancelled_reservation';
      end if;
    end if;

    insert into public.audit_trail (lead_id, actor_id, type, summary, meta)
    values (
      p_lead_id,
      p_actor_id,
      v_audit_type,
      coalesce(v_stage_labels->>v_lead.stage, v_lead.stage) || ' → ' || coalesce(v_stage_labels->>p_to_stage, p_to_stage) || case when p_auto then ' (auto)' else '' end,
      jsonb_build_object('from', v_lead.stage, 'to', p_to_stage, 'fields', p_fields)
    );
  end;

  -- Manager notifications for pending closed sale
  if p_to_stage = 'closed_sale' and v_actor is not null and v_actor.role = 'property_consultant' then
    for v_mgr in select id from public.profiles where role in ('manager', 'superadmin') loop
      insert into public.notifications (user_id, title, body, target_route, type)
      values (
        v_mgr.id,
        'Closed sale pending',
        v_lead.full_name || ' — awaiting verification.',
        '/assistant',
        'sale_pending'
      );
    end loop;
  end if;

  return jsonb_build_object('ok', true, 'lead_id', p_lead_id);
end;
$$;


-- 2. UNDO TRANSITION RPC
create or replace function public.undo_transition(
  p_lead_id uuid,
  p_actor_id uuid
)
returns jsonb language plpgsql security definer as $$
declare
  v_lead record;
  v_now timestamptz := now();
  v_stage_labels jsonb := '{
    "new_lead": "New Lead",
    "crf": "CRF",
    "reserved": "Reserved",
    "documentation": "Documentation",
    "closed_sale": "Closed Sale",
    "cancelled": "Cancelled",
    "archived": "Archived"
  }'::jsonb;
begin
  select * into v_lead from public.leads where id = p_lead_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Lead not found.');
  end if;

  if v_lead.undo_deadline is null or v_lead.undo_actor_id is null then
    return jsonb_build_object('ok', false, 'error', 'No undo window active.');
  end if;

  if v_lead.undo_actor_id != p_actor_id then
    return jsonb_build_object('ok', false, 'error', 'Unauthorized to undo this transition.');
  end if;

  if v_lead.undo_deadline < v_now then
    return jsonb_build_object('ok', false, 'error', 'Undo window has expired.');
  end if;

  if v_lead.previous_stage is null then
    return jsonb_build_object('ok', false, 'error', 'No previous stage recorded.');
  end if;

  update public.leads
  set stage = previous_stage,
      previous_stage = null,
      undo_deadline = null,
      undo_actor_id = null,
      stage_changed_at = v_now,
      last_activity_at = v_now,
      updated_at = v_now
  where id = p_lead_id;

  insert into public.audit_trail (lead_id, actor_id, type, summary)
  values (
    p_lead_id,
    p_actor_id,
    'stage_transition_undone',
    'Reverted stage to ' || coalesce(v_stage_labels->>v_lead.previous_stage, v_lead.previous_stage)
  );

  return jsonb_build_object('ok', true, 'lead_id', p_lead_id);
end;
$$;


-- 3. REVERSION REQUEST RPC
create or replace function public.request_stage_reversion(
  p_lead_id uuid,
  p_to_stage text,
  p_reason text,
  p_actor_id uuid
)
returns jsonb language plpgsql security definer as $$
declare
  v_lead record;
  v_stage_labels jsonb := '{
    "new_lead": "New Lead",
    "crf": "CRF",
    "reserved": "Reserved",
    "documentation": "Documentation",
    "closed_sale": "Closed Sale",
    "cancelled": "Cancelled",
    "archived": "Archived"
  }'::jsonb;
  v_mgr record;
begin
  select * into v_lead from public.leads where id = p_lead_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Lead not found.');
  end if;

  insert into public.stage_reversion_requests (lead_id, agent_id, from_stage, to_stage, reason, status)
  values (p_lead_id, p_actor_id, v_lead.stage, p_to_stage, p_reason, 'pending');

  insert into public.audit_trail (lead_id, actor_id, type, summary)
  values (
    p_lead_id,
    p_actor_id,
    'reversion_requested',
    'Requested stage reversion to ' || coalesce(v_stage_labels->>p_to_stage, p_to_stage)
  );

  for v_mgr in select id from public.profiles where role in ('manager', 'superadmin') loop
    insert into public.notifications (user_id, title, body, target_route, type)
    values (
      v_mgr.id,
      'Reversion requested',
      'From ' || v_lead.full_name || '. Stage Reversion Request.',
      '/assistant',
      'reversion_requested'
    );
  end loop;

  return jsonb_build_object('ok', true);
end;
$$;


-- 4. APPROVE REVERSION RPC
create or replace function public.approve_reversion(
  p_request_id uuid,
  p_correction_reason text,
  p_actor_id uuid
)
returns jsonb language plpgsql security definer as $$
declare
  v_req record;
  v_lead record;
  v_actor record;
  v_now timestamptz := now();
  v_res jsonb;
  v_stage_labels jsonb := '{
    "new_lead": "New Lead",
    "crf": "CRF",
    "reserved": "Reserved",
    "documentation": "Documentation",
    "closed_sale": "Closed Sale",
    "cancelled": "Cancelled",
    "archived": "Archived"
  }'::jsonb;
begin
  -- Check actor role
  select * into v_actor from public.profiles where id = p_actor_id;
  if not found or v_actor.role = 'property_consultant' then
    return jsonb_build_object('ok', false, 'error', 'Manager only.');
  end if;

  select * into v_req from public.stage_reversion_requests where id = p_request_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Request not found.');
  end if;

  if v_req.status != 'pending' then
    return jsonb_build_object('ok', false, 'error', 'Request already resolved.');
  end if;

  select * into v_lead from public.leads where id = v_req.lead_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Lead not found.');
  end if;

  update public.stage_reversion_requests
  set status = 'approved',
      resolved_by = p_actor_id,
      resolved_at = v_now,
      correction_reason = p_correction_reason
  where id = p_request_id;

  -- Call transition_lead
  v_res := public.transition_lead(
    v_req.lead_id,
    v_req.to_stage,
    '{}'::jsonb,
    p_actor_id,
    true, -- auto: true bypasses PC limits
    true  -- skipUndo: true
  );

  if not (v_res->>'ok')::boolean then
    -- Rollback status if transition fails
    update public.stage_reversion_requests set status = 'pending' where id = p_request_id;
    return v_res;
  end if;

  insert into public.audit_trail (lead_id, actor_id, type, summary)
  values (
    v_req.lead_id,
    p_actor_id,
    'reversion_approved',
    'Stage reversion approved to ' || coalesce(v_stage_labels->>v_req.to_stage, v_req.to_stage) || ': ' || p_correction_reason
  );

  insert into public.notifications (user_id, title, body, target_route, type)
  values (
    v_req.agent_id,
    'Reversion approved',
    'Stage reverted to ' || coalesce(v_stage_labels->>v_req.to_stage, v_req.to_stage) || '.',
    '/leads',
    'reversion_approved'
  );

  return jsonb_build_object('ok', true);
end;
$$;


-- 5. DENY REVERSION RPC
create or replace function public.deny_reversion(
  p_request_id uuid,
  p_deny_reason text,
  p_actor_id uuid
)
returns jsonb language plpgsql security definer as $$
declare
  v_req record;
  v_actor record;
  v_now timestamptz := now();
begin
  select * into v_actor from public.profiles where id = p_actor_id;
  if not found or v_actor.role = 'property_consultant' then
    return jsonb_build_object('ok', false, 'error', 'Manager only.');
  end if;

  select * into v_req from public.stage_reversion_requests where id = p_request_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Request not found.');
  end if;

  if v_req.status != 'pending' then
    return jsonb_build_object('ok', false, 'error', 'Request already resolved.');
  end if;

  update public.stage_reversion_requests
  set status = 'denied',
      resolved_by = p_actor_id,
      resolved_at = v_now,
      deny_reason = p_deny_reason
  where id = p_request_id;

  insert into public.audit_trail (lead_id, actor_id, type, summary)
  values (
    v_req.lead_id,
    p_actor_id,
    'reversion_denied',
    'Stage reversion denied: ' || p_deny_reason
  );

  insert into public.notifications (user_id, title, body, target_route, type)
  values (
    v_req.agent_id,
    'Reversion request denied',
    'Rejection reason: ' || p_deny_reason,
    '/leads',
    'reversion_denied'
  );

  return jsonb_build_object('ok', true);
end;
$$;


-- 6. SWEEP EXPIRIES CRON
create or replace function public.sweep_expiries_cron()
returns void language plpgsql security definer as $$
declare
  r record;
  mgr record;
  v_now timestamptz := now();
  v_res jsonb;
begin
  -- 1. CRF Expiry
  for r in
    select id, full_name, assigned_to, crf_expires_at
    from public.leads
    where stage = 'crf' and deleted_at is null
  loop
    if r.crf_expires_at < v_now then
      -- Transition CRF Expired
      v_res := public.transition_lead(
        r.id,
        'cancelled',
        jsonb_build_object('cancellation_reason', 'CRF Expired'),
        '00000000-0000-0000-0000-000000000000'::uuid, -- system actor id
        true, -- auto = true
        true  -- skipUndo = true
      );
      
      insert into public.notifications (user_id, title, body, target_route, type)
      values (
        r.assigned_to,
        'Lead will be archived soon',
        r.full_name || ' has expired and will be auto-archived in 25 days.',
        '/leads',
        'archive_warning'
      );
    elsif r.crf_expires_at - v_now < interval '3 days' and r.crf_expires_at - v_now > interval '0 seconds' then
      -- Check if notification was already sent in the last 24h
      if not exists (
        select 1 from public.notifications
        where user_id = r.assigned_to
          and type = 'crf_near_expiry'
          and created_at > v_now - interval '24 hours'
      ) then
        insert into public.notifications (user_id, title, body, target_route, type)
        values (
          r.assigned_to,
          'CRF Expiry Alert',
          r.full_name || '''s CRF is expiring in less than 3 days.',
          '/leads',
          'crf_near_expiry'
        );
      end if;
    end if;
  end loop;

  -- 2. Reservation Expiry
  for r in
    select id, full_name, assigned_to, reservation_expires_at
    from public.leads
    where stage = 'reserved' and reservation_status = 'active' and deleted_at is null
  loop
    if r.reservation_expires_at < v_now then
      update public.leads
      set reservation_status = 'expired',
          updated_at = v_now
      where id = r.id;

      insert into public.audit_trail (lead_id, actor_id, type, summary)
      values (r.id, '00000000-0000-0000-0000-000000000000'::uuid, 'reservation_expired', 'Reservation expired');

      insert into public.notifications (user_id, title, body, target_route, type)
      values (
        r.assigned_to,
        'Reservation Expired',
        r.full_name || '''s reservation has expired. Request reactivation.',
        '/leads',
        'reservation_expired'
      );

      for mgr in select id from public.profiles where role in ('manager', 'superadmin') loop
        insert into public.notifications (user_id, title, body, target_route, type)
        values (
          mgr.id,
          'Reservation Expired Escalation',
          r.full_name || '''s reservation expired with no action.',
          '/assistant',
          'reservation_expired_escalation'
        );
      end loop;
    elsif r.reservation_expires_at - v_now < interval '4 hours' and r.reservation_expires_at - v_now > interval '0 seconds' then
      -- Warn managers
      if not exists (
        select 1 from public.notifications
        where type = 'reservation_near_expiry_escalation'
          and body like r.full_name || '%'
          and created_at > v_now - interval '4 hours'
      ) then
        for mgr in select id from public.profiles where role in ('manager', 'superadmin') loop
          insert into public.notifications (user_id, title, body, target_route, type)
          values (
            mgr.id,
            'Escalation warning',
            r.full_name || '''s reservation expires in < 4 hours.',
            '/assistant',
            'reservation_near_expiry_escalation'
          );
        end loop;
      end if;
    end if;
  end loop;
end;
$$;

-- Register scheduled sweep via pg_cron (runs every minute)
select cron.unschedule(jobid) from cron.job where jobname = 'sweep-expiries-every-minute';
select cron.schedule('sweep-expiries-every-minute', '* * * * *', 'select public.sweep_expiries_cron();');
