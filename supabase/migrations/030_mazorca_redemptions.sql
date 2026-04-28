-- 030 — Mazorca → $CACAO redemption ledger + nonce store
-- Phase 4 of the Web3 transformation. See docs/WEB3.md, contracts/src/MazorcaRedemption.sol.
--
-- Off-chain server (sign-mazorca-burn Edge Function):
--   1. Atomically decrement user_profiles.mazorcas_balance by mazorcaCount.
--   2. Insert a token_events row with negative mazorcas (audit trail).
--   3. Insert mazorca_redemptions row (status='signed').
--   4. Insert mazorca_burn_nonces row (TTL = deadline).
--   5. Return EIP-712 signed payload to frontend.
--
-- On-chain contract (MazorcaRedemption.claim):
--   - Verifies signature
--   - Marks nonce consumed
--   - Mints $CACAO at rate
--
-- Webhook / cron flips status:
--   signed → claimed     (Alchemy webhook on `Claimed` event, Phase 4 followup)
--   signed → expired     (cron after deadline)
--   expired → refunded   (refund-expired-redemption Edge Function, idempotent)

create table if not exists public.mazorca_redemptions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  wallet_address  text not null,
  mazorca_count   bigint not null check (mazorca_count > 0),
  cacao_amount_wei numeric(78, 0),
  rate_at_sign    bigint not null,             -- mazorcasPerToken at moment of signing
  nonce           text not null unique,
  deadline        timestamptz not null,
  signature       text,                          -- raw EIP-712 sig hex
  signed_at       timestamptz not null default now(),
  status          text not null default 'signed'
                   check (status in ('signed','submitted','claimed','expired','refunded','failed')),
  tx_hash         text,
  claimed_at      timestamptz,
  refunded_at     timestamptz,
  error_message   text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_redemptions_user      on public.mazorca_redemptions (user_id);
create index if not exists idx_redemptions_status    on public.mazorca_redemptions (status);
create index if not exists idx_redemptions_deadline  on public.mazorca_redemptions (deadline);
create index if not exists idx_redemptions_recent    on public.mazorca_redemptions (created_at desc);

create unique index if not exists uniq_redemptions_tx
  on public.mazorca_redemptions (lower(tx_hash))
  where tx_hash is not null;

-- Single-use nonces (server-side mirror of on-chain consumedNonces map).
create table if not exists public.mazorca_burn_nonces (
  nonce         text primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  redemption_id uuid not null references public.mazorca_redemptions(id) on delete cascade,
  expires_at    timestamptz not null,
  consumed_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists idx_mazorca_nonces_user_expiry
  on public.mazorca_burn_nonces (user_id, expires_at);

-- ─── RLS ──────────────────────────────────────────────────────────────

alter table public.mazorca_redemptions enable row level security;
alter table public.mazorca_burn_nonces enable row level security;

drop policy if exists "user_reads_own_redemptions" on public.mazorca_redemptions;
create policy "user_reads_own_redemptions" on public.mazorca_redemptions
  for select using (
    user_id = (select auth.uid())
    or (select auth.uid()) in (
      select user_id from public.user_profiles where caua_role = 'founder'
    )
  );

drop policy if exists "user_reads_own_mazorca_nonces" on public.mazorca_burn_nonces;
create policy "user_reads_own_mazorca_nonces" on public.mazorca_burn_nonces
  for select using (user_id = (select auth.uid()));

-- All writes via Edge Functions with service_role (bypass RLS).

-- ─── Helpers ──────────────────────────────────────────────────────────

-- Atomic decrement — returns the new balance, or NULL if insufficient.
-- Used by sign-mazorca-burn Edge Function.
create or replace function public.decrement_mazorcas_atomic(
  p_user_id uuid,
  p_amount  bigint
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_balance numeric;
begin
  update public.user_profiles
     set mazorcas_balance = mazorcas_balance - p_amount
   where user_id = p_user_id
     and mazorcas_balance >= p_amount
  returning mazorcas_balance into v_new_balance;
  return v_new_balance;
end;
$$;

-- Atomic refund — returns new balance after restoring the mazorcas.
create or replace function public.refund_mazorcas_atomic(
  p_user_id uuid,
  p_amount  bigint
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_balance numeric;
begin
  update public.user_profiles
     set mazorcas_balance = mazorcas_balance + p_amount
   where user_id = p_user_id
  returning mazorcas_balance into v_new_balance;
  return v_new_balance;
end;
$$;

-- Cron-callable cleanup. Run hourly in pg_cron:
--   select cron.schedule('expire_mazorca_redemptions', '*/15 * * * *',
--                        $$select public.expire_mazorca_redemptions()$$);
create or replace function public.expire_mazorca_redemptions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_count integer;
begin
  update public.mazorca_redemptions
     set status = 'expired'
   where status = 'signed'
     and deadline < now();
  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$;

-- ─── Comments ────────────────────────────────────────────────────────

comment on table public.mazorca_redemptions is
  'Off-chain ledger of mazorca → $CACAO redemptions. Mirrors on-chain MazorcaRedemption events.';
comment on column public.mazorca_redemptions.cacao_amount_wei is
  'Amount of $CACAO (18-decimal wei) the user is entitled to upon successful claim.';
comment on column public.mazorca_redemptions.rate_at_sign is
  'mazorcasPerToken from contract at signing time. Locked in even if rate changes later.';
comment on table public.mazorca_burn_nonces is
  'Server-side mirror of on-chain consumedNonces. Defense in depth — also enforced in MazorcaRedemption.sol.';
comment on function public.decrement_mazorcas_atomic is
  'Atomic balance decrement. Returns NULL on insufficient balance — caller MUST check before signing.';
