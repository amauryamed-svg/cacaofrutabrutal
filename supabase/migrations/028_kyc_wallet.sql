-- 028 — KYC + wallet linking + sanctions screening + SIWE replay protection
-- Implements Phase 2 of the Web3 transformation (see docs/WEB3.md, docs/KYC.md, docs/COMPLIANCE.md).
-- Adds: KYC fields + wallet binding to user_profiles, sanctions_screenings ledger,
-- ofac_blocklist (cron-pulled SDN), wallet_link_nonces (5-min TTL replay protection).

-- ─── user_profiles extensions ────────────────────────────────────────────────

alter table public.user_profiles
  add column if not exists country         text,
  add column if not exists kyc_status      text default 'none'
                            check (kyc_status in
                              ('none','pending','verified','failed','blocked','paused_review')),
  add column if not exists kyc_tier        smallint default 0
                            check (kyc_tier between 0 and 3),
  add column if not exists kyc_verified_at timestamptz,
  add column if not exists kyc_provider_id text,
  add column if not exists wallet_address  text,
  add column if not exists wallet_chain_id integer,
  add column if not exists geo_blocked     boolean default false;

create unique index if not exists uniq_user_profiles_wallet_address
  on public.user_profiles (lower(wallet_address))
  where wallet_address is not null;

create index if not exists idx_user_profiles_kyc_status
  on public.user_profiles (kyc_status)
  where kyc_status <> 'none';

-- ─── sanctions_screenings ───────────────────────────────────────────────────
-- Append-only audit log. One row per Chainalysis or OFAC pre-write check.

create table if not exists public.sanctions_screenings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,
  wallet_address  text,
  provider        text not null check (provider in ('chainalysis','ofac','manual')),
  verdict         text not null check (verdict in
                    ('green','flagged_for_review','blocked_chainalysis','blocked_ofac','blocked_manual')),
  payload         jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists idx_sanctions_wallet on public.sanctions_screenings (lower(wallet_address));
create index if not exists idx_sanctions_user   on public.sanctions_screenings (user_id);
create index if not exists idx_sanctions_recent on public.sanctions_screenings (created_at desc);

-- ─── ofac_blocklist ──────────────────────────────────────────────────────────
-- Cron-pulled SDN crypto addresses. Public read, founder-only write.

create table if not exists public.ofac_blocklist (
  address     text primary key,
  list_type   text not null,
  added_at    timestamptz not null default now(),
  removed_at  timestamptz,
  source_url  text not null
);

create index if not exists idx_ofac_active on public.ofac_blocklist (address)
  where removed_at is null;

-- ─── wallet_link_nonces ─────────────────────────────────────────────────────
-- SIWE replay protection. 5-minute TTL.

create table if not exists public.wallet_link_nonces (
  nonce           text primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  wallet_address  text,
  expires_at      timestamptz not null default (now() + interval '5 minutes'),
  consumed_at     timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_nonces_user_expiry
  on public.wallet_link_nonces (user_id, expires_at);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.sanctions_screenings enable row level security;
alter table public.wallet_link_nonces   enable row level security;
alter table public.ofac_blocklist       enable row level security;

-- Sanctions screenings: user reads own; founders read all.
drop policy if exists "user_reads_own_screenings" on public.sanctions_screenings;
create policy "user_reads_own_screenings" on public.sanctions_screenings
  for select using (
    user_id = (select auth.uid())
    or (select auth.uid()) in (
      select user_id from public.user_profiles where caua_role = 'founder'
    )
  );

-- Wallet link nonces: user reads own (so frontend can check expiry).
drop policy if exists "user_reads_own_nonces" on public.wallet_link_nonces;
create policy "user_reads_own_nonces" on public.wallet_link_nonces
  for select using (user_id = (select auth.uid()));

-- OFAC blocklist: public read (Treasury data is public).
drop policy if exists "public_read_ofac" on public.ofac_blocklist;
create policy "public_read_ofac" on public.ofac_blocklist
  for select using (true);

-- All writes happen via Edge Functions with service_role (bypasses RLS).

-- ─── Cleanup helper for expired nonces ──────────────────────────────────────
-- Run via pg_cron every hour: select public.cleanup_expired_nonces();

create or replace function public.cleanup_expired_nonces()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.wallet_link_nonces
  where expires_at < now() - interval '1 hour';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- ─── Documentation comments ─────────────────────────────────────────────────

comment on column public.user_profiles.country is
  'ISO 3166-1 alpha-2 country code captured during KYC. Used for geo-block enforcement.';
comment on column public.user_profiles.kyc_status is
  'KYC lifecycle state. ''verified'' is required for mint/redeem/adopt-with-crypto.';
comment on column public.user_profiles.kyc_tier is
  'Tier 0=anonymous (no mint), 1=basic ($1k cap), 2=enhanced ($10k cap), 3=investor (no cap). See docs/KYC.md.';
comment on column public.user_profiles.kyc_provider_id is
  'Persona inquiry_id. Reference for re-fetch / re-verification.';
comment on column public.user_profiles.wallet_address is
  'EVM address linked via SIWE. Lowercase recommended for case-insensitive uniqueness.';
comment on column public.user_profiles.wallet_chain_id is
  'EIP-155 chain id. Default 8453 (Base mainnet) per CauaCore §10.';
comment on column public.user_profiles.geo_blocked is
  'Set true if user country in GEO_BLOCKED_COUNTRIES. Hard block on any write op.';

comment on table public.sanctions_screenings is
  'Append-only audit log of pre-write screenings. See docs/COMPLIANCE.md.';
comment on table public.ofac_blocklist is
  'OFAC SDN crypto addresses. Cron-pulled every 6h. removed_at set when delisted (audit trail).';
comment on table public.wallet_link_nonces is
  'SIWE single-use nonces with 5-min TTL. Consumed on successful link.';
