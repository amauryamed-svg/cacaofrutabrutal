-- ═══════════════════════════════════════════════════════════════════
-- CAUA Corporation — Chocolate bars made (off-chain counter)
-- Migration 038 · Phase 3 of the Fruit-Ninja arc
-- ═══════════════════════════════════════════════════════════════════
--
-- Tracks how many chocolate bars the user has forged in the Lab minigame
-- (liofilizado · refinado · conchado). Off-chain counter for now — Phase 4
-- replaces this with on-chain RitualChocolateNFT.
--
-- The forge-chocolate Edge Function uses public.consume_resources_atomic
-- (defined in mig 037) to debit mucilage_g + cacao_mass_g, then increments
-- this counter + inserts a 'chocolate_made' token_event for ledger trace.
--
-- The 'chocolate_made' event_type was already whitelisted in mig 037 so no
-- check-constraint changes are needed here.

alter table public.user_profiles
  add column if not exists chocolate_bars_made integer not null default 0;

comment on column public.user_profiles.chocolate_bars_made is
  'Off-chain count of chocolate bars forged in the Lab minigame. '
  'Phase 4 will replace this with an on-chain RitualChocolateNFT mint.';

-- Per-event log table — mainly for the "my collection" view in the future
-- + analytics. Kept lightweight; no on-chain fields yet.
create table if not exists public.chocolate_forges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  forged_at timestamptz not null default now(),
  mucilage_consumed_g  numeric(12,2) not null,
  cacao_mass_consumed_g numeric(12,2) not null,
  -- Liofilizado / refinado / conchado completion timestamps for analytics.
  liofilizado_at timestamptz,
  refinado_at    timestamptz,
  conchado_at    timestamptz,
  -- Will populate in Phase 4 once the NFT mint flow lands.
  nft_token_id   bigint,
  nft_tx_hash    text,
  nft_minted_at  timestamptz
);

create index if not exists idx_chocolate_forges_user
  on public.chocolate_forges(user_id, forged_at desc);

alter table public.chocolate_forges enable row level security;

drop policy if exists chocolate_forges_select_own on public.chocolate_forges;
create policy chocolate_forges_select_own
  on public.chocolate_forges
  for select
  using ((select auth.uid()) = user_id);

comment on table public.chocolate_forges is
  'Per-forge log for the Lab minigame. Each row = one chocolate bar forged. '
  'mucilage_consumed_g + cacao_mass_consumed_g mirror the recipe constants '
  'in src/utils/constants.ts (chocolate_made: 300 + 250). NFT fields populate '
  'when Phase 4 RitualChocolateNFT mint lands.';
