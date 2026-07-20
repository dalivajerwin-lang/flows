-- 018: Consultants only see broadcasts sent after their account was created.
--
-- Problem: broadcasts_read exposed every historical broadcast to every
-- authenticated user, so a newly created account was forced to acknowledge
-- the full backlog on first login (docs/problems.md).
--
-- Rule: consultants read only broadcasts with created_at >= their profile's
-- created_at. Managers/superadmin still read everything — the broadcast
-- history dialog (read receipts) needs the full list.

drop policy if exists "broadcasts_read" on public.broadcasts;
create policy "broadcasts_read" on public.broadcasts for select using (
  auth.uid() is not null
  and (
    public.my_role() in ('manager', 'superadmin')
    or created_at >= (select created_at from public.profiles where id = auth.uid())
  )
);
