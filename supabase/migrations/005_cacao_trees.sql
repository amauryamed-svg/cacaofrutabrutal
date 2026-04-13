-- ═══════════════════════════════════════════════════════════════════
-- CAUA Corporation — Cacao Trees + Tree Updates
-- Migration 005 · Cacao Fruta Brutal gamification module
-- ═══════════════════════════════════════════════════════════════════

-- ── Cacao Trees ────────────────────────────────────────────────────
create table if not exists cacao_trees (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  guardian_id         int  not null check (guardian_id between 0 and 4),
  -- 0=Lucho/Huila, 1=Masmela/Arauca, 2=Rafael/Arbeláez, 3=Coy/Meta, 4=Ricardo/Santander
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

-- ── Tree Updates (feed written by Python microservice) ──────────────
create table if not exists tree_updates (
  id           uuid primary key default gen_random_uuid(),
  tree_id      uuid not null references cacao_trees(id) on delete cascade,
  update_type  text not null check (update_type in ('climate','stage_change','harvest_prediction','co2_update')),
  message      text not null,
  climate_data jsonb,
  created_at   timestamptz not null default now()
);

-- ── RLS ────────────────────────────────────────────────────────────
alter table cacao_trees   enable row level security;
alter table tree_updates  enable row level security;

-- cacao_trees: users own their trees; founders read all
create policy "trees_own_select" on cacao_trees
  for select using (
    auth.uid() = user_id
    or auth.uid() in (
      select user_id from user_profiles where caua_role = 'founder'
    )
  );
create policy "trees_own_insert" on cacao_trees
  for insert with check (auth.uid() = user_id);
create policy "trees_own_update" on cacao_trees
  for update using (auth.uid() = user_id);

-- tree_updates: readable by tree owner; Python service writes via service_role key (bypasses RLS)
create policy "updates_owner_select" on tree_updates
  for select using (
    auth.uid() in (
      select user_id from cacao_trees where id = tree_updates.tree_id
    )
  );
-- No insert policy here — Python microservice uses service_role key, which bypasses RLS
-- Founder read-all
create policy "updates_founder_select" on tree_updates
  for select using (
    auth.uid() in (
      select user_id from user_profiles where caua_role = 'founder'
    )
  );

-- ── Indexes ────────────────────────────────────────────────────────
create index if not exists idx_cacao_trees_user_id    on cacao_trees(user_id);
create index if not exists idx_cacao_trees_stage       on cacao_trees(stage);
create index if not exists idx_tree_updates_tree_id    on tree_updates(tree_id);
create index if not exists idx_tree_updates_created_at on tree_updates(created_at desc);
