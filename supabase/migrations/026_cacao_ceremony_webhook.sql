-- ─────────────────────────────────────────────────────────────────
-- 024 — Cacao Ceremony Phase 2 (shopify-webhook support)
-- Adds the helper RPC to match Shopify customer email → CFB user_id.
-- ─────────────────────────────────────────────────────────────────

-- Lookup auth.users by email (case-insensitive). SECURITY DEFINER
-- because auth.users is in the auth schema and only service_role
-- should resolve emails to user_ids.
create or replace function get_user_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = public, auth
as $$
  select id
    from auth.users
   where lower(email) = lower(p_email)
   limit 1;
$$;

revoke all on function get_user_id_by_email(text) from public;
grant execute on function get_user_id_by_email(text) to service_role;

-- Count of completed ceremony orders for a user — used to detect repeat buyers (Phase 3).
create or replace function get_user_ceremony_order_count(p_user_id uuid)
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int
    from cacao_ceremony_orders
   where user_id = p_user_id
     and status = 'paid';
$$;

grant execute on function get_user_ceremony_order_count(uuid) to authenticated, service_role;
