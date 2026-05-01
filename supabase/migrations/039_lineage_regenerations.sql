-- ═══════════════════════════════════════════════════════════════════
-- CAUA Corporation — Lineage regenerations
-- Migration 039 · Phase 2.5 of the Fruit-Ninja arc
-- ═══════════════════════════════════════════════════════════════════
--
-- Closes the regenerative loop: when a user slices a dead tree in the
-- Labranza machete arena, the dead biomass returns to the soil AND a
-- "lineage_regeneration" record is minted for the same guardian. The
-- record has a 7-day TTL and surfaces as a "🌱 Lineage regenerado"
-- badge on the matching guardian card in Adoptar.
--
-- Reward path (in `award-tokens` Edge Function, extended in this PR):
--   - Insert token_event (event_type='tree_compost_regen', +10 beans)
--   - Insert lineage_regenerations row (expires_at = now() + 7 days)
--   - Update user_profiles.beans_balance + beans_lifetime
--
-- Future PR will extend the adoption flow to consume an unconsumed
-- regen record + apply discount. For now the badge is purely narrative.
--
-- Idempotent.

create table if not exists public.lineage_regenerations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  guardian_id int not null,
  source_tree_id uuid references public.cacao_trees(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  consumed_at timestamptz,
  consumed_tree_id uuid references public.cacao_trees(id) on delete set null
);

-- Active-regen lookups for Adoptar use this index.
create index if not exists idx_lineage_regen_user_active
  on public.lineage_regenerations(user_id, guardian_id)
  where consumed_at is null;

-- Reverse-lookup by source tree (for analytics).
create index if not exists idx_lineage_regen_source_tree
  on public.lineage_regenerations(source_tree_id);

alter table public.lineage_regenerations enable row level security;

-- Users see their own. Service role (Edge Function) bypasses RLS via key.
drop policy if exists lineage_regen_select_own on public.lineage_regenerations;
create policy lineage_regen_select_own
  on public.lineage_regenerations
  for select
  using ((select auth.uid()) = user_id);

comment on table public.lineage_regenerations is
  'Per-guardian regeneration records minted when a user slices a dead tree '
  'in the Labranza machete arena. 7-day TTL. consumed_at populated when an '
  'adoption flow uses the regen as a discount unlock.';
