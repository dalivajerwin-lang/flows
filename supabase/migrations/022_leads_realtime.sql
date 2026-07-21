-- 022: leads realtime — cross-client cache sync.
--
-- Deleting/updating a lead only invalidated the acting user's own React Query
-- cache; other logged-in sessions (e.g. a manager) kept showing stale leads
-- until a full reload (refetchOnWindowFocus is off). Publishing the leads
-- table lets clients subscribe and invalidate on any INSERT/UPDATE/DELETE.
--
-- RLS still governs what each subscriber may see: realtime respects the
-- leads select policies, so consultants only receive events for rows their
-- policies allow.
do $$
begin
  alter publication supabase_realtime add table public.leads;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
