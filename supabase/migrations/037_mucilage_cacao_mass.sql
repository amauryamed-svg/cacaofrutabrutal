-- ═══════════════════════════════════════════════════════════════════
-- CAUA Corporation — Mucilage + Cacao mass resources
-- Migration 037 · Persistent harvest output (Phase 1 of Fruit-Ninja arc)
-- ═══════════════════════════════════════════════════════════════════
--
-- Adds two new player-facing resources that the harvest minigame fills
-- (mazorca slicing → mucílago drips into bottle + cacao beans into tank)
-- and the chocolate-making minigame consumes:
--
--   user_profiles.mucilage_g    → grams of mucilage carried by the user
--   user_profiles.cacao_mass_g  → grams of fermented cacao mass carried
--
-- Per-event tracking on token_events for traceability:
--   token_events.mucilage_g, .cacao_mass_g
--
-- Plus two atomic helpers:
--   public.increment_resources_atomic(user_id, mucilage, cacao_mass)
--   public.consume_resources_atomic(user_id, mucilage, cacao_mass) → bool
--     (returns false if balance insufficient — Edge Function aborts)
--
-- Also extends token_events.event_type CHECK to include:
--   'tree_compost_regen' (Phase 2.5 — Labranza machete regeneration bonus)
--   'chocolate_made'     (Phase 3+4 — chocolate-making minigame output)
--
-- Idempotent: ADD COLUMN IF NOT EXISTS / CREATE OR REPLACE FUNCTION /
-- DROP CONSTRAINT IF EXISTS + ADD CONSTRAINT with full updated list.

-- ── Columns ────────────────────────────────────────────────────────
alter table public.user_profiles
  add column if not exists mucilage_g    numeric(12,2) not null default 0,
  add column if not exists cacao_mass_g  numeric(12,2) not null default 0;

alter table public.token_events
  add column if not exists mucilage_g    numeric(12,2) not null default 0,
  add column if not exists cacao_mass_g  numeric(12,2) not null default 0;

-- ── Atomic increment (cosecha) ─────────────────────────────────────
create or replace function public.increment_resources_atomic(
  p_user_id    uuid,
  p_mucilage   numeric,
  p_cacao_mass numeric
) returns void
language plpgsql
security definer
set search_path = public as $$
begin
  update public.user_profiles
     set mucilage_g    = coalesce(mucilage_g, 0)    + coalesce(p_mucilage, 0),
         cacao_mass_g  = coalesce(cacao_mass_g, 0)  + coalesce(p_cacao_mass, 0)
   where user_id = p_user_id;
end $$;

comment on function public.increment_resources_atomic is
  'Adds mucilage_g + cacao_mass_g to user_profiles. Used by award-tokens '
  'when a harvest completes. Idempotent at the row level (UPDATE).';

-- ── Atomic consume (chocolate-making) ──────────────────────────────
-- Returns FALSE if the user doesn''t have enough resources to cover the
-- consumption — caller must NOT proceed with side-effects (mint NFT etc.).
-- FOR UPDATE locks the row to prevent races between concurrent consumes.
create or replace function public.consume_resources_atomic(
  p_user_id    uuid,
  p_mucilage   numeric,
  p_cacao_mass numeric
) returns boolean
language plpgsql
security definer
set search_path = public as $$
declare
  have_mucilage numeric;
  have_mass     numeric;
begin
  select mucilage_g, cacao_mass_g
    into have_mucilage, have_mass
    from public.user_profiles
   where user_id = p_user_id
     for update;

  if have_mucilage is null then return false; end if;
  if have_mucilage < coalesce(p_mucilage, 0)   then return false; end if;
  if have_mass     < coalesce(p_cacao_mass, 0) then return false; end if;

  update public.user_profiles
     set mucilage_g    = mucilage_g    - coalesce(p_mucilage, 0),
         cacao_mass_g  = cacao_mass_g  - coalesce(p_cacao_mass, 0)
   where user_id = p_user_id;

  return true;
end $$;

comment on function public.consume_resources_atomic is
  'Atomically debits mucilage_g + cacao_mass_g; returns false if balance '
  'insufficient. Used by chocolate-making before mint to guarantee no '
  'double-spend.';

-- ── token_events.event_type — extend with new types ────────────────
-- Migration 036 pinned the full list. We add 'tree_compost_regen' and
-- 'chocolate_made' here so Phase 2.5 and Phase 3+4 inserts don''t hit a
-- constraint violation.
alter table public.token_events
  drop constraint if exists token_events_event_type_check;

alter table public.token_events
  add constraint token_events_event_type_check check (
    event_type in (
      'ritual_draw', 'streak_7', 'streak_30',
      'purchase', 'lot',
      'blog_share', 'blog_read',
      'referral',
      'tree_adoption', 'tree_update_read', 'tree_harvest_share',
      'tree_death_burn',
      'tree_compost_regen',
      'chocolate_made'
    )
  );

-- RLS: las columnas heredan la policy de la tabla; sin cambios.
