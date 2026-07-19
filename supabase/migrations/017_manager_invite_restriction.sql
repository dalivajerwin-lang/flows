-- ============================================================
-- 017_manager_invite_restriction.sql
-- Managers can only invite property consultants. Creating another
-- manager (by token or direct invite) is a superadmin-only power.
-- ============================================================

-- Token creation: managers may only mint consultant tokens; the
-- superadmin may mint either role. (Token redemption pins the role
-- server-side, so this closes the manager→manager path entirely.)
drop policy if exists "tokens_insert_manager" on public.registration_tokens;
create policy "tokens_insert_manager"
  on public.registration_tokens for insert
  with check (
    (public.my_role() = 'manager' and intended_role = 'property_consultant')
    or public.is_superadmin()
  );
