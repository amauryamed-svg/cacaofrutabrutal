-- ═══════════════════════════════════════════════════════════════════
-- CAUA Corporation — Cacao Trees + Tree Updates + Performance RLS
-- Paste this ENTIRE block in your Supabase SQL Editor and click RUN
-- ═══════════════════════════════════════════════════════════════════

-- 1. Create the Cacao Trees base table
create table if not exists cacao_trees (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  guardian_id         int  not null check (guardian_id between 0 and 4),
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

-- 2. Create the Tree Updates events log (feed)
create table if not exists tree_updates (
  id           uuid primary key default gen_random_uuid(),
  tree_id      uuid not null references cacao_trees(id) on delete cascade,
  update_type  text not null check (update_type in ('climate','stage_change','harvest_prediction','co2_update')),
  message      text not null,
  climate_data jsonb,
  created_at   timestamptz not null default now()
);

-- 3. Enable RLS
alter table cacao_trees   enable row level security;
alter table tree_updates  enable row level security;

-- 4. Fast Policies for CACAO TREES
drop policy if exists "trees_own_select" on cacao_trees;
drop policy if exists "trees_own_insert" on cacao_trees;
drop policy if exists "trees_own_update" on cacao_trees;

create policy "trees_fast_select" on cacao_trees
  for select using (
    auth.uid() = user_id
    or is_founder_cached(auth.uid())
  );

create policy "trees_fast_insert" on cacao_trees
  for insert with check (auth.uid() = user_id);

create policy "trees_fast_update" on cacao_trees
  for update using (auth.uid() = user_id);

-- 5. Fast Policies for TREE UPDATES
create policy "updates_owner_fast_select" on tree_updates
  for select using (
    exists (
      select 1 from cacao_trees
      where cacao_trees.id = tree_updates.tree_id
        and cacao_trees.user_id = auth.uid()
    )
    or is_founder_cached(auth.uid())
  );

-- 6. Indexes for supersonic performance
create index if not exists idx_cacao_trees_user_id_btree on cacao_trees using btree (user_id);
create index if not exists idx_cacao_trees_stage on cacao_trees(stage);
create index if not exists idx_tree_updates_tree_id on tree_updates(tree_id);
create index if not exists idx_tree_updates_created_at on tree_updates(created_at desc);

-- 7. Add token triggers via HTTP if missing
-- (Ensures Supabase Edge Functions trigger for notifications when the tree grows) 
-- Ensure pg_net is enabled
create extension if not exists "pg_net" schema extensions;
