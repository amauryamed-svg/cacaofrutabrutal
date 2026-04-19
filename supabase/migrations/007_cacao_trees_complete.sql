-- ═══════════════════════════════════════════════════════════════════
-- CAUA Corporation — Cacao Trees + Tree Updates + Complete RLS Setup
-- Migration 007: Consolidates trees schema with performance-optimized policies
-- Run this in Supabase SQL Editor or via migrations/
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. SECURITY DEFINER FUNCTION: Check if user is founder (cached)
-- ─────────────────────────────────────────────────────────────────
create or replace function is_founder_cached(user_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from user_profiles
    where user_id = user_uuid
      and caua_role = 'founder'
  );
$$;

-- ─────────────────────────────────────────────────────────────────
-- 2. CREATE CACAO TREES TABLE
-- ─────────────────────────────────────────────────────────────────
create table if not exists cacao_trees (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  guardian_id         int  not null check (guardian_id between 0 and 4),
  -- 0=Lucho/Huila, 1=Marta/Arauca, 2=Rafael/Cundinamarca, 3=Fernando/Meta, 4=Ricardo/Santander
  region              text not null,
  variety             text not null check (variety in ('Criollo','Trinitario','Forastero','Nacional')),
  stage               text not null default 'Semilla'
                      check (stage in ('Semilla','Plántula','Árbol Joven','Árbol Adulto','Cosecha')),
  adopted_at          timestamptz not null default now(),
  predicted_harvest_at timestamptz,
  co2_kg              numeric(10,3) not null default 0,
  last_update_at      timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────
-- 3. CREATE TREE UPDATES TABLE (feed entries)
-- ─────────────────────────────────────────────────────────────────
create table if not exists tree_updates (
  id           uuid primary key default gen_random_uuid(),
  tree_id      uuid not null references cacao_trees(id) on delete cascade,
  update_type  text not null check (update_type in ('climate','stage_change','harvest_prediction','co2_update')),
  message      text not null,
  climate_data jsonb,
  created_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────
-- 4. ENABLE RLS ON BOTH TABLES
-- ─────────────────────────────────────────────────────────────────
alter table cacao_trees   enable row level security;
alter table tree_updates  enable row level security;

-- ─────────────────────────────────────────────────────────────────
-- 5. DROP OLD POLICIES (if migrating from previous version)
-- ─────────────────────────────────────────────────────────────────
drop policy if exists "trees_own_select" on cacao_trees;
drop policy if exists "trees_own_insert" on cacao_trees;
drop policy if exists "trees_own_update" on cacao_trees;
drop policy if exists "updates_owner_select" on tree_updates;
drop policy if exists "updates_founder_select" on tree_updates;

-- ─────────────────────────────────────────────────────────────────
-- 6. RLS POLICIES FOR CACAO TREES
-- ─────────────────────────────────────────────────────────────────

-- Users can select their own trees, OR if they're a founder
drop policy if exists "trees_fast_select" on cacao_trees;
create policy "trees_fast_select" on cacao_trees
  for select using (
    user_id = (select auth.uid())
    or is_founder_cached(auth.uid())
  );

-- Users can only insert trees under their own user_id
drop policy if exists "trees_fast_insert" on cacao_trees;
create policy "trees_fast_insert" on cacao_trees
  for insert with check (
    user_id = (select auth.uid())
  );

-- Users can only update their own trees
drop policy if exists "trees_fast_update" on cacao_trees;
create policy "trees_fast_update" on cacao_trees
  for update using (
    user_id = (select auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────
-- 7. RLS POLICIES FOR TREE UPDATES (feed)
-- ─────────────────────────────────────────────────────────────────

-- Users can see updates for trees they own, OR if they're a founder
drop policy if exists "updates_owner_fast_select" on tree_updates;
create policy "updates_owner_fast_select" on tree_updates
  for select using (
    exists (
      select 1 from cacao_trees
      where cacao_trees.id = tree_updates.tree_id
        and cacao_trees.user_id = (select auth.uid())
    )
    or is_founder_cached(auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────
-- 8. PERFORMANCE INDEXES
-- ─────────────────────────────────────────────────────────────────

-- Fast user_id lookups (owner filter in select/update)
create index if not exists idx_cacao_trees_user_id_btree on cacao_trees using btree (user_id);

-- Fast stage filtering (gamification queries)
create index if not exists idx_cacao_trees_stage on cacao_trees(stage);

-- Fast tree update lookups (feed queries)
create index if not exists idx_tree_updates_tree_id on tree_updates(tree_id);

-- Fast recent-first ordering (feed display)
create index if not exists idx_tree_updates_created_at on tree_updates(created_at desc);

-- ─────────────────────────────────────────────────────────────────
-- 9. OPTIONAL: Enable pg_net for Edge Function notifications
-- ─────────────────────────────────────────────────────────────────
-- This allows Supabase Edge Functions to trigger via HTTP when trees grow
create extension if not exists "pg_net" schema extensions;

-- ═══════════════════════════════════════════════════════════════════
-- SUMMARY
-- ═══════════════════════════════════════════════════════════════════
-- ✓ Tables created: cacao_trees, tree_updates
-- ✓ RLS enabled with secure founder-aware policies
-- ✓ Indexes optimized for common queries
-- ✓ Function is_founder_cached() for O(1) founder checks
-- ✓ Ready for tree adoption gamification module
-- ═══════════════════════════════════════════════════════════════════
