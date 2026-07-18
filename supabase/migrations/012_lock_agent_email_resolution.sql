-- ============================================================
-- 012_lock_agent_email_resolution.sql
-- resolve_agent_login_email was executable by anon, letting
-- anyone enumerate agent numbers and harvest staff emails.
-- Agent-number login now goes through the agent-login Edge
-- Function (service role, rate-limited, never returns the
-- email), so the RPC is no longer needed by any client.
-- ============================================================

drop function if exists public.resolve_agent_login_email(text);
