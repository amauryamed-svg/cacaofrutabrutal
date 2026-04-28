-- 033 — CauaBonga P2E farming-sim — plots, plantings, harvests, soil history,
--       daily quests, action log, mint nonces, weekly attestations + atomic harvest RPC.
-- Phase 8 of the CauaCorp digital twin. Authored to match
-- .octogent/tentacles/cauabonga/architecture.md §2 (DDL is the source of truth).
-- Companion docs: GDD.md, economy.md, systems-map.md in the same tentacle.
--
-- MVP scope (per GDD §19): off-chain plot only — `cauabonga_mint_nonces` and
-- `cauabonga_weekly_attestations` ship empty in 033 so post-MVP NFT wiring is
-- a no-op schema-wise; only the Edge Function + contract deploy remain to add.

-- ─── 2.1 cauabonga_plots ──────────────────────────────────────────
-- The PlotNFT mirror in Postgres. One row per minted plot. Off-chain is
-- authoritative for play; on-chain attributes are weekly rollups.

create table if not exists public.cauabonga_plots (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  guardian_id         smallint not null references public.guardians(id),
  -- On-chain anchor (null until mint-cauabonga-plot Edge Function confirms tx)
  nft_token_id        bigint unique,
  nft_chain_id        int,
  nft_contract        text,
  -- Plot attributes — single source of truth post-mint, mirrors NFT attributes
  soil_tier           smallint not null default 1
                       check (soil_tier between 1 and 5),
  rarity              text not null default 'common'
                       check (rarity in ('common','rare','epic','legendary')),
  tile_count          smallint not null default 9
                       check (tile_count in (9, 13, 17, 21, 25)),  -- discrete unlock tiers per GDD §6
  -- Aggregate state (kept by triggers from the plantings table)
  avg_soil_health     numeric(5,2) not null default 75,
  regen_streak_days   int not null default 0,
  total_harvests      int not null default 0,
  last_attested_week  int,                            -- last week_index posted on-chain
  -- Bookkeeping
  state               text not null default 'active'
                       check (state in ('active','infertile','paused')),
  infertile_until     timestamptz,                    -- 60-day cooldown end if state='infertile'
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create unique index if not exists uniq_cauabonga_plot_per_finca_per_user
  on public.cauabonga_plots (user_id, guardian_id)
  where state <> 'paused';                            -- v1 cap: 1 active plot/finca/user
create index if not exists idx_cauabonga_plots_user      on public.cauabonga_plots (user_id);
create index if not exists idx_cauabonga_plots_guardian  on public.cauabonga_plots (guardian_id);
create index if not exists idx_cauabonga_plots_attest    on public.cauabonga_plots (last_attested_week)
  where state = 'active';

-- ─── 2.2 cauabonga_plantings ──────────────────────────────────────
-- One row per (plot_id, tile_idx) for the lifetime of the plot. Tile rows are
-- pre-created at plot mint time (all state='empty') so the play hot path is
-- update-only. Trade: 25 inserts at mint (rare) saves 25 inserts per planting.

create table if not exists public.cauabonga_plantings (
  id                  uuid primary key default gen_random_uuid(),
  plot_id             uuid not null references public.cauabonga_plots(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  tile_idx            smallint not null check (tile_idx between 0 and 24),
  -- State machine (GDD §6)
  state               text not null default 'empty'
                       check (state in ('empty','seeded','growing','ready','fallow','infertile')),
  -- Crop info (null when state='empty')
  crop_slug           text,                          -- 'cacao_criollo','platano_dominico',...
  mode                text check (mode in ('regen','traditional')),
  planted_at          timestamptz,
  ready_at            timestamptz,                    -- when state transitions to 'ready'
  fallow_until        timestamptz,                    -- when state transitions back to 'empty'
  -- Per-tile soil
  soil_health         smallint not null default 75
                       check (soil_health between 0 and 100),
  -- Care state — last-N timestamps (used by yield formula + cooldown checks)
  last_water_at       timestamptz,
  last_sun_at         timestamptz,
  last_nutrient_at    timestamptz,
  last_pruning_at     timestamptz,
  care_actions_count  smallint not null default 0,   -- per-cycle counter, reset on harvest
  -- Tile upgrades (permanent)
  has_mulch_ring      boolean not null default false,
  has_drip_irrigation boolean not null default false,
  -- Audit
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create unique index if not exists uniq_cauabonga_plantings_plot_tile
  on public.cauabonga_plantings (plot_id, tile_idx);
create index if not exists idx_cauabonga_plantings_user_state
  on public.cauabonga_plantings (user_id, state);
create index if not exists idx_cauabonga_plantings_ready_at
  on public.cauabonga_plantings (ready_at)
  where state = 'growing';                            -- partial index for tick cron
create index if not exists idx_cauabonga_plantings_fallow_until
  on public.cauabonga_plantings (fallow_until)
  where state = 'fallow';

-- ─── 2.3 cauabonga_harvests ───────────────────────────────────────
-- Append-only audit ledger. Every yield calculation logged so support can
-- replay any dispute. Pairs 1:1 with a token_events row (token_event_id).

create table if not exists public.cauabonga_harvests (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  plot_id             uuid not null references public.cauabonga_plots(id) on delete cascade,
  planting_id         uuid not null references public.cauabonga_plantings(id) on delete cascade,
  tile_idx            smallint not null,
  cycle_n             int not null,                   -- which harvest of this tile (1, 2, 3, ...)
  crop_slug           text not null,
  mode                text not null check (mode in ('regen','traditional')),
  -- Yield breakdown — exact same math the Edge Function ran
  base_yield          numeric(8,2) not null,
  regen_mult          numeric(4,2) not null,
  soil_mult           numeric(4,2) not null,
  companion_mult      numeric(4,2) not null,
  regional_mod        numeric(4,2) not null,
  streak_bonus        numeric(4,2) not null,
  diminishing_mult    numeric(4,2) not null default 1.00,  -- §6 anti-grind
  yield_mz            numeric(8,2) not null,           -- final mazorca count credited
  -- Soil delta applied this harvest
  soil_before         smallint not null,
  soil_after          smallint not null,
  -- Cross-audit ref into the token_events ledger
  token_event_id      uuid references public.token_events(id),
  harvested_at        timestamptz not null default now()
);

create index if not exists idx_cauabonga_harvests_user_at on public.cauabonga_harvests (user_id, harvested_at desc);
create index if not exists idx_cauabonga_harvests_plot    on public.cauabonga_harvests (plot_id, harvested_at desc);
-- Daily-cap query support — full index on (user_id, harvested_at) since
-- partial-index predicates can't reference now(). The 24h-window query uses
-- `where harvested_at > now() - interval '24 hours'` which the index supports.
create index if not exists idx_cauabonga_harvests_user_recent on public.cauabonga_harvests (user_id, harvested_at);

-- ─── 2.4 cauabonga_soil_history ───────────────────────────────────
-- Append-only soil delta ledger. Every mutation logged for educational
-- compare-view UI ("here's how regen built your soil over 30 days") and
-- for forensic replay.

create table if not exists public.cauabonga_soil_history (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  plot_id       uuid not null references public.cauabonga_plots(id) on delete cascade,
  planting_id   uuid references public.cauabonga_plantings(id) on delete cascade,
  tile_idx      smallint,
  reason        text not null
                 check (reason in (
                   'regen_harvest_companion','regen_harvest_solo','traditional_harvest',
                   'monocultivo_penalty','fallow_day','pest_event','idle_decay',
                   'mulch_upgrade','soil_restore_burn','plot_mint','other'
                 )),
  delta         smallint not null,                    -- can be negative
  soil_before   smallint not null,
  soil_after    smallint not null,
  applied_at    timestamptz not null default now()
);

create index if not exists idx_cauabonga_soil_history_plot_at
  on public.cauabonga_soil_history (plot_id, applied_at desc);
create index if not exists idx_cauabonga_soil_history_user_at
  on public.cauabonga_soil_history (user_id, applied_at desc);

-- ─── 2.5 cauabonga_mint_nonces (post-MVP, ships empty in 033) ─────
-- EIP-712 nonce per plot mint authorization. TTL 5min. Mirrors the
-- mazorca_burn_nonces / wallet_link_nonces pattern from CauaCore §10.

create table if not exists public.cauabonga_mint_nonces (
  nonce       text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  guardian_id smallint not null check (guardian_id between 0 and 4),
  expires_at  timestamptz not null default (now() + interval '5 minutes'),
  consumed_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists idx_cauabonga_mint_nonces_user_expiry
  on public.cauabonga_mint_nonces (user_id, expires_at);

-- ─── 2.5 cauabonga_daily_quests (MVP) ─────────────────────────────
-- 3 quests per day per user, refreshed at COL midnight by cauabonga-rotate-quests cron.

create table if not exists public.cauabonga_daily_quests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  quest_date    date not null,                        -- COL midnight
  slot          smallint not null check (slot in (0,1,2)),  -- easy/medium/hard
  template_id   text not null,                        -- 'q_plant_3_cacao', etc.
  params        jsonb not null default '{}'::jsonb,   -- target counts, finca filter, etc.
  reward_mz     int not null,
  state         text not null default 'open' check (state in ('open','complete','expired')),
  progress      int not null default 0,
  target        int not null,
  completed_at  timestamptz,
  created_at    timestamptz not null default now()
);

create unique index if not exists uniq_cauabonga_daily_quest_user_date_slot
  on public.cauabonga_daily_quests (user_id, quest_date, slot);
create index if not exists idx_cauabonga_daily_quests_user_state
  on public.cauabonga_daily_quests (user_id, state, quest_date);

-- ─── 2.5 cauabonga_action_log (MVP) ───────────────────────────────
-- Append-only every player action. Powers anti-degeneracy heuristics in §6.

create table if not exists public.cauabonga_action_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  plot_id       uuid references public.cauabonga_plots(id) on delete cascade,
  planting_id   uuid references public.cauabonga_plantings(id) on delete cascade,
  action        text not null check (action in ('plant','water','sun','nutrient','pruning','harvest','upgrade','restore')),
  client_meta   jsonb,                                 -- IP hash, UA fingerprint hash, captcha token id
  created_at    timestamptz not null default now()
);

create index if not exists idx_cauabonga_action_log_user_at
  on public.cauabonga_action_log (user_id, created_at desc);
create index if not exists idx_cauabonga_action_log_plot_at
  on public.cauabonga_action_log (plot_id, created_at desc);

-- ─── 2.5 cauabonga_weekly_attestations (post-MVP, ships empty in 033) ─
-- Per-NFT weekly rollup queued for on-chain post via attest-week scheduled fn.

create table if not exists public.cauabonga_weekly_attestations (
  id              uuid primary key default gen_random_uuid(),
  plot_id         uuid not null references public.cauabonga_plots(id) on delete cascade,
  nft_token_id    bigint not null,
  week_index      int not null,
  regen_streak    int not null,
  total_harvests  int not null,
  soil_summary_hash bytea not null,                   -- keccak256 of canonical(per-tile-soil JSON)
  status          text not null default 'queued'
                   check (status in ('queued','submitted','confirmed','failed')),
  tx_hash         text,
  computed_at     timestamptz not null default now(),
  confirmed_at    timestamptz,
  error_message   text
);

create unique index if not exists uniq_cauabonga_attest_token_week
  on public.cauabonga_weekly_attestations (nft_token_id, week_index);

-- ─── Triggers — keep updated_at fresh on plots + plantings ───────

create or replace function public.touch_cauabonga_plots_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_cb_plots_updated on public.cauabonga_plots;
create trigger trg_cb_plots_updated
  before update on public.cauabonga_plots
  for each row execute function public.touch_cauabonga_plots_updated_at();

create or replace function public.touch_cauabonga_plantings_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_cb_plantings_updated on public.cauabonga_plantings;
create trigger trg_cb_plantings_updated
  before update on public.cauabonga_plantings
  for each row execute function public.touch_cauabonga_plantings_updated_at();

-- ─── 2.6 RLS — pattern matches 032_iot_devices.sql ────────────────
-- All writes go through service_role (Edge Functions). No insert/update/delete
-- policies for authenticated role — clients never write directly. This is the
-- "frontend always filters .eq('user_id', userId), but RLS is the security layer"
-- pattern from CauaCore §8.

alter table public.cauabonga_plots                enable row level security;
alter table public.cauabonga_plantings            enable row level security;
alter table public.cauabonga_harvests             enable row level security;
alter table public.cauabonga_soil_history         enable row level security;
alter table public.cauabonga_mint_nonces          enable row level security;
alter table public.cauabonga_daily_quests         enable row level security;
alter table public.cauabonga_action_log           enable row level security;
alter table public.cauabonga_weekly_attestations  enable row level security;

-- User-owned tables: users read their own; founders read all.
drop policy if exists "user_reads_own_plots" on public.cauabonga_plots;
create policy "user_reads_own_plots" on public.cauabonga_plots
  for select using (
    user_id = (select auth.uid())
    or (select auth.uid()) in (select user_id from public.user_profiles where caua_role = 'founder')
  );

drop policy if exists "user_reads_own_plantings" on public.cauabonga_plantings;
create policy "user_reads_own_plantings" on public.cauabonga_plantings
  for select using (
    user_id = (select auth.uid())
    or (select auth.uid()) in (select user_id from public.user_profiles where caua_role = 'founder')
  );

drop policy if exists "user_reads_own_harvests" on public.cauabonga_harvests;
create policy "user_reads_own_harvests" on public.cauabonga_harvests
  for select using (
    user_id = (select auth.uid())
    or (select auth.uid()) in (select user_id from public.user_profiles where caua_role = 'founder')
  );

drop policy if exists "user_reads_own_soil_history" on public.cauabonga_soil_history;
create policy "user_reads_own_soil_history" on public.cauabonga_soil_history
  for select using (
    user_id = (select auth.uid())
    or (select auth.uid()) in (select user_id from public.user_profiles where caua_role = 'founder')
  );

drop policy if exists "user_reads_own_daily_quests" on public.cauabonga_daily_quests;
create policy "user_reads_own_daily_quests" on public.cauabonga_daily_quests
  for select using (
    user_id = (select auth.uid())
    or (select auth.uid()) in (select user_id from public.user_profiles where caua_role = 'founder')
  );

-- Mint nonces, action log: users can read their own (debugging/transparency).
drop policy if exists "user_reads_own_mint_nonces" on public.cauabonga_mint_nonces;
create policy "user_reads_own_mint_nonces" on public.cauabonga_mint_nonces
  for select using (user_id = (select auth.uid()));

drop policy if exists "user_reads_own_action_log" on public.cauabonga_action_log;
create policy "user_reads_own_action_log" on public.cauabonga_action_log
  for select using (
    user_id = (select auth.uid())
    or (select auth.uid()) in (select user_id from public.user_profiles where caua_role = 'founder')
  );

-- Weekly attestations are public (the data is on-chain anyway).
drop policy if exists "public_reads_attestations" on public.cauabonga_weekly_attestations;
create policy "public_reads_attestations" on public.cauabonga_weekly_attestations
  for select using (true);

-- ─── 2.7 apply_cauabonga_harvest — atomic harvest RPC ─────────────
-- Single transaction: lock planting, write soil_history, transition planting
-- to fallow, append token_events row, increment user_profiles balance, append
-- harvests audit row. Any failure rolls all of it back.
--
-- Called as supabase.rpc('apply_cauabonga_harvest', ...) by the
-- claim-cauabonga-harvest Edge Function running as service_role.

create or replace function public.apply_cauabonga_harvest(
  p_user_id          uuid,
  p_planting_id      uuid,
  p_yield_breakdown  jsonb,           -- full breakdown, persisted in cauabonga_harvests
  p_soil_delta       smallint,
  p_soil_reason      text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plot_id        uuid;
  v_tile_idx       smallint;
  v_soil_before    smallint;
  v_soil_after     smallint;
  v_yield_mz       numeric(8,2);
  v_harvest_id     uuid;
  v_token_event_id uuid;
  v_new_balance    numeric(12,2);
begin
  v_yield_mz := (p_yield_breakdown->>'yield_mz')::numeric;

  -- Lock the planting row — FOR UPDATE prevents double-claim race.
  select plot_id, tile_idx, soil_health
    into v_plot_id, v_tile_idx, v_soil_before
    from public.cauabonga_plantings
   where id = p_planting_id and user_id = p_user_id and state = 'ready'
   for update;

  if v_plot_id is null then
    raise exception 'planting_not_ready_or_unauthorized';
  end if;

  v_soil_after := greatest(0, least(100, v_soil_before + p_soil_delta));

  -- Soil history audit.
  insert into public.cauabonga_soil_history
    (user_id, plot_id, planting_id, tile_idx, reason, delta, soil_before, soil_after)
    values (p_user_id, v_plot_id, p_planting_id, v_tile_idx, p_soil_reason, p_soil_delta, v_soil_before, v_soil_after);

  -- Planting → fallow (regen: 1-day fallow) or back to empty (traditional: no fallow).
  update public.cauabonga_plantings
     set state              = 'fallow',
         soil_health        = v_soil_after,
         fallow_until       = case when (p_yield_breakdown->>'mode') = 'regen'
                                then now() + interval '1 day'
                                else now() end,
         care_actions_count = 0,
         updated_at         = now()
   where id = p_planting_id;

  -- Token event ledger row.
  insert into public.token_events(user_id, event_type, mazorcas, beans, ref_id)
    values (p_user_id, 'cauabonga_harvest', v_yield_mz, 0,
            format('plot:%s:tile:%s:cycle:%s', v_plot_id, v_tile_idx, p_yield_breakdown->>'cycle_n'))
    returning id into v_token_event_id;

  -- Player balance.
  update public.user_profiles
     set mazorcas_balance = mazorcas_balance + v_yield_mz
   where user_id = p_user_id
   returning mazorcas_balance into v_new_balance;

  -- Harvest audit ledger.
  insert into public.cauabonga_harvests(
    user_id, plot_id, planting_id, tile_idx, cycle_n, crop_slug, mode,
    base_yield, regen_mult, soil_mult, companion_mult, regional_mod, streak_bonus, diminishing_mult,
    yield_mz, soil_before, soil_after, token_event_id
  ) values (
    p_user_id, v_plot_id, p_planting_id, v_tile_idx,
    (p_yield_breakdown->>'cycle_n')::int,
    p_yield_breakdown->>'crop_slug',
    p_yield_breakdown->>'mode',
    (p_yield_breakdown->>'base_yield')::numeric,
    (p_yield_breakdown->>'regen_mult')::numeric,
    (p_yield_breakdown->>'soil_mult')::numeric,
    (p_yield_breakdown->>'companion_mult')::numeric,
    (p_yield_breakdown->>'regional_mod')::numeric,
    (p_yield_breakdown->>'streak_bonus')::numeric,
    (p_yield_breakdown->>'diminishing_mult')::numeric,
    v_yield_mz, v_soil_before, v_soil_after, v_token_event_id
  ) returning id into v_harvest_id;

  return jsonb_build_object(
    'harvest_id',   v_harvest_id,
    'yield_mz',     v_yield_mz,
    'new_balance',  v_new_balance,
    'soil_after',   v_soil_after,
    'fallow_until', (select fallow_until from public.cauabonga_plantings where id = p_planting_id)
  );
end;
$$;

revoke all  on function public.apply_cauabonga_harvest(uuid, uuid, jsonb, smallint, text) from public, anon, authenticated;
grant execute on function public.apply_cauabonga_harvest(uuid, uuid, jsonb, smallint, text) to service_role;

-- ─── Comments ─────────────────────────────────────────────────────

comment on table public.cauabonga_plots is
  'Player parcela inside a guardian finca. MVP is off-chain only; nft_token_id fills via mint-cauabonga-plot Edge Function post-MVP. See architecture.md §2.1, GDD §13.';
comment on column public.cauabonga_plots.tile_count is
  'Unlocked tiles. Discrete tiers 9/13/17/21/25 unlocked at levels 1/5/10/15/20/25 per GDD §6.';
comment on column public.cauabonga_plots.regen_streak_days is
  'Consecutive days where ALL active plantings on this plot are regen mode. Resets on the first traditional harvest. Drives Ricardo trazabilidad bonus per GDD §5.';
comment on column public.cauabonga_plots.last_attested_week is
  'Last ISO week_index posted on-chain via cauabonga-attest-week scheduled function. Null until first attestation.';

comment on table public.cauabonga_plantings is
  'Tile-level state machine. One row per (plot_id, tile_idx), pre-created at plot mint with state=empty. The play hot path is update-only.';
comment on column public.cauabonga_plantings.last_water_at is
  'Last water care action timestamp. Used by yield formula + cooldown checks. NULL means never watered this cycle.';

comment on table public.cauabonga_harvests is
  'Append-only yield audit. Pairs 1:1 with token_events row (token_event_id). Source of truth for /balance-check and the regen-vs-traditional educational chart.';

comment on table public.cauabonga_soil_history is
  'Append-only soil_health delta ledger. Frontend renders the regen-wins-long-term chart from this table. soil_before/soil_after denormalized so consumers don''t walk the ledger.';

comment on table public.cauabonga_mint_nonces is
  'Per-mint EIP-712 nonce, TTL 5min. Mirrors mazorca_burn_nonces. Empty in 033 — populated by mint-cauabonga-plot Edge Function post-MVP.';

comment on table public.cauabonga_daily_quests is
  '3 quests per user per day, refreshed at COL midnight by cauabonga-rotate-quests cron (architecture.md §8). Soft cap 200 mz/day per economy.md §6 — to be tuned to 120 by /balance-check.';

comment on table public.cauabonga_action_log is
  'Append-only per-action log. Powers anti-degeneracy heuristics (rate-limit, alt-account detection) per architecture.md §6.';

comment on table public.cauabonga_weekly_attestations is
  'Per-NFT weekly rollup queued for on-chain post via cauabonga-attest-week. Empty in 033 — wired post-MVP with PlotNFT contract deploy.';

comment on function public.apply_cauabonga_harvest(uuid, uuid, jsonb, smallint, text) is
  'Atomic harvest transaction: lock planting, write soil history, fallow planting, append token_events, update user balance, append harvest audit. service_role only. Any failure rolls back. See architecture.md §2.7.';
