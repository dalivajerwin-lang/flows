-- Production hardening for public reads and storage access.

create or replace function public.resolve_agent_login_email(p_agent_number text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email
  from public.profiles
  where agent_number = p_agent_number
    and is_active = true
  limit 1;
$$;

grant execute on function public.resolve_agent_login_email(text) to anon, authenticated;

-- Profiles are CRM/user records. Allow authenticated staff to read active
-- profiles, plus self/managers for inactive profiles where needed.
drop policy if exists "profiles_read_all" on public.profiles;
drop policy if exists "profiles_read_authenticated" on public.profiles;
create policy "profiles_read_authenticated"
  on public.profiles for select
  using (
    auth.uid() is not null
    and (
      is_active = true
      or id = auth.uid()
      or public.my_role() in ('manager','superadmin')
    )
  );

-- Project metadata and system settings should not be anonymously readable.
drop policy if exists "projects_read_all" on public.projects;
drop policy if exists "projects_read_authenticated" on public.projects;
create policy "projects_read_authenticated"
  on public.projects for select
  using (auth.uid() is not null);

drop policy if exists "settings_read" on public.system_settings;
drop policy if exists "settings_read_authenticated" on public.system_settings;
create policy "settings_read_authenticated"
  on public.system_settings for select
  using (auth.uid() is not null);

-- Tighten unauthenticated/global appointment visibility.
drop policy if exists "appt_public_read" on public.appointments;
drop policy if exists "appt_public_read_authenticated" on public.appointments;
create policy "appt_public_read_authenticated"
  on public.appointments for select
  using (auth.uid() is not null and is_public = true);

-- Keep lead inserts scoped to the acting consultant or managers.
drop policy if exists "leads_insert_auth" on public.leads;
drop policy if exists "leads_insert_scoped" on public.leads;
create policy "leads_insert_scoped"
  on public.leads for insert
  with check (
    assigned_to = auth.uid()
    or public.my_role() in ('manager','superadmin')
  );

-- Replace broad bucket-wide CRUD policies with prefix/role scoped policies.
drop policy if exists "Allow authenticated CRUD on profile-photos" on storage.objects;
drop policy if exists "Allow authenticated CRUD on broadcast-media" on storage.objects;
drop policy if exists "profile_photos_read_authenticated" on storage.objects;
drop policy if exists "profile_photos_insert_scoped" on storage.objects;
drop policy if exists "profile_photos_update_scoped" on storage.objects;
drop policy if exists "profile_photos_delete_scoped" on storage.objects;
drop policy if exists "broadcast_media_read_authenticated" on storage.objects;
drop policy if exists "broadcast_media_insert_manager" on storage.objects;
drop policy if exists "broadcast_media_update_manager" on storage.objects;
drop policy if exists "broadcast_media_delete_manager" on storage.objects;

create policy "profile_photos_read_authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'profile-photos');

create policy "profile_photos_insert_scoped"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (
      (storage.foldername(name))[1] in ('avatars','leads')
      or public.my_role() in ('manager','superadmin')
    )
  );

create policy "profile_photos_update_scoped"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and (
      (storage.foldername(name))[1] in ('avatars','leads')
      or public.my_role() in ('manager','superadmin')
    )
  )
  with check (
    bucket_id = 'profile-photos'
    and (
      (storage.foldername(name))[1] in ('avatars','leads')
      or public.my_role() in ('manager','superadmin')
    )
  );

create policy "profile_photos_delete_scoped"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and public.my_role() in ('manager','superadmin')
  );

create policy "broadcast_media_read_authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'broadcast-media');

create policy "broadcast_media_insert_manager"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'broadcast-media'
    and (storage.foldername(name))[1] = 'broadcasts'
    and public.my_role() in ('manager','superadmin')
  );

create policy "broadcast_media_update_manager"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'broadcast-media'
    and public.my_role() in ('manager','superadmin')
  )
  with check (
    bucket_id = 'broadcast-media'
    and (storage.foldername(name))[1] = 'broadcasts'
    and public.my_role() in ('manager','superadmin')
  );

create policy "broadcast_media_delete_manager"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'broadcast-media'
    and public.my_role() in ('manager','superadmin')
  );
