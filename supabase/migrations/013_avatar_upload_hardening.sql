-- Avatar upload hardening (server-side enforcement of the client rules).
--
-- 1. Bucket-level MIME allowlist + size cap for profile-photos: only
--    JPEG/PNG/WebP up to 5 MB are accepted, regardless of what the client
--    claims. Supabase Storage enforces these on every upload.
-- 2. Per-user folder scoping: new uploads must land in
--    avatars/<auth-uid>/... or leads/<auth-uid>/..., so a user can only
--    create/replace objects under their own prefix (managers keep full
--    access, and legacy flat paths remain readable/manageable by managers).
-- 3. Server-side throttle: at most one profile-photos upload per user every
--    5 seconds, checked against storage.objects via a SECURITY DEFINER
--    helper (bypasses RLS to avoid policy recursion).

-- ── 1. Bucket constraints ───────────────────────────────────────────────
update storage.buckets
set
  file_size_limit = 5242880, -- 5 MB
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'profile-photos';

-- ── 3 (helper). Upload throttle check ───────────────────────────────────
create or replace function public.profile_photo_upload_allowed()
returns boolean
language sql
stable
security definer
set search_path = public, storage
as $$
  select not exists (
    select 1
    from storage.objects o
    where o.bucket_id = 'profile-photos'
      and o.owner = auth.uid()
      and o.created_at > now() - interval '5 seconds'
  );
$$;

grant execute on function public.profile_photo_upload_allowed() to authenticated;

-- ── 2. Prefix-scoped policies ───────────────────────────────────────────
drop policy if exists "profile_photos_insert_scoped" on storage.objects;
drop policy if exists "profile_photos_update_scoped" on storage.objects;
drop policy if exists "profile_photos_delete_scoped" on storage.objects;

create policy "profile_photos_insert_scoped"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (
      (
        (storage.foldername(name))[1] in ('avatars', 'leads')
        and (storage.foldername(name))[2] = auth.uid()::text
      )
      or public.my_role() in ('manager', 'superadmin')
    )
    and public.profile_photo_upload_allowed()
  );

create policy "profile_photos_update_scoped"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and (
      (
        (storage.foldername(name))[1] in ('avatars', 'leads')
        and (storage.foldername(name))[2] = auth.uid()::text
      )
      or public.my_role() in ('manager', 'superadmin')
    )
  )
  with check (
    bucket_id = 'profile-photos'
    and (
      (
        (storage.foldername(name))[1] in ('avatars', 'leads')
        and (storage.foldername(name))[2] = auth.uid()::text
      )
      or public.my_role() in ('manager', 'superadmin')
    )
  );

create policy "profile_photos_delete_scoped"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and (
      (
        (storage.foldername(name))[1] in ('avatars', 'leads')
        and (storage.foldername(name))[2] = auth.uid()::text
      )
      or public.my_role() in ('manager', 'superadmin')
    )
  );
