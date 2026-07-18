 -- Make 0f083275-37d1-43e3-949f-448a1c69accc the first superadmin.
  -- Run in the Supabase SQL Editor (runs as postgres, bypasses RLS and
  -- passes the role-protection trigger since auth.uid() is null).

  insert into public.profiles (id, role, display_name, agent_number, email, is_active)
  select
    u.id,
    'superadmin',
    'Super Admin',        -- TODO: replace with the real display name
    '1',             -- TODO: replace with the real agent number
    coalesce(u.email, ''),
    true
  from auth.users u
  where u.id = 'UID' -- TODO: replace with the real uid
  on conflict (id) do update
    set role      = 'superadmin',
        is_active = true;

  -- Verify
  select id, role, display_name, agent_number, email, is_active
  from public.profiles
  where role = 'superadmin';