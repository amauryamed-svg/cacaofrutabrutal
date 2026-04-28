-- 031 — Guardians table + payout wallets + adoption_charges
-- Phase 5 of the Web3 transformation. See docs/WEB3.md, contracts/src/TreeAdoption.sol.
--
-- The 5 Guardianes were previously hardcoded in src/utils/constants.ts:GUARDIANS.
-- This migration creates a structured table so Edge Functions + the on-chain
-- TreeAdoption split can both reference the same source of truth.
-- Charter principle I.1: Guardian split is paid in the same tx as adoption.

create table if not exists public.guardians (
  id              smallint primary key check (id between 0 and 4),
  name            text not null,
  region          text not null,
  town            text,
  payout_wallet   text,                            -- EVM address, lowercase
  payout_chain_id integer default 8453,            -- Base mainnet
  active          boolean not null default true,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index if not exists uniq_guardians_payout_wallet
  on public.guardians (lower(payout_wallet))
  where payout_wallet is not null;

-- Seed with the 5 known Guardianes (mirror src/utils/constants.ts:GUARDIANS).
insert into public.guardians (id, name, region, town) values
  (0, 'Lucho',    'Huila',        'Hobo'),
  (1, 'Marta',    'Arauca',       'Saravena'),
  (2, 'Rafael',   'Cundinamarca', 'Arbeláez'),
  (3, 'Fernando', 'Meta',         'Guamal'),
  (4, 'Ricardo',  'Santander',    'Landázuri')
on conflict (id) do nothing;

-- ─── Adoption charges ─────────────────────────────────────────────────
-- Mirror of on-chain `TreeAdopted` events + Coinbase Commerce charges.

create table if not exists public.adoption_charges (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete set null,
  tree_id          uuid references public.cacao_trees(id) on delete set null,
  guardian_id      smallint references public.guardians(id),
  buyer_wallet     text,
  asset            text,                            -- 'ETH' | '0x...USDC' | 'cbBTC' | 'fiat'
  amount_native    numeric(78, 0),                  -- raw smallest-unit (wei / unit)
  amount_usd_cents bigint,                          -- denormalised USD for analytics
  source           text not null
                    check (source in ('on_chain_eth','on_chain_token','coinbase_commerce','stripe')),
  tx_hash          text,
  charge_id        text,                            -- Coinbase Commerce charge id
  status           text not null default 'pending'
                    check (status in ('pending','submitted','confirmed','failed','refunded')),
  network          text default 'base',
  block_number     bigint,
  raw              jsonb,
  created_at       timestamptz not null default now(),
  confirmed_at     timestamptz
);

create index if not exists idx_adoption_charges_user      on public.adoption_charges (user_id);
create index if not exists idx_adoption_charges_tree      on public.adoption_charges (tree_id);
create index if not exists idx_adoption_charges_guardian  on public.adoption_charges (guardian_id);
create index if not exists idx_adoption_charges_status    on public.adoption_charges (status);
create unique index if not exists uniq_adoption_charges_tx
  on public.adoption_charges (lower(tx_hash))
  where tx_hash is not null;
create unique index if not exists uniq_adoption_charges_charge_id
  on public.adoption_charges (charge_id)
  where charge_id is not null;

-- ─── RLS ──────────────────────────────────────────────────────────────

alter table public.guardians         enable row level security;
alter table public.adoption_charges  enable row level security;

-- Public read of Guardian metadata (no PII, public ground truth).
drop policy if exists "public_read_guardians" on public.guardians;
create policy "public_read_guardians" on public.guardians
  for select using (true);

drop policy if exists "user_reads_own_charges" on public.adoption_charges;
create policy "user_reads_own_charges" on public.adoption_charges
  for select using (
    user_id = (select auth.uid())
    or (select auth.uid()) in (
      select user_id from public.user_profiles where caua_role = 'founder'
    )
  );

-- ─── updated_at trigger ───────────────────────────────────────────────

create or replace function public.touch_guardians_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists guardians_set_updated_at on public.guardians;
create trigger guardians_set_updated_at
  before update on public.guardians
  for each row execute function public.touch_guardians_updated_at();

-- ─── Comments ────────────────────────────────────────────────────────

comment on table public.guardians is
  'Five Guardianes (cultivators). Source of truth for guardian_id 0..4 used in cacao_trees and on-chain.';
comment on column public.guardians.payout_wallet is
  'EVM address that receives the 60% Guardian split from TreeAdoption.sol. Lowercase, validated client-side.';
comment on table public.adoption_charges is
  'Adoption payment ledger. on_chain_eth/on_chain_token rows come from alchemy-nft-webhook on TreeAdopted event; coinbase_commerce/stripe come from their respective webhooks.';
