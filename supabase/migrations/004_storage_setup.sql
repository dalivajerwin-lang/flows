-- Create buckets if they do not exist
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('broadcast-media', 'broadcast-media', false)
on conflict (id) do nothing;

-- Drop existing policies if they exist to avoid conflict
drop policy if exists "Allow authenticated CRUD on profile-photos" on storage.objects;
drop policy if exists "Allow authenticated CRUD on broadcast-media" on storage.objects;

-- Policies for profile-photos:
create policy "Allow authenticated CRUD on profile-photos"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'profile-photos')
  with check (bucket_id = 'profile-photos');

-- Policies for broadcast-media:
create policy "Allow authenticated CRUD on broadcast-media"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'broadcast-media')
  with check (bucket_id = 'broadcast-media');
