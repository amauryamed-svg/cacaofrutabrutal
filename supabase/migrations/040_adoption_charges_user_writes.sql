-- 040 — adoption_charges: allow authenticated users to insert + update their own pending rows
-- Phase 5 follow-up. Migration 031 created the table + SELECT policy but missed INSERT/UPDATE.
-- Without these policies the AdoptWithCryptoButton can't record a pending charge before signing,
-- which means alchemy-nft-webhook has no row to mark as 'confirmed' when TreeAdopted fires.

-- ─── INSERT: user creates their own pending charge ─────────────────────
drop policy if exists "user_inserts_own_charges" on public.adoption_charges;
create policy "user_inserts_own_charges" on public.adoption_charges
  for insert with check (
    user_id = (select auth.uid())
    and status = 'pending'
  );

-- ─── UPDATE: user updates their own row with tx_hash + status transitions ──
-- Allowed user-side transitions: pending→submitted (after wallet returns hash),
-- pending→failed (sign rejected). Final flip to 'confirmed' is server-only via
-- alchemy-nft-webhook (service_role bypasses RLS). 'refunded' is also server-only.
drop policy if exists "user_updates_own_pending_charges" on public.adoption_charges;
create policy "user_updates_own_pending_charges" on public.adoption_charges
  for update using (
    user_id = (select auth.uid())
    and status in ('pending', 'submitted')
  )
  with check (
    user_id = (select auth.uid())
    and status in ('pending', 'submitted', 'failed')
  );

comment on policy "user_inserts_own_charges" on public.adoption_charges is
  'Frontend AdoptWithCryptoButton inserts a pending charge before signing the on-chain tx. Status forced to pending.';
comment on policy "user_updates_own_pending_charges" on public.adoption_charges is
  'Frontend updates the row with tx_hash + status=submitted after the wallet returns the hash. The final confirmed flip is server-side via alchemy-nft-webhook.';
