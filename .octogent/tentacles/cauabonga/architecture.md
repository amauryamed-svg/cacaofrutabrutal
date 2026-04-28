# CauaBonga — Master Architecture Document

> v0.1 · 2026-04-28 · Authored by `technical-director`. Source-of-truth for all CauaBonga implementation. Cross-links: [`GDD.md`](./GDD.md), [`economy.md`](./economy.md), [`CONTEXT.md`](./CONTEXT.md), [`/CLAUDE.md`](../../../CLAUDE.md) §10 Web3 No-Negociables, [`/docs/WEB3.md`](../../../docs/WEB3.md), [`/docs/COMPLIANCE.md`](../../../docs/COMPLIANCE.md), [`/docs/KYC.md`](../../../docs/KYC.md).

This document is the **technical blueprint that gates implementation**. No `cauabonga_*` migration, Edge Function, or Solidity contract ships before its design is grounded in this document and approved as an ADR. Items marked `[TBD]` block implementation of the affected component; items marked `[OPEN — non-blocking]` can ship with a default and revisit later.

---

## 1. Architecture overview

### 1.1 Block diagram

```
                           ┌──────────────────────────────────────┐
                           │           CLIENT (React 19)          │
                           │   src/pages/CauaBonga*.tsx           │
                           │   src/hooks/useCauaBongaPlots.ts     │
                           │   wagmi v2 + viem + RainbowKit       │
                           └──┬──────────────────┬────────────────┘
                              │ (1) JWT-bearing  │ (8) writeContract
                              │     fetch        │     (signed by user)
                              ▼                  ▼
   ┌─────────────────────────────────┐    ┌────────────────────────────┐
   │   SUPABASE EDGE FUNCTIONS       │    │  BASE / BASE SEPOLIA       │
   │  (Deno + viem, server-only key) │    │  Chain ID 8453 / 84532     │
   │                                 │    │                            │
   │  - mint-cauabonga-plot          │    │  CauaBongaPlot.sol  ◄──┐   │
   │  - claim-cauabonga-harvest      │    │  CacaoToken.sol        │   │
   │  - cauabonga-plant-seed         │    │  MazorcaRedemption.sol │   │
   │  - cauabonga-care-action        │    │  IoTAttestation.sol    │   │
   │  - cauabonga-rotate-quests      │    │  TreeAdoption.sol      │   │
   │    (cron, non-HTTP)             │    │                        │   │
   │  - cauabonga-tick-growth        │    │   ▲                    │   │
   │    (cron, non-HTTP)             │    │   │ (9) on-chain       │   │
   │  - cauabonga-attest-week        │    │   │     event          │   │
   │    (oracle weekly)              │    │   │                    │   │
   │  - award-tokens (existing)      │    │   │                    │   │
   └──┬─────────────────┬────────────┘    └───┼────────────────────┘   │
      │ (2) RLS         │ (5) relayer/        │                        │
      │     bypassed    │     oracle tx       │ (10) Alchemy           │
      │     (service    │     via             │      webhook           │
      │     role)       │     RELAYER_PK      │                        │
      ▼                 ▼                     ▼                        │
   ┌─────────────────────────────────┐    ┌────────────────────────┐   │
   │   SUPABASE POSTGRES             │    │  ALCHEMY NFT WEBHOOK   │   │
   │   (RLS-enforced, append-only    │    │  alchemy-nft-webhook   │   │
   │    audit logs)                  │    │  (existing pattern)    │   │
   │                                 │    └────────────┬───────────┘   │
   │  cauabonga_plots                │                 │ (11) sets     │
   │  cauabonga_plantings            │ ◄───────────────┘   nft_token_id│
   │  cauabonga_harvests             │                                  │
   │  cauabonga_soil_history         │                                  │
   │  cauabonga_mint_nonces          │                                  │
   │  cauabonga_daily_quests         │                                  │
   │  cauabonga_quest_progress       │                                  │
   │  cauabonga_action_log           │                                  │
   │  cauabonga_weekly_attestations  │                                  │
   │  user_profiles  (existing)      │                                  │
   │  token_events   (existing)      │                                  │
   └─────────────────────────────────┘                                  │
                              ▲                                        │
                              │ (3) read for                           │
                              │     metadata                           │
                              ▼                                        │
   ┌─────────────────────────────────┐                                 │
   │   IPFS / Pinata                  │                                │
   │   (metadata pin, image pin)      │ ◄──────────────────────────────┘
   │   tree-metadata Edge Function    │     (12) tokenURI fetched by
   │   pattern reused                  │          OpenSea / Zora
   └─────────────────────────────────┘
```

### 1.2 Data flow — typical harvest action

| Step | Actor              | Action                                                                           | Trust boundary |
|------|--------------------|----------------------------------------------------------------------------------|----------------|
| 1    | Client             | User taps a "ready" tile. POSTs `{ plot_id, tile_idx }` to `claim-cauabonga-harvest` with Supabase JWT in `Authorization: Bearer …`. | Untrusted input |
| 2    | Edge Function      | OPTIONS preflight responds 204 (per `feedback_edge_functions_cors.md`).          | —              |
| 3    | Edge Function      | `supabase.auth.getUser(token)` — verifies JWT (per `feedback_supabase_jwt_no_jose.md`). Resolves `user_id`. | Auth boundary  |
| 4    | Edge Function      | Service-role read: `cauabonga_plantings` row for tile, validates `state='ready'`, `now() ≥ ready_at`, owner = user_id. | RLS bypassed (server) |
| 5    | Edge Function      | Anti-bot: counts harvest claims in last 24h for this user; applies §6 diminishing-return curve. | Server-authoritative |
| 6    | Edge Function      | Calculates yield: `base × regen_mult × soil_mult × companion_mult × regional_mod × streak`. Reads `cauabonga_plots.soil_health` for tile, `guardians.id` for regional bonus. | Server-authoritative |
| 7    | Edge Function      | Daily-cap check: queries `token_events` for `event_type LIKE 'cauabonga_%'` in last 24h, rejects if cap (200 mz) hit. | Server-authoritative |
| 8    | Edge Function      | **Atomic transaction** (single `rpc` call, see §2.4): inserts `cauabonga_harvests`, updates `cauabonga_plantings.state='fallow'`, updates `cauabonga_plots.soil_health` per §9 GDD curve, inserts `cauabonga_soil_history` audit row, inserts `token_events` row, updates `user_profiles.mazorcas_balance`. | DB-atomic      |
| 9    | Edge Function      | Returns `{ yield_mz, new_balance, new_soil, fallow_until }` JSON.                | —              |
| 10   | Client             | Plays harvest animation (cacao→heart morph), updates HUD.                         | —              |
| 11   | (Async)            | Once per ISO-week, `cauabonga-attest-week` cron rolls up per-plot regen-streak + harvest count + soil-health hash → calls `CauaBongaPlot.attestWeekly(tokenId, ...)` via oracle key. ERC-4906 `MetadataUpdate` emitted. | On-chain commit |

**No on-chain write per harvest** — harvests are pure off-chain Postgres transactions. On-chain commitment happens weekly via the oracle attestation pattern (§9), mirroring `IoTAttestation.sol`. This decision is the single biggest architectural call in CauaBonga and follows directly from the GDD's "off-chain plot per-tile state, on-chain anchor" model and the gas/UX budget for an async farming-sim (a per-tile harvest costing ~$0.01 in gas would dwarf the mazorca yield).

### 1.3 What's reused, what's new

| Layer            | Reused (existing pattern)                                              | New (CauaBonga)                                          |
|------------------|-------------------------------------------------------------------------|----------------------------------------------------------|
| Auth             | Supabase JWT, `siwe-link-wallet`, `persona-webhook`                    | None                                                     |
| KYC / OFAC       | `user_profiles.kyc_verified_at`, `sanctions_screenings`, `siwe-link-wallet`, geo-block via `GEO_BLOCKED_COUNTRIES` | None — same gate                                         |
| Token ledger     | `token_events`, `user_profiles.mazorcas_balance`, `award-tokens`       | New `event_type` values per economy.md §10               |
| NFT pattern      | `CacaoTreeNFT.sol` (ERC-721 + Pausable + AccessControl + ERC-4906)     | `CauaBongaPlot.sol` (same scaffold + soulbound + attribute setter) |
| EIP-712 signer   | `MazorcaRedemption.sol` + `sign-mazorca-burn` Edge Function            | `mint-cauabonga-plot` Edge Function (same shape)         |
| Oracle attest    | `IoTAttestation.sol` + `post-iot-root` Edge Function (Merkle weekly)    | `cauabonga-attest-week` (per-token attribute attestation, not Merkle) |
| Nonce table      | `wallet_link_nonces`, `mazorca_burn_nonces`                            | `cauabonga_mint_nonces` (same shape, TTL 5min)           |
| Webhook          | `alchemy-nft-webhook` (cacao_trees → token_id mapping)                 | Extended to handle CauaBongaPlot Transfer events         |
| Metadata         | `tree-metadata` Edge Function (dynamic tokenURI)                       | `cauabonga-plot-metadata` Edge Function                  |

---

## 2. Database schema

Migration: `supabase/migrations/033_cauabonga_plots.sql` (next available number; verified `032_iot_devices.sql` is current head). All RLS policies use `(select auth.uid())` per CauaCore §8. All FKs to `auth.users(id)` and `public.user_profiles(user_id)` cascade-delete with the user.

### 2.1 `cauabonga_plots` — the player's parcel

The PlotNFT mirror in Postgres. One row per minted plot. Off-chain state is authoritative for per-tile play; on-chain attributes are weekly-rolled-up summaries.

```sql
create table public.cauabonga_plots (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  guardian_id         smallint not null
                       check (guardian_id between 0 and 4),
  -- on-chain anchor (null until mint-cauabonga-plot confirms tx)
  nft_token_id        bigint unique,
  nft_chain_id        int,
  nft_contract        text,
  -- plot attributes (mirror of NFT attributes — single source of truth post-mint)
  soil_tier           smallint not null default 1
                       check (soil_tier between 1 and 5),
  rarity              text not null default 'common'
                       check (rarity in ('common','rare','epic','legendary')),
  tile_count          smallint not null default 9
                       check (tile_count in (9, 13, 17, 21, 25)),
  -- aggregated state (sum-of-tiles, kept by triggers in §2.5)
  avg_soil_health     numeric(5,2) not null default 75,
  regen_streak_days   int not null default 0,
  total_harvests      int not null default 0,
  last_attested_week  int,                            -- last week_index posted on-chain
  -- bookkeeping
  state               text not null default 'active'
                       check (state in ('active','infertile','paused')),
  infertile_until     timestamptz,                    -- 60-day cooldown end if state='infertile'
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create unique index uniq_cauabonga_plot_per_finca_per_user
  on public.cauabonga_plots (user_id, guardian_id)
  where state <> 'paused';                            -- v1 cap: 1 active plot/finca/user

create index idx_cauabonga_plots_user      on public.cauabonga_plots (user_id);
create index idx_cauabonga_plots_guardian  on public.cauabonga_plots (guardian_id);
create index idx_cauabonga_plots_attest    on public.cauabonga_plots (last_attested_week)
  where state = 'active';
```

**Tile state lives in `cauabonga_plantings`, not here.** The plot row carries plot-wide aggregates only — per-tile soil/state lives in plantings. Rationale: write amplification. A care action that touches all 9 tiles writes 9 rows in plantings, but only 1 update on the plot summary (via trigger).

### 2.2 `cauabonga_plantings` — tile-level state machine

One row per `(plot_id, tile_idx)` for the lifetime of the plot. The state column drives the GDD §6 state machine.

```sql
create table public.cauabonga_plantings (
  id                  uuid primary key default gen_random_uuid(),
  plot_id             uuid not null references public.cauabonga_plots(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  tile_idx            smallint not null
                       check (tile_idx between 0 and 24),  -- 5×5 grid index
  -- state machine (GDD §6)
  state               text not null default 'empty'
                       check (state in ('empty','seeded','growing','ready','fallow','infertile')),
  -- crop info (null when state='empty')
  crop_slug           text,                          -- 'cacao_criollo','platano_dominico',...
  mode                text check (mode in ('regen','traditional')),
  planted_at          timestamptz,
  ready_at            timestamptz,                    -- when state transitions to 'ready'
  fallow_until        timestamptz,                    -- when state transitions back to 'empty'
  -- per-tile soil
  soil_health         smallint not null default 75
                       check (soil_health between 0 and 100),
  -- care state (last-N rolling, used by yield formula)
  last_water_at       timestamptz,
  last_sun_at         timestamptz,
  last_nutrient_at   timestamptz,
  last_pruning_at     timestamptz,
  care_actions_count  smallint not null default 0,   -- per-cycle counter, reset on harvest
  -- tile upgrades (permanent)
  has_mulch_ring      boolean not null default false,
  has_drip_irrigation boolean not null default false,
  -- audit
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create unique index uniq_cauabonga_plantings_plot_tile
  on public.cauabonga_plantings (plot_id, tile_idx);
create index idx_cauabonga_plantings_user_state
  on public.cauabonga_plantings (user_id, state);
create index idx_cauabonga_plantings_ready_at
  on public.cauabonga_plantings (ready_at)
  where state = 'growing';                            -- partial index for tick cron
create index idx_cauabonga_plantings_fallow_until
  on public.cauabonga_plantings (fallow_until)
  where state = 'fallow';
```

Tile rows are **created at plot mint time** (one row per tile, all `state='empty'`) so subsequent updates are touch-only — no INSERTs on the play hot path. This is a deliberate write-amplification trade: pay 25 inserts at mint (rare), save 25 inserts per planting (frequent).

### 2.3 `cauabonga_harvests` — per-harvest audit ledger

Append-only. Records every yield calculation server-side so support can replay any dispute.

```sql
create table public.cauabonga_harvests (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  plot_id             uuid not null references public.cauabonga_plots(id) on delete cascade,
  planting_id         uuid not null references public.cauabonga_plantings(id) on delete cascade,
  tile_idx            smallint not null,
  cycle_n             int not null,                   -- which harvest of this tile (1, 2, 3, ...)
  crop_slug           text not null,
  mode                text not null check (mode in ('regen','traditional')),
  -- yield breakdown (audit trail — exact same math the function ran)
  base_yield          numeric(8,2) not null,
  regen_mult          numeric(4,2) not null,
  soil_mult           numeric(4,2) not null,
  companion_mult      numeric(4,2) not null,
  regional_mod        numeric(4,2) not null,
  streak_bonus        numeric(4,2) not null,
  diminishing_mult    numeric(4,2) not null default 1.00,  -- §6 anti-grind
  yield_mz            numeric(8,2) not null,           -- final mazorca count credited
  -- soil delta applied
  soil_before         smallint not null,
  soil_after          smallint not null,
  -- ref into token_events for cross-audit
  token_event_id      uuid references public.token_events(id),
  harvested_at        timestamptz not null default now()
);

create index idx_cauabonga_harvests_user_at on public.cauabonga_harvests (user_id, harvested_at desc);
create index idx_cauabonga_harvests_plot     on public.cauabonga_harvests (plot_id, harvested_at desc);
create index idx_cauabonga_harvests_dailycap on public.cauabonga_harvests (user_id, harvested_at)
  where harvested_at > now() - interval '24 hours';   -- not allowed in PG; see §6 — replace with materialized view if needed
```

Note: Postgres does not allow `now()` in partial indexes. The actual implementation uses a regular index; the 24h-window query uses an explicit `where harvested_at > now() - interval '24 hours'` clause that the index supports. Documenting here so the engineer doesn't try to push `now()` into the partial-index predicate.

### 2.4 `cauabonga_soil_history` — soil delta audit trail

Append-only. Every soil mutation logged for educational compare-view UI ("here's how regen built your soil over 30 days") and for forensic replay.

```sql
create table public.cauabonga_soil_history (
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

create index idx_cauabonga_soil_history_plot_at
  on public.cauabonga_soil_history (plot_id, applied_at desc);
create index idx_cauabonga_soil_history_user_at
  on public.cauabonga_soil_history (user_id, applied_at desc);
```

### 2.5 Supporting tables (not the "4 core" but required)

| Table                            | Purpose                                                        | Required for           |
|----------------------------------|----------------------------------------------------------------|------------------------|
| `cauabonga_mint_nonces`          | EIP-712 nonce per plot mint authorization, TTL 5min            | Post-MVP (NFT mint)    |
| `cauabonga_daily_quests`         | Today's 3 quests per user, refreshed by cron                   | MVP                    |
| `cauabonga_quest_progress`       | Per-user-per-quest progress counters                           | MVP                    |
| `cauabonga_action_log`           | Append-only every player action (plant/water/sun/harvest), used by anti-degeneracy heuristics | MVP                    |
| `cauabonga_weekly_attestations`  | Per-token weekly rollup queued for on-chain post               | Post-MVP (NFT)         |

DDL for `cauabonga_mint_nonces` (mirrors `mazorca_burn_nonces` exactly):

```sql
create table public.cauabonga_mint_nonces (
  nonce       text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  guardian_id smallint not null check (guardian_id between 0 and 4),
  expires_at  timestamptz not null default (now() + interval '5 minutes'),
  consumed_at timestamptz,
  created_at  timestamptz not null default now()
);
create index idx_cauabonga_mint_nonces_user_expiry
  on public.cauabonga_mint_nonces (user_id, expires_at);
```

DDL for `cauabonga_daily_quests`:

```sql
create table public.cauabonga_daily_quests (
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
create unique index uniq_cauabonga_daily_quest_user_date_slot
  on public.cauabonga_daily_quests (user_id, quest_date, slot);
create index idx_cauabonga_daily_quests_user_state
  on public.cauabonga_daily_quests (user_id, state, quest_date);
```

DDL for `cauabonga_action_log`:

```sql
create table public.cauabonga_action_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  plot_id       uuid references public.cauabonga_plots(id) on delete cascade,
  planting_id   uuid references public.cauabonga_plantings(id) on delete cascade,
  action        text not null check (action in ('plant','water','sun','nutrient','pruning','harvest','upgrade','restore')),
  client_meta   jsonb,                                 -- IP hash, user-agent fingerprint hash, captcha token id
  created_at    timestamptz not null default now()
);
create index idx_cauabonga_action_log_user_at
  on public.cauabonga_action_log (user_id, created_at desc);
create index idx_cauabonga_action_log_plot_at
  on public.cauabonga_action_log (plot_id, created_at desc);
```

DDL for `cauabonga_weekly_attestations`:

```sql
create table public.cauabonga_weekly_attestations (
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
create unique index uniq_cauabonga_attest_token_week
  on public.cauabonga_weekly_attestations (nft_token_id, week_index);
```

### 2.6 RLS policies — pattern reference

All cauabonga tables enable RLS:

```sql
alter table public.cauabonga_plots             enable row level security;
alter table public.cauabonga_plantings         enable row level security;
alter table public.cauabonga_harvests          enable row level security;
alter table public.cauabonga_soil_history      enable row level security;
alter table public.cauabonga_mint_nonces       enable row level security;
alter table public.cauabonga_daily_quests      enable row level security;
alter table public.cauabonga_quest_progress    enable row level security;
alter table public.cauabonga_action_log        enable row level security;
alter table public.cauabonga_weekly_attestations enable row level security;
```

Standard policy shape (uses `(select auth.uid())` per project rule):

```sql
create policy "user_reads_own_plots" on public.cauabonga_plots
  for select using (user_id = (select auth.uid()));

create policy "user_reads_own_plantings" on public.cauabonga_plantings
  for select using (user_id = (select auth.uid()));

create policy "user_reads_own_harvests" on public.cauabonga_harvests
  for select using (user_id = (select auth.uid()));

-- All writes go through service_role (Edge Functions). No insert/update/delete
-- policies for authenticated role — clients never write directly. This is the
-- "frontend always filters .eq('user_id', userId), but RLS is the security layer"
-- pattern from CauaCore §8.
```

Founder/support role gets a parallel `for select using (...caua_role='founder'...)` set, mirroring `iot_devices` migration 032. Public attestations are publicly readable (`for select using(true)`) since the on-chain data is public anyway.

### 2.7 Atomic harvest RPC

Per the data flow §1.2 step 8, harvest is a single atomic transaction. Implementation as `plpgsql` function called via `supabase.rpc('apply_cauabonga_harvest', ...)`:

```sql
create or replace function public.apply_cauabonga_harvest(
  p_user_id uuid,
  p_planting_id uuid,
  p_yield_breakdown jsonb,           -- the full breakdown, recorded in cauabonga_harvests
  p_soil_delta smallint,
  p_soil_reason text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plot_id uuid;
  v_tile_idx smallint;
  v_soil_before smallint;
  v_soil_after smallint;
  v_yield_mz numeric(8,2);
  v_harvest_id uuid;
  v_token_event_id uuid;
  v_new_balance numeric(12,2);
begin
  v_yield_mz := (p_yield_breakdown->>'yield_mz')::numeric;

  -- Lock the planting row (FOR UPDATE prevents double-claim race)
  select plot_id, tile_idx, soil_health into v_plot_id, v_tile_idx, v_soil_before
    from public.cauabonga_plantings
    where id = p_planting_id and user_id = p_user_id and state = 'ready'
    for update;

  if v_plot_id is null then
    raise exception 'planting_not_ready_or_unauthorized';
  end if;

  v_soil_after := greatest(0, least(100, v_soil_before + p_soil_delta));

  -- Soil history audit
  insert into public.cauabonga_soil_history(user_id, plot_id, planting_id, tile_idx, reason, delta, soil_before, soil_after)
    values (p_user_id, v_plot_id, p_planting_id, v_tile_idx, p_soil_reason, p_soil_delta, v_soil_before, v_soil_after);

  -- Planting → fallow
  update public.cauabonga_plantings
     set state = 'fallow',
         soil_health = v_soil_after,
         fallow_until = case when (p_yield_breakdown->>'mode') = 'regen' then now() + interval '1 day' else now() end,
         care_actions_count = 0,
         updated_at = now()
   where id = p_planting_id;

  -- Token event
  insert into public.token_events(user_id, event_type, mazorcas, beans, ref_id)
    values (p_user_id, 'cauabonga_harvest', v_yield_mz, 0,
            format('plot:%s:tile:%s:cycle:%s', v_plot_id, v_tile_idx, p_yield_breakdown->>'cycle_n'))
    returning id into v_token_event_id;

  -- Balance update
  update public.user_profiles
     set mazorcas_balance = mazorcas_balance + v_yield_mz
   where user_id = p_user_id
   returning mazorcas_balance into v_new_balance;

  -- Harvest audit
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
    'harvest_id', v_harvest_id,
    'yield_mz', v_yield_mz,
    'new_balance', v_new_balance,
    'soil_after', v_soil_after,
    'fallow_until', (select fallow_until from public.cauabonga_plantings where id = p_planting_id)
  );
end;
$$;

revoke all on function public.apply_cauabonga_harvest from public, anon, authenticated;
grant execute on function public.apply_cauabonga_harvest to service_role;
```

The function is `security definer` and revokes execute from anon/authenticated — only Edge Functions running as `service_role` can call it. The planting row's `for update` lock is the key anti-double-claim primitive.

---

## 3. Edge Functions

All Edge Functions follow the existing CauaCorp patterns:
- **CORS preflight required** (per memory `feedback_edge_functions_cors.md`): OPTIONS → 204 with full CORS_HEADERS. Browser-called functions silently 405 otherwise.
- **JWT verification via `supabase.auth.getUser`** (per memory `feedback_supabase_jwt_no_jose.md`) — never `jose`.
- **`security_headers_middleware.ts`** wraps the response.
- **Service-role client** for all DB writes; never trust client-supplied `user_id`.
- Deno runtime, viem 2.21, Supabase JS 2.38.

| Function                       | Trigger | KYC gate | OFAC gate | Rate limit         | CORS preflight |
|--------------------------------|---------|----------|-----------|---------------------|----------------|
| `mint-cauabonga-plot`          | HTTP POST | Yes (tier ≥ 1) | Yes       | 1/24h per user      | Yes            |
| `claim-cauabonga-harvest`      | HTTP POST | No (off-chain only) | No  | 200 mz/24h cap, claim diminishing returns | Yes |
| `cauabonga-plant-seed`         | HTTP POST | No        | No        | 1 plant per tile per cycle | Yes        |
| `cauabonga-care-action`        | HTTP POST | No        | No        | Cooldowns per care type (GDD §8) | Yes  |
| `cauabonga-rotate-quests`      | pg_cron / scheduled | n/a | n/a   | 1× per day per user (idempotent) | n/a  |
| `cauabonga-tick-growth`        | pg_cron / scheduled | n/a | n/a   | 1× per minute (idempotent) | n/a    |
| `cauabonga-attest-week`        | pg_cron weekly | n/a | n/a    | 1× per (token, week) | n/a              |

### 3.1 `mint-cauabonga-plot`

**Inputs (POST body):**
```ts
{ guardian_id: 0..4, soil_tier?: 1..5 }   // soil_tier optional; defaults per economy.md §5.2
```

**Validation:**
1. Verify JWT → `user_id`.
2. Read `user_profiles` for `kyc_verified_at`, `wallet_address`, `country`.
3. Require `kyc_verified_at IS NOT NULL` (KYC tier ≥ 1).
4. Require `wallet_address IS NOT NULL` AND wallet is linked via `wallet_link_nonces` consumed flow.
5. Geo-block: reject if `country` ∈ `GEO_BLOCKED_COUNTRIES`.
6. **OFAC + Chainalysis screening** for `wallet_address` (insert `sanctions_screenings` row). Hit → 403.
7. Rate limit: count plot mints in last 24h via `cauabonga_action_log` (action='plant' is too noisy — use a dedicated `mint_attempts` query against the plots table by `created_at`); reject if ≥ 1.
8. Uniqueness: reject if user already has an active plot in this `guardian_id`.

**Side effects:**
1. Determine cost: 0 mz first plot ever, else 500 mz (per economy §3.4).
2. If cost > 0: atomic decrement of `user_profiles.mazorcas_balance` via `decrement_mazorcas_atomic` (existing rpc), insert negative `token_events` row.
3. Generate EIP-712 `MintAuthorization` typed-data with random nonce, deadline = `now()+5min`. Insert `cauabonga_mint_nonces` row.
4. Sign with `RELAYER_PRIVATE_KEY` (secret, not in src/).
5. Submit `mintPlot(...)` calldata via viem to `CauaBongaPlot.sol` on Base.
6. Insert `cauabonga_plots` row (state='active', nft_token_id NULL — webhook fills it).
7. Insert 9 starter `cauabonga_plantings` rows (tile_idx 0..8 inner ring per GDD §6 grid layout, all state='empty').

**Response:**
```ts
{ plot_id, tx_hash, expected_token_id?: number, mint_cost_mz: number }
```

The Alchemy webhook (existing `alchemy-nft-webhook`, extended to handle CauaBongaPlot) sets `nft_token_id` once on-chain Transfer is detected.

### 3.2 `claim-cauabonga-harvest`

**Inputs:** `{ planting_id: uuid }`

**Validation:**
1. JWT → `user_id`.
2. Load `cauabonga_plantings` row; verify owner, `state='ready'`, `now() ≥ ready_at`.
3. Verify required care actions performed within this cycle. For regen: 4 distinct care actions logged in `cauabonga_action_log` for this `planting_id` since `planted_at`. For traditional: 2.
4. **Anti-grind:** count harvests in last 24h for this user (`cauabonga_harvests` where `harvested_at > now() - interval '24 hours'`); apply diminishing curve from economy §7.3 (1.00× ≤ 15, 0.75× 16–25, 0.50× 26–35, 0.25× 36+).
5. **Daily emission cap:** sum mazorcas in `token_events` where `event_type LIKE 'cauabonga_%'` AND `created_at > now() - interval '24 hours'`. Reject if `cap (200) - sum < projected_yield`. (Capping at the boundary is acceptable; reduce yield to fit budget rather than reject — UX call: reject with explicit "daily cap reached, try tomorrow.")

**Calculate yield** (server-authoritative formula, mirrors economy §2.1):

```
yield = base[crop] × regen_mult[mode, soil] × soil_mult[soil_tier] ×
        companion_mult[neighbors] × regional_mod[guardian] × streak_bonus[user_streak]
yield_final = yield × diminishing_mult[claim_count_24h]
```

**Side effects:** call `apply_cauabonga_harvest` rpc (§2.7). All in one DB transaction.

**Response:**
```ts
{
  yield_mz: number,
  new_balance: number,
  soil_after: number,
  fallow_until: ISO,
  diminishing_mult: number,        // surfaced so UI can warn user
  daily_emission_remaining: number
}
```

### 3.3 `cauabonga-plant-seed`

**Inputs:** `{ planting_id, crop_slug, mode: 'regen'|'traditional' }`

**Validation:**
1. JWT → user_id.
2. Verify owner of planting row, current state ∈ `('empty','fallow')` AND (state='empty' OR `now() ≥ fallow_until`).
3. Verify crop unlocked at user's level (`user_profiles.cauabonga_level`).
4. Compute seed cost from `crop_slug`. Reject if `mazorcas_balance < cost`.
5. **Anti-degeneracy:** monocultivo check (3+ same crop in 3-tile radius) — log warning if `mode='traditional'`; in regen mode, also OK but soil bonus reduced. (See §6.)

**Side effects:** atomic decrement balance, insert `token_events` (negative), update `cauabonga_plantings` row to `state='seeded'` → after `planted_at + 5%×grow_time` → `state='growing'`, `ready_at = planted_at + grow_time[crop]`. Tile state machine transitions are driven by `cauabonga-tick-growth` cron (§7).

**Response:** `{ planting: {...row}, new_balance, ready_at }`

### 3.4 `cauabonga-care-action`

**Inputs:** `{ plot_id, action: 'water'|'sun'|'nutrient'|'pruning' }`  
(Care applies plot-wide per GDD §8, not per-tile.)

**Validation:**
1. JWT → user_id.
2. Verify plot ownership.
3. Cooldown check: `now() ≥ last_action_at + cooldown[action]` per GDD §8 (water/sun: 30min, nutrient/pruning: 1×/cycle).
4. For nutrient/pruning: require inventory item (post-MVP — MVP uses free actions).

**Side effects:** for each tile in plot where `state='growing'`, increment `care_actions_count`, update `last_water_at|last_sun_at|...`, insert `cauabonga_action_log` row.

**Response:** `{ tiles_affected, next_cooldown_at }`

### 3.5 `cauabonga-rotate-quests` (cron, daily)

**Trigger:** pg_cron at 00:00 COL (`5 0 * * *` UTC = 05:00 UTC for COL-05).

**Validation:** none — server-side only.

**Side effects:** for each user with activity in last 30 days:
1. Mark yesterday's open quests `state='expired'`.
2. Pick 3 quests from template pool (1 easy, 1 medium, 1 hard).
3. Insert `cauabonga_daily_quests` rows with today's date.

**Note on infrastructure:** see §12 ADR — pg_cron vs Supabase scheduled function vs external scheduler.

### 3.6 `cauabonga-tick-growth` (cron, frequent)

**Trigger:** pg_cron every minute. Idempotent.

**Side effects:**
- `update cauabonga_plantings set state='growing' where state='seeded' and now() ≥ planted_at + (grow_time × 0.05);`
- `update cauabonga_plantings set state='ready' where state='growing' and now() ≥ ready_at;`
- `update cauabonga_plantings set state='empty', crop_slug=null, mode=null, planted_at=null, ready_at=null where state='fallow' and now() ≥ fallow_until;`
- Apply idle decay: `where state='empty' and now() - updated_at > interval '30 days'` → emit `cauabonga_soil_history(reason='idle_decay', delta=-1)` (rate-limited to 1/day/tile via `applied_at` check).
- Re-aggregate `cauabonga_plots.avg_soil_health` from owned tiles.

**Note:** see §7 below for the trade-off discussion. The recommended approach is "lazy on-demand evaluation + periodic cleanup cron" rather than per-minute updates of every row.

### 3.7 `cauabonga-attest-week` (cron, weekly)

**Trigger:** pg_cron Sunday 23:00 COL.

**Side effects:**
1. For each `cauabonga_plots` where `nft_token_id IS NOT NULL` AND `(last_attested_week IS NULL OR last_attested_week < current_week)`:
   - Compute `regen_streak`, `total_harvests`, `soil_summary_hash` from last 7 days of `cauabonga_harvests` + current `cauabonga_plantings` soil_health.
   - Insert `cauabonga_weekly_attestations` row (status='queued').
2. Sign and submit batched `attestWeekly(tokenId, weekIndex, regenStreak, totalHarvests, soilSummaryHash)` calls to `CauaBongaPlot.sol` from `ORACLE_PRIVATE_KEY`. Mirror `post-iot-root` Edge Function exactly — submit one tx per token (or batched if contract supports it; see §4 ADR).
3. On confirmation, update `cauabonga_weekly_attestations.status='confirmed'`, `cauabonga_plots.last_attested_week`.

### 3.8 Generic Edge Function skeleton (reference for the engineer)

```ts
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function verifyAuth(authHeader: string): Promise<string> {
  if (!authHeader.startsWith('Bearer ')) throw new Error('missing_bearer')
  const { data: { user }, error } = await supabase.auth.getUser(authHeader.substring(7))
  if (error || !user) throw new Error('invalid_jwt')
  return user.id
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS })
  if (req.method !== 'POST') return new Response('method_not_allowed', { status: 405, headers: CORS_HEADERS })
  // ... implementation
})
```

---

## 4. Smart contracts

Single new contract: `contracts/src/CauaBongaPlot.sol`. Mirrors `CacaoTreeNFT.sol` scaffold (ERC-721 + AccessControl + Pausable + ERC-4906) and adds the soulbound + EIP-712 mint authorization patterns.

### 4.1 Contract sketch

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC4906} from "@openzeppelin/contracts/interfaces/IERC4906.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title  CauaBongaPlot
 * @notice ERC-721 representation of a player's parcela inside a Guardian's finca.
 *         v1.0 is SOULBOUND (non-transferable) per Charter I.3 + earn-only loop.
 *         Anti-Sybil: per-wallet, per-(guardianId) cap of 1 active plot in v1.
 *
 *         Mint flow:
 *           - server (mint-cauabonga-plot) verifies KYC + OFAC + geo + balance,
 *             signs an EIP-712 MintAuthorization with RELAYER_PRIVATE_KEY,
 *             then submits mintPlot(...) as the relayer.
 *           - contract verifies signature against MINTER_ROLE-holding signer,
 *             consumes nonce, mints to `to`.
 *
 *         Weekly attestation:
 *           - cauabonga-attest-week (oracle EOA, ORACLE_ROLE) calls
 *             attestWeekly(tokenId, ...) with per-token regen streak + harvest
 *             count + soil-summary hash. Emits ERC-4906 MetadataUpdate.
 *
 *         Subordinated to docs/CHARTER.md and CauaCore §10.
 */
contract CauaBongaPlot is ERC721, EIP712, Pausable, AccessControl, IERC4906 {
    using Strings for uint256;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    bytes32 public constant MINT_TYPEHASH = keccak256(
        "MintAuthorization(address user,uint8 guardianId,uint8 soilTier,bytes32 nonce,uint256 deadline)"
    );

    struct PlotRecord {
        uint8   guardianId;
        uint8   soilTier;          // 1..5
        bytes32 rarityHash;
        uint64  mintBlock;
        // Weekly-attested rollup state (oracle-set)
        uint32  regenStreakDays;
        uint32  totalHarvests;
        bytes32 soilSummaryHash;
        uint64  lastAttestedAt;
    }

    string  private _baseTokenURI;
    uint256 private _nextTokenId = 1;

    mapping(uint256 => PlotRecord) public records;
    mapping(bytes32 => bool) public consumedNonces;
    /// per-user, per-finca cap (v1: 1 active)
    mapping(address => mapping(uint8 => uint256)) public activePlotByGuardian;

    // ─── Errors ─────────────────────────────────────────────────────────
    error SoulboundV1();
    error InvalidSignature();
    error NonceAlreadyUsed(bytes32 nonce);
    error DeadlineExpired(uint256 deadline);
    error InvalidGuardian(uint8 guardianId);
    error InvalidSoilTier(uint8 soilTier);
    error AlreadyHasPlotInFinca(address user, uint8 guardianId);
    error UnknownToken(uint256 tokenId);
    error ZeroAddressMint();

    // ─── Events ─────────────────────────────────────────────────────────
    event PlotMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint8 guardianId,
        uint8 soilTier,
        bytes32 nonce
    );
    event PlotAttested(
        uint256 indexed tokenId,
        uint64 weekIndex,
        uint32 regenStreakDays,
        uint32 totalHarvests,
        bytes32 soilSummaryHash
    );
    event BaseURIUpdated(string newBase);

    constructor(address admin, string memory baseURI_)
        ERC721("CauaBonga Plot", "CBPLOT")
        EIP712("CauaBongaPlot", "1")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        // MINTER_ROLE + ORACLE_ROLE granted post-deploy to the relayer + oracle EOAs.
        _baseTokenURI = baseURI_;
    }

    // ─── Mint with EIP-712 authorization ─────────────────────────────────

    function mintPlot(
        address to,
        uint8 guardianId,
        uint8 soilTier,
        bytes32 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external whenNotPaused returns (uint256 tokenId) {
        if (to == address(0)) revert ZeroAddressMint();
        if (guardianId > 4) revert InvalidGuardian(guardianId);
        if (soilTier == 0 || soilTier > 5) revert InvalidSoilTier(soilTier);
        if (consumedNonces[nonce]) revert NonceAlreadyUsed(nonce);
        if (deadline < block.timestamp) revert DeadlineExpired(deadline);
        if (activePlotByGuardian[to][guardianId] != 0) {
            revert AlreadyHasPlotInFinca(to, guardianId);
        }

        bytes32 structHash = keccak256(
            abi.encode(MINT_TYPEHASH, to, guardianId, soilTier, nonce, deadline)
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);
        if (!hasRole(MINTER_ROLE, signer)) revert InvalidSignature();

        consumedNonces[nonce] = true;

        tokenId = _nextTokenId++;
        records[tokenId] = PlotRecord({
            guardianId: guardianId,
            soilTier: soilTier,
            rarityHash: bytes32(0),
            mintBlock: uint64(block.number),
            regenStreakDays: 0,
            totalHarvests: 0,
            soilSummaryHash: bytes32(0),
            lastAttestedAt: 0
        });
        activePlotByGuardian[to][guardianId] = tokenId;

        _safeMint(to, tokenId);
        emit PlotMinted(to, tokenId, guardianId, soilTier, nonce);
    }

    // ─── Oracle weekly attestation ───────────────────────────────────────

    function attestWeekly(
        uint256 tokenId,
        uint64 weekIndex,
        uint32 regenStreakDays,
        uint32 totalHarvests,
        bytes32 soilSummaryHash
    ) external whenNotPaused onlyRole(ORACLE_ROLE) {
        PlotRecord storage rec = records[tokenId];
        if (rec.mintBlock == 0) revert UnknownToken(tokenId);

        rec.regenStreakDays = regenStreakDays;
        rec.totalHarvests   = totalHarvests;
        rec.soilSummaryHash = soilSummaryHash;
        rec.lastAttestedAt  = uint64(block.timestamp);

        emit PlotAttested(tokenId, weekIndex, regenStreakDays, totalHarvests, soilSummaryHash);
        emit MetadataUpdate(tokenId);
    }

    // ─── Soulbound: block transfers in v1 ───────────────────────────────
    /**
     * @dev OZ v5 routes mint/transfer/burn through `_update`.
     *      We allow the mint path (auth == 0) and revert anything else.
     *      v1.2 will replace this with a transfer hook that resets soil_health
     *      on the off-chain mirror — see ADR-CB-002.
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        whenNotPaused
        returns (address from)
    {
        from = super._update(to, tokenId, auth);
        // Allow mint (from == 0). Block all other transfers.
        if (from != address(0) && to != address(0)) revert SoulboundV1();
        // Burn (to == 0) is also disallowed in v1 — keeps audit chain intact.
        if (to == address(0)) revert SoulboundV1();
    }

    // ─── Admin ─────────────────────────────────────────────────────────

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    function setBaseURI(string calldata newBase) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseTokenURI = newBase;
        emit BaseURIUpdated(newBase);
        emit BatchMetadataUpdate(1, _nextTokenId - 1);
    }

    // ─── Views ─────────────────────────────────────────────────────────

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    function hashMintAuthorization(
        address user,
        uint8 guardianId,
        uint8 soilTier,
        bytes32 nonce,
        uint256 deadline
    ) external view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(MINT_TYPEHASH, user, guardianId, soilTier, nonce, deadline)
        );
        return _hashTypedDataV4(structHash);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, AccessControl, IERC165) returns (bool)
    {
        return interfaceId == bytes4(0x49064906) || super.supportsInterface(interfaceId);
    }
}
```

### 4.2 Roles + multisig

| Role               | Holder                                              | Justification                                |
|--------------------|-----------------------------------------------------|----------------------------------------------|
| `DEFAULT_ADMIN_ROLE` | 2-of-2 Gnosis Safe (CTO + CEO)                    | Charter §10 multisig minimum                 |
| `PAUSER_ROLE`      | Same 2-of-2 Safe + ops single-sig (emergency only)  | Pause must be fast; admin must be slow       |
| `MINTER_ROLE`      | `RELAYER_PRIVATE_KEY` EOA (stored in Supabase secrets) | Single key — server-controlled, low blast radius (only mint rights, no admin) |
| `ORACLE_ROLE`      | `ORACLE_PRIVATE_KEY` EOA — `[OPEN — non-blocking]`: single-key v1, multisig v1.2 | Mirrors `IoTAttestation` pattern — open ADR §12 |

### 4.3 Why soulbound v1 — and what the v1.2 transferable migration looks like

GDD §13 calls this out as a soft decision. From the technical-director seat:

**Pro-soulbound (recommend v1):**
- Wash-trading impossible → leaderboards remain meaningful.
- Per-wallet 1-plot-per-finca cap is enforceable on-chain (`activePlotByGuardian`). With transfers, the cap becomes a soft DB check that breaks under chain reorgs.
- Audit surface area is smaller — no transfer hooks, no soil-reset logic, no ERC-4906 cache races on transfer.
- Earn-only Charter compliance is mechanically guaranteed; impossible to buy a Maicol Maestro plot.

**Pro-transferable (v1.2 only, post-audit):**
- Speculative onboarding (a buyer can enter via market without grinding).
- Secondary-market liquidity is a marketing channel.
- Broken accounts (lost wallet, social recovery) recoverable via market — though Coinbase Smart Wallet handles this differently.

**Migration approach for v1.2:** new contract `CauaBongaPlotV2.sol`, not an upgrade. v1 holders are airdropped a v2 token that points to the same backing plot row in Postgres; v1 token is burned (or marked deprecated via a `migrated` flag). v2 contract has a transfer hook that resets `soil_health` on the off-chain mirror per economy §8.3. **This is on the v1.2 backlog, not in scope here.**

---

## 5. EIP-712 typed-data spec — `MintAuthorization`

Mirrors `MazorcaRedemption` exactly. Domain separator binds the signature to chain + contract; nonce + deadline prevent replay; signer verified against `MINTER_ROLE`.

### 5.1 Domain

```ts
const DOMAIN = {
  name: 'CauaBongaPlot',
  version: '1',
  chainId: 8453,                                        // Base mainnet (84532 for Sepolia)
  verifyingContract: '0x…CauaBongaPlot deployed addr',
} as const;
```

### 5.2 Types

```ts
const TYPES = {
  MintAuthorization: [
    { name: 'user',         type: 'address' },
    { name: 'guardianId',   type: 'uint8'   },
    { name: 'soilTier',     type: 'uint8'   },
    { name: 'nonce',        type: 'bytes32' },
    { name: 'deadline',     type: 'uint256' },
  ],
} as const;
```

### 5.3 Message

```ts
const message = {
  user: '0x' + user_wallet,                            // user's linked wallet
  guardianId: 0,                                        // 0..4
  soilTier: 1,                                          // 1..5
  nonce: '0x' + crypto.getRandomValues(32 bytes).hex(), // single-use
  deadline: Math.floor(Date.now()/1000) + 300,          // 5 min TTL
};
```

### 5.4 Nonce table (`cauabonga_mint_nonces`) — TTL 5min

DDL in §2.5. The nonce is inserted **before** signing and **before** the on-chain submit. Lifecycle:

| State           | When                                             | Outcome                                        |
|-----------------|--------------------------------------------------|------------------------------------------------|
| Created         | sign step in mint-cauabonga-plot                 | row inserted, expires_at = now()+5min          |
| Consumed (chain)| `mintPlot` succeeds                              | webhook (or follow-up read) sets `consumed_at` |
| Expired         | 5min passes without claim                        | `expire_cauabonga_mint_nonces()` cleanup cron  |
| Refunded        | Plot mint expired and cost was deducted off-chain | `refund-expired-mint` Edge Function (mirrors `refund-expired-redemption`) |

Cleanup cron (mirrors existing `expire_mazorca_redemptions`):

```sql
create or replace function public.expire_cauabonga_mint_nonces()
returns void language sql security definer set search_path = public as $$
  delete from public.cauabonga_mint_nonces
  where expires_at < now() and consumed_at is null;
$$;
```

### 5.5 Why EIP-712 not `eth_sign`

Per CauaCore §10 (no negotiables). Domain separator binds signatures to (chain, contract) so a leaked relayer signature for Base Sepolia cannot be replayed on Base mainnet. Typed data is human-readable in MetaMask/Coinbase Wallet, which surfaces UX trust on the user's signing flow (relevant when v1.2 transferable mints require user co-signing).

---

## 6. Anti-degeneracy enforcement

GDD §16 + economy §8 list 6 degenerate strategies. This section maps each to a **concrete code-level defense**, locating the check in a specific Edge Function or DB constraint.

| # | Degenerate strategy            | Defense                                                          | Location                                                  |
|---|--------------------------------|-----------------------------------------------------------------|-----------------------------------------------------------|
| 1 | **Alt accounts (Sybil farming)** | KYC tier ≥ 1 required for plot mint; OFAC + Chainalysis screening; geo-block. | `mint-cauabonga-plot` validation steps 3–6                |
| 1 | (continued) Wallet uniqueness   | `wallet_link_nonces` consumed_at + `cauabonga_plots` unique on (wallet_address, guardian_id) via NFT contract `activePlotByGuardian`. | `CauaBongaPlot.sol` storage + Edge Function pre-check     |
| 2 | **Click farms / bot harvesting** | Server-authoritative timers. `claim-cauabonga-harvest` rejects if `now() < ready_at`. Required care actions counted from `cauabonga_action_log`. | `claim-cauabonga-harvest` validation step 2–3            |
| 2 | (continued) Diminishing returns | After 15 claims/24h, yield × 0.75; 25 → ×0.50; 35 → ×0.25.       | `claim-cauabonga-harvest` step 4 (economy §7.3)           |
| 2 | (continued) Rate limit          | Captcha required on guest/non-KYC flows for any economic action. | Frontend + middleware                                     |
| 3 | **Time skew (client clock)**    | `now()` from Postgres only. Never trust client `Date.now()`. All grow-time math uses `now() - planted_at` server-side. | `cauabonga-tick-growth` cron + every Edge Function        |
| 4 | **No-care planting spam**       | Required care actions logged in `cauabonga_action_log` per cycle; harvest rejected if count < threshold. Plus economy §8.4: care-deficit debuff −10%/missed cycle (on-yield, not on-eligibility). | `claim-cauabonga-harvest` step 3 + yield formula          |
| 5 | **Plot flipping** (post-v1.2)   | Soulbound v1. v1.2 transfer hook resets soil_health.             | `CauaBongaPlot.sol::_update` revert in v1                 |
| 6 | **Quest farming (no planting)** | Quest templates require planting/harvesting actions; quest cap 120 mz/day; daily total cap 200 mz. | `cauabonga-rotate-quests` template pool + economy §6     |
| 7 | **Monocultivo abuse**           | If `mode='traditional'` AND 3+ same `crop_slug` in 3-tile radius → soil delta = −5 instead of −3 (per GDD §9). Scanned in `claim-cauabonga-harvest` step 6. | `claim-cauabonga-harvest` yield formula                  |
| 8 | **Plot abandonment + reset cycle** | 60-day infertile cooldown enforced via `cauabonga_plots.state='infertile'` + `infertile_until`; 5 $CACAO burn for early restore (existing `MazorcaRedemption` shape adapted); future scar penalty −5% permanent post-v1.1. | `cauabonga-tick-growth` (state transition) + frontend modal |

### Cross-cutting defenses

- **All anti-degeneracy logic lives server-side.** The client never sees: pest event RNG seed, rare drop RNG seed, exact diminishing-return thresholds (only the resulting multiplier is surfaced post-claim for transparency).
- **Append-only audit trails** (`cauabonga_harvests`, `cauabonga_soil_history`, `cauabonga_action_log`) make every edge case forensically replayable. Support cases for dispute resolution use these directly.
- **OFAC + Chainalysis screening** runs on every on-chain write (mint, attestation skipped because oracle is server-controlled, but the user-write path of mint is screened). Hits log to `sanctions_screenings`.

---

## 7. Growth-ticker strategy

The single most architecturally consequential question for CauaBonga: **how do plot timers tick?**

### 7.1 Three candidate approaches

| Approach            | Description                                                        | Pros                                                                  | Cons                                                                                                  |
|---------------------|--------------------------------------------------------------------|-----------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| **A. Per-minute cron** | A pg_cron job runs every 60s and updates state for all rows whose `ready_at < now()` etc. | Real-time UI without client polling. Push notifications fire instantly. | Write amplification: at 100k tiles, even with partial indexes, 100k UPDATEs/min unsustainable. Edge Function compute cost. |
| **B. Lazy on-demand** | State is computed on read. `state` column in DB is a "checkpoint"; UI calls `evaluate-plot` Edge Function which computes current state from `planted_at + grow_time` vs `now()`. | Zero write amplification. Scales linearly with read traffic, not user count. | Push notification ("crop ready") needs separate mechanism. State drift if computed differently in two places. |
| **C. Hybrid** (recommend) | DB column reflects last-known state; lazy evaluation in read path; periodic cron only for state transitions that need to fire effects (idle decay, fallow → empty). Push notifications fire from a separate scan-and-enqueue cron at coarse granularity (5min). | Best of both — reads are accurate, writes are bounded, notifications are timely-enough. | Two state computation paths to keep in sync. Mitigation: single source-of-truth helper function used by both Edge Function and cron. |

### 7.2 Recommendation: Approach C

Rationale:
- **Server-authoritative is non-negotiable** (anti-degeneracy §6 #3). The DB row is always the source of truth.
- **Write amplification is the killer of farming sims**. Pixels.xyz famously rebuilt their tick architecture twice for this reason. We should not learn that lesson on-chain.
- **The user's perceived state drives UX**, and they only see state when they open the app. Lazy-eval on read covers 95% of cases.
- The 5min push-notification scan is a deliberate compromise: a player won't get a "crop ready" push the exact second it ripens, but within 5 minutes is plenty for a farming sim with 4–30h grow times.

Single helper function (in Postgres for canonical truth, ported to TypeScript for client read-through):

```sql
create or replace function public.cauabonga_evaluated_state(
  p_planting public.cauabonga_plantings
) returns text language sql immutable as $$
  select case
    when p_planting.state = 'fallow' and now() >= p_planting.fallow_until then 'empty'
    when p_planting.state = 'growing' and now() >= p_planting.ready_at then 'ready'
    when p_planting.state = 'seeded' and now() >= p_planting.planted_at + interval '1 minute' /* 5% of grow_time approximated */ then 'growing'
    else p_planting.state
  end;
$$;
```

(Production version needs the actual `grow_time` per crop — looked up from a `crops` reference table or `BRAND.crops` constants.)

The cron then only writes the row when the lazy-eval differs from the persisted state — bounded writes, real-time reads.

### 7.3 Daily decay (idle decay) is the other cron

`-1 soil/day` for tiles with `state='empty' AND now() - updated_at > 30 days` is genuinely a write-every-day problem. Solution: rate-limit to 1 decay/day/tile by checking last `cauabonga_soil_history` row with `reason='idle_decay'`.

---

## 8. Daily quest system

### 8.1 Architecture

Three tables:
- `cauabonga_quest_templates` — static reference (or in-code constant). 30 quests defined at build time.
- `cauabonga_daily_quests` — 3 rows per user per day (rotated by cron).
- `cauabonga_quest_progress` — increments triggered by Edge Functions on relevant events.

```sql
create table public.cauabonga_quest_templates (
  id              text primary key,                   -- 'q_plant_3_cacao'
  tier            text not null check (tier in ('easy','medium','hard','streak','legendary')),
  description_es  text not null,
  description_en  text not null,
  reward_mz       int not null,
  target          int not null,                       -- target count
  trigger_event   text not null,                      -- 'plant' | 'harvest' | 'care' | ...
  filter          jsonb not null default '{}'::jsonb, -- {finca: 0, crop: 'cacao_criollo', ...}
  min_level       smallint not null default 1,
  active          boolean not null default true
);
```

(Templates seeded by initial migration.)

Per-quest progress increment is **fired from Edge Functions on the relevant event** (e.g., `cauabonga-plant-seed` Edge Function does `update cauabonga_daily_quests set progress = progress + 1 where user_id=? and template_id matches and state='open' and progress < target` after successful plant, returning the new progress). When progress hits target, function flips state='complete' and credits `reward_mz` via a `token_events` insert.

### 8.2 Rotation cron

`cauabonga-rotate-quests` runs daily at 00:00 COL via pg_cron. For each user with activity in last 30 days:

```sql
-- expire yesterday
update public.cauabonga_daily_quests
   set state = 'expired'
 where user_id = u.user_id
   and quest_date < current_date
   and state = 'open';

-- pick today's 3
insert into public.cauabonga_daily_quests(user_id, quest_date, slot, template_id, reward_mz, target, params)
select u.user_id, current_date, slot, t.id, t.reward_mz, t.target, t.filter
from (values (0,'easy'),(1,'medium'),(2,'hard')) as s(slot, tier)
cross join lateral (
  select id, reward_mz, target, filter
  from public.cauabonga_quest_templates
  where tier = s.tier and min_level <= u.cauabonga_level and active
  order by random()
  limit 1
) t;
```

### 8.3 Daily cap

Quest rewards count toward the 200 mz/day cap (economy §6). The Edge Function checks the cap before crediting; if cap is hit, quest is still completable (state→'complete') but `reward_mz=0` is credited and a "cap_reached" flag is set on the quest row for UI surfacing.

---

## 9. Off-chain → on-chain weekly oracle

Mirrors the `IoTAttestation` pattern (`/post-iot-root` Edge Function + `IoTAttestation.sol`) with one important difference: IoT posts a **single Merkle root per week for all leaves**, while CauaBonga posts **per-token attributes per week**.

### 9.1 Why per-token, not Merkle

The IoT use case is "prove a sensor reading existed at week X" — verification is the goal, retrieval is rare. The CauaBonga use case is "this token's attributes show its regen streak and harvest count" — every marketplace listing, every metadata view needs these values directly. A Merkle root would force every reader to fetch the off-chain proof; per-token storage makes the on-chain attributes self-describing.

The cost is gas: 1 tx per token per week vs 1 tx total per week for Merkle. With 10,000 plots in v1.0, that's 10,000 attestation calls/week. On Base at ~$0.001/call, ~$10/week. Tolerable; the relayer absorbs it.

**At >100k plots, batch.** Add `attestWeeklyBatch(uint256[] tokenIds, uint64[] weekIndexes, ...)` for amortized cost. `[OPEN — non-blocking]` until plot count justifies.

### 9.2 Roll-up algorithm (`cauabonga-attest-week`)

```
For each plot p where nft_token_id is not null and last_attested_week < current_week:
  regen_streak  = max consecutive days where p had ≥1 regen harvest and 0 traditional harvests
                  (computed from cauabonga_harvests window)
  total_harvests = count(*) from cauabonga_harvests where plot_id = p.id
  soil_summary  = canonical_json([{tile_idx, soil_health}, ...]) sorted by tile_idx
  soil_summary_hash = keccak256(soil_summary)

  Insert cauabonga_weekly_attestations(...) with status='queued'.

For each queued attestation:
  Submit attestWeekly(token_id, week_index, regen_streak, total_harvests, soil_summary_hash)
    via ORACLE_PRIVATE_KEY.
  On confirmation:
    Update cauabonga_weekly_attestations.status='confirmed', tx_hash, confirmed_at.
    Update cauabonga_plots.last_attested_week.
```

### 9.3 ERC-4906 cache invalidation

Each `attestWeekly` emits `MetadataUpdate(tokenId)`. OpenSea/Zora/Reservoir listen for this and refresh their metadata cache, ensuring `tokenURI` (served by `cauabonga-plot-metadata` Edge Function from on-chain attribute data + IPFS image) shows current values.

### 9.4 ISO week index

Reuses the `compute_week_index(timestamptz)` function from migration 032 (epoch-week = `floor(unix_ts / 604800)`). Stable, monotonic, no DST.

---

## 10. Risk register

Top 5 technical risks, ranked by impact × likelihood. Each has a defined mitigation owner and a "we'll know it triggered if…" signal.

| #  | Risk                                                       | Impact   | Likelihood | Mitigation                                                                                            | Owner            | Trigger signal                                                  |
|----|------------------------------------------------------------|----------|------------|------------------------------------------------------------------------------------------------------|------------------|-----------------------------------------------------------------|
| R1 | **Relayer key compromise** (`RELAYER_PRIVATE_KEY` leaks)   | Critical | Low        | Key in Supabase Edge Function env only; rotation runbook in `docs/WEB3.md`; per-user 1/24h cap on `mint-cauabonga-plot`; PAUSER_ROLE on contract held by 2-of-2 multisig — pause the contract if compromise detected, rotate key, redeploy Edge Function, unpause. Defense in depth: even with a leaked key, the worst case is unauthorized plot mints (no fund drain — no money on the contract). | TD + CSO         | Unexpected mints in `cauabonga_plots` not preceded by a row in `cauabonga_mint_nonces`; alarmable with a daily reconciliation job. |
| R2 | **RLS misconfig on cauabonga tables**                       | Critical | Medium     | All policies use `(select auth.uid())` (CauaCore §8 — fixes a known PG planner foot-gun). All writes go through Edge Functions as `service_role`, so even a missing INSERT policy is correct. CI test: a Supabase test user attempts cross-user reads/writes; expected 0 rows / RLS failure. | TD + lead-prog   | Sentry error pattern "row-level security policy violated"; or QA report of a user seeing another's plot. |
| R3 | **Growth-ticker race conditions** (double-claim of harvest) | High     | Medium     | `apply_cauabonga_harvest` rpc uses `SELECT ... FOR UPDATE` on the planting row. Concurrent claim attempts serialize. The state-transition predicate `state='ready'` is checked under the lock. | engine-prog      | Two `cauabonga_harvests` rows for the same `(planting_id, cycle_n)`. CI: integration test running 10 parallel harvest claims on one ready tile, expect 1 success + 9 errors. |
| R4 | **Oracle key compromise** (`ORACLE_PRIVATE_KEY` leaks)     | High     | Low        | Same key-storage rules as relayer. Worst case: attacker can post bogus attestations (regen streaks, harvest counts) to manipulate marketplace metadata. No fund drain. Mitigation: pause contract, rotate, replay correct attestations. **`[OPEN — non-blocking]`**: consider 2-of-2 multisig for ORACLE_ROLE in v1.1 — deferred since attestation signs nothing-of-value (no token mint, no fund movement). | TD + CSO         | Marketplace shows impossible attribute values (e.g., regen_streak > 365); on-chain `PlotAttested` event from a tx not preceded by a `cauabonga_weekly_attestations` row. |
| R5 | **Soulbound contract bug requiring redeploy**              | High     | Medium     | Foundry test suite covers: mint OK; transfer reverts; burn reverts; mint with bad signature reverts; replay nonce reverts; expired deadline reverts; per-finca cap reverts. PAUSER_ROLE allows immediate freeze. Migration plan: deploy v1.0.1 contract, snapshot v1.0 holders, airdrop replacement tokens, update Edge Function `CAUABONGA_PLOT_ADDRESS` env. Off-chain `cauabonga_plots` row only references token_id + chain_id + contract — supports multi-contract fan-in by design. | TD + engine-prog | Audit finding (post-deploy) or user reports of unexpected revert/transfer. |

Risks not in the top 5 but tracked:
- **Daily-cap evasion via clock-skew across multiple Edge Function regions** — mitigated by all caps using DB `now()`, not function-local time.
- **IPFS pin loss** — Pinata + on-chain content hashes; same risk + mitigation as `tree-metadata`.
- **Quest reward + cap interaction edge cases** — covered by integration tests; surface "cap_reached" to UI rather than failing silently.
- **State-machine inconsistency on partial Edge Function failure** — every state transition is in a single transaction (rpc); no two-phase commits.
- **Schema migration deploy ordering** — migration 033 must land before any 033-dependent Edge Function; CI enforces.

---

## 11. MVP architecture

Per GDD §19, MVP is **Lucho's finca only, off-chain only**. No PlotNFT contract, no on-chain mint, no oracle attestation, no transferable plot logic. Just Postgres + Edge Functions + the existing token ledger.

### 11.1 What ships in MVP (4-week sprint)

| Component | In MVP? | Notes |
|-----------|---------|-------|
| `cauabonga_plots` table | Yes | But `nft_token_id`/`nft_chain_id`/`nft_contract` columns are NULL throughout |
| `cauabonga_plantings` table | Yes | 9-tile inner ring only; outer ring locked |
| `cauabonga_harvests` table | Yes | Audit ledger from day 1 |
| `cauabonga_soil_history` table | Yes | 3-zone simplified curve, but full schema |
| `cauabonga_action_log` table | Yes | Required for anti-degeneracy + quest progress |
| `cauabonga_daily_quests` + templates | Yes | 1 quest type only at MVP per GDD §19 — but full table |
| `cauabonga_mint_nonces` | **No** | No on-chain mint; defer to v1.0 |
| `cauabonga_weekly_attestations` | **No** | No on-chain anchor; defer to v1.0 |
| `mint-cauabonga-plot` Edge Function | **Off-chain stub** | Inserts `cauabonga_plots` row, no on-chain submit |
| `claim-cauabonga-harvest` Edge Function | Yes | Full version |
| `cauabonga-plant-seed` Edge Function | Yes | 2 crops only (Cacao Criollo + Plátano Dominico) |
| `cauabonga-care-action` Edge Function | Yes | 5 verbs unchanged from CauaGotchi pattern |
| `cauabonga-rotate-quests` cron | Yes | But pulls from a 1-template pool ("first harvest") |
| `cauabonga-tick-growth` cron | Yes | Approach C from §7 |
| `cauabonga-attest-week` cron | **No** | No on-chain layer in MVP |
| `CauaBongaPlot.sol` contract | **No** | Defer to v1.0 (week 5+) |
| `cauabonga-plot-metadata` Edge Function | **No** | Defer to v1.0 |
| Alchemy webhook extension | **No** | Defer to v1.0 |

### 11.2 MVP file list (concrete, ready to assign)

| File | Purpose |
|------|---------|
| `supabase/migrations/033_cauabonga_plots.sql` | All 9 tables + RLS + `apply_cauabonga_harvest` rpc + `cauabonga_evaluated_state` + `expire_cauabonga_mint_nonces` (even though nonce table is empty in MVP, ship the helper). Seeds the quest template table with the MVP quest. |
| `supabase/functions/mint-cauabonga-plot/index.ts` | Off-chain stub: validation + `cauabonga_plots` insert + 9 `cauabonga_plantings` rows. No on-chain code path. Wallet not required at MVP (guest mode supported). |
| `supabase/functions/claim-cauabonga-harvest/index.ts` | Full implementation. |
| `supabase/functions/cauabonga-plant-seed/index.ts` | 2 crops only. |
| `supabase/functions/cauabonga-care-action/index.ts` | Full. |
| `supabase/functions/cauabonga-rotate-quests/index.ts` | Cron, MVP-quest-template only. |
| `supabase/functions/cauabonga-tick-growth/index.ts` | Cron, Approach C. |
| `src/pages/CauaBongaGame.tsx` | New: plot grid renderer for Lucho's finca. |
| `src/hooks/useCauaBongaPlots.ts` | Wraps Edge Function calls + Postgres-direct selects (RLS enforced). |
| `src/hooks/useCauaBongaTimers.ts` | Lazy-eval helper using `cauabonga_evaluated_state` shape. |
| `src/utils/cauabonga.ts` | Yield formula constants (regen_mult curve, soil_mult curve, base yields per crop) — must match server-side numbers exactly. |

### 11.3 What does NOT ship in MVP (to be very clear)

- No `CauaBongaPlot.sol` deployment — even on Base Sepolia.
- No PlotNFT mint. The `cauabonga_plots.nft_token_id` column exists but is always NULL.
- No EIP-712 signing in `mint-cauabonga-plot`.
- No oracle, no attestation cron, no soulbound logic.
- No transferable / market UI.
- No mainnet deploy of anything new — only the Postgres migration and Edge Functions go to staging/prod.

This deliberately defers the most expensive risks (R1, R3, R4, R5) past the proof-of-loop milestone.

---

## 12. Open architectural questions

The following items need formal ADRs before the affected component can ship.

| ADR ID | Question | Blocks | Owner | Recommendation (TD pre-vote) |
|--------|----------|--------|-------|-------------------------------|
| **ADR-CB-001** | **Soulbound mechanics confirmed for v1?** GDD §13 + economy §8 + this doc all assume soulbound. Does growth/marketing accept the trade (no speculative onboarding)? | `CauaBongaPlot.sol` — soulbound revert in `_update`. Affects audit scope. | creative-director + growth | **Recommend soulbound v1.0**; commit to v1.2 transferable post-audit. |
| **ADR-CB-002** | **Oracle role: single key vs multisig?** ORACLE_ROLE is currently single-key per `IoTAttestation` precedent. Should CauaBonga oracle be 2-of-2 multisig from day 1, or accept single-key risk for v1.0? | `CauaBongaPlot.sol` deployment script. Doesn't affect contract code (AccessControl handles either). | TD + CSO | **Single-key for v1.0** — same risk profile as IoTAttestation, no fund movement on attestation. Move to multisig in v1.1 alongside transferable migration audit. |
| **ADR-CB-003** | **Daily-cron infrastructure: pg_cron vs Supabase Scheduled Function vs external?** pg_cron lives inside Postgres (already enabled per `expire_mazorca_redemptions`). Supabase Scheduled Functions are HTTP-callable Edge Functions. External (e.g., GitHub Actions, Vercel Cron, Upstash QStash) is most portable. | `cauabonga-rotate-quests`, `cauabonga-tick-growth`, `cauabonga-attest-week`. | devops-engineer | **pg_cron** for `expire-*` cleanups + `cauabonga-rotate-quests`. **Supabase Scheduled Function** for `cauabonga-tick-growth` (every minute) — needs full TS, RPC calls, viem signing. **Supabase Scheduled Function** for `cauabonga-attest-week` (uses RELAYER_PK + viem). pg_cron stays in DB; Edge Functions stay where viem/JWT live. |
| **ADR-CB-004** | **Plot mint cost on-chain: enforced at contract or Edge Function only?** Currently the 500 mz cost is decremented off-chain before signing the EIP-712 mint. The contract trusts the signer (relayer) implicitly. Do we want the contract to also enforce a minimum mazorca-burn proof, similar to `MazorcaRedemption`? | `CauaBongaPlot.sol` — adds complexity and a 2nd signature path. | TD | **No — keep cost off-chain.** Mazorca balance is always off-chain anyway; on-chain enforcement adds gas and complexity for no security gain (the relayer is already the source of truth for KYC/balance gating). |
| **ADR-CB-005** | **Per-finca cap (1 plot/finca/user) — on-chain enforcement granularity.** Contract currently uses `mapping(address => mapping(uint8 => uint256))`. If a player burns / migrates, the slot stays occupied. | v1.2 transferable migration. | TD + engine-prog | **Accept slot persistence in v1**; v1.2 migration explicitly clears `activePlotByGuardian[oldOwner][guardianId]` in the burn-and-replace path. |
| **ADR-CB-006** | **Yield formula canonical location.** Server formula in `claim-cauabonga-harvest` must match client preview formula in `useCauaBongaPlots`. Hard-coded twice = drift risk. | All yield-related UI. | TD + lead-prog | **Single source of truth in `src/utils/cauabonga.ts` constants** (regen curve, soil curve, base yields), shared via copy-and-test (CI test that hashes the JSON of constants and compares to a golden fixture). Server reads same module via Deno's npm: import. **`[TBD]`** — verify Deno can import from `src/utils/`; if not, duplicate + CI parity test. |
| **ADR-CB-007** | **Quest template seeding: in-migration SQL vs separate seed script vs in-code constant?** | `cauabonga-rotate-quests`, content team workflow. | TD + content-team | **In-migration SQL for v1**; quest balancing iteration past launch should move to a separate `cauabonga_quest_templates_v2.sql` migration to keep history clean. |
| **ADR-CB-008** | **Captcha provider for guest economic actions** (recommended in §6 #2). Cloudflare Turnstile vs hCaptcha vs none-for-MVP. | Frontend + Edge Function middleware. | TD + CSO | **Defer to v1.0**; MVP is KYC-only path (no guest economic actions). |

These are not "nice to have"; they gate the corresponding implementation work. Resolve in writing as ADRs in `docs/architecture/` (or `.octogent/tentacles/cauabonga/adr/`) before the affected file is opened for implementation.

---

## 13. Performance budgets

| Surface                          | Budget                                        | Rationale                                |
|----------------------------------|-----------------------------------------------|------------------------------------------|
| `claim-cauabonga-harvest` p95    | < 400ms end-to-end (cold start excluded)      | Single rpc + 2 reads; comparable to `award-tokens` |
| `cauabonga-plant-seed` p95       | < 250ms                                        | Single rpc; faster than harvest          |
| `cauabonga-care-action` p95      | < 350ms (touches 9 tiles)                      | One UPDATE … WHERE plot_id =, RLS-filtered |
| Plot grid first paint            | < 1.5s on 4G                                   | Reuses existing route bundle             |
| `mint-cauabonga-plot` (on-chain v1.0) p95 | < 5s (includes Base block time)        | One signed tx + Alchemy webhook latency  |
| `cauabonga-attest-week` total    | < 30 min for 10k plots (sequential), < 5 min (batched) | Run during low-traffic window            |
| Tick cron throughput             | < 5s per minute window                         | Idempotent; can drop a beat without correctness loss |
| Postgres write rate (steady state, 10k DAU) | < 500 writes/sec                | Within free-tier ceiling with headroom   |

These are commitments, not aspirations. Every Edge Function emits its own duration to a `cauabonga_metrics` log table (or Supabase logs) — performance-analyst owns the dashboard.

---

## 14. Glossary

| Term | Meaning |
|------|---------|
| **Plot** | A player's parcel inside a guardian's finca. 1 active plot per finca per user (v1). Maps 1:1 with a future `CauaBongaPlot` ERC-721 token. |
| **Tile** | One of 25 cells on a plot grid (5×5). Inner 3×3 = 9 starter tiles. |
| **Planting** | A row in `cauabonga_plantings`. Persistent for the tile's lifetime; carries the state machine. |
| **Harvest** | Atomic claim of a "ready" planting's yield; produces mazorcas + mutates soil. |
| **Cycle** | One plant→grow→harvest sequence on a tile. |
| **Care action** | Water/Sun/Nutrients/Pruning/Molasses verbs that affect the plot's growing crops (GDD §8). |
| **Regen mode** | Regenerative agroforestry: +30% yield, soil +1/+2/harvest, fallow required. |
| **Traditional mode** | Monocultivo: base yield, soil −3/harvest, no fallow. |
| **Streak** | Consecutive days a plot has been in regen mode without traditional mode interrupting. |
| **Attestation** | Weekly on-chain commitment of a plot's regen streak + harvests + soil-summary hash, posted by oracle. |
| **Relayer** | Server-side EOA holding `MINTER_ROLE`; submits gasless mint txs on behalf of users. |
| **Oracle** | Server-side EOA holding `ORACLE_ROLE`; submits weekly attestations. |
| **Soulbound** | ERC-721 with `_update` revert — non-transferable. |
| **Daily cap** | 200 mz/24h per user across all `cauabonga_*` event types. |
| **Diminishing returns** | Per-claim yield reduction past N claims/24h (15/25/35 thresholds, economy §7.3). |

---

## 15. Reference summary — which CauaCore §10 rule applies where

| Rule | Where in this architecture |
|------|----------------------------|
| Cero private keys client-side | RELAYER_PRIVATE_KEY + ORACLE_PRIVATE_KEY in Supabase Edge Function env only. Never in `src/`, never in `contracts/`, never in commits. (§3, §4, §5, §9.) |
| EIP-712 typed-data en TODA firma off-chain → on-chain | `MintAuthorization` typed-data spec (§5). Domain separator binds (chain, contract). |
| Nonces obligatorios | `cauabonga_mint_nonces` TTL 5min mirrors `mazorca_burn_nonces` (§2.5, §5.4). |
| KYC-gate antes de cualquier write on-chain | `mint-cauabonga-plot` requires `kyc_verified_at IS NOT NULL` before signing (§3.1). |
| OFAC + Chainalysis screening pre-write | Step 6 of `mint-cauabonga-plot`; logs to `sanctions_screenings` (§3.1, §6). |
| Rate-limits en relayer | `mint-cauabonga-plot` 1/24h per user; `claim-cauabonga-harvest` 200 mz/24h cap + diminishing returns (§3.1, §3.2). |
| Pausable everywhere | `CauaBongaPlot.sol` inherits OZ Pausable; PAUSER_ROLE on 2-of-2 Safe (§4.1, §4.2). |
| ERC-4906 MetadataUpdate en cada mutación de tokenURI | `attestWeekly` emits MetadataUpdate per token (§4.1, §9.3). |
| Sin presale, sin allocation founders fuera de gameplay | First plot free, subsequent plots cost mazorcas earned in-game (economy §3.4). |
| Cadena = Base | chainId 8453 mainnet, 84532 Sepolia for staging (§5.1). |
| Cero custodia de claves de usuario | User signs with their own wallet via Coinbase Smart Wallet / RainbowKit. The relayer signs only the EIP-712 mint *authorization* for the contract; the user receives the NFT via `_safeMint(to, ...)` direct to their wallet (§4.1, §5). |
| Geo-block enforcement | `mint-cauabonga-plot` step 5 checks `country` ∈ `GEO_BLOCKED_COUNTRIES` (§3.1). |
| Smart contract risk disclosure | Required inline before any user-side `writeContract` — applies to v1.2 transferable + soil-restore $CACAO burn flows. (Surfaced in frontend ADR, not this doc.) |

---

> **Implementation gates**: ADRs CB-001, CB-003, and CB-006 must be resolved before MVP migration 033 ships.  
> ADRs CB-002, CB-004, CB-005, CB-007 must be resolved before v1.0 contract deploy.  
> ADR CB-008 must be resolved before any guest-mode economic action ships.

---

### Summary

This document specifies CauaBonga as **off-chain-first farming-sim with a weekly on-chain anchor**: 9 Postgres tables + atomic harvest rpc + 7 Edge Functions + 1 ERC-721 contract with EIP-712 mint authorization and per-token weekly attestation. MVP ships off-chain only (Lucho's finca, 9 tiles, 2 crops, 1 quest type, no NFT) to validate the loop before committing to contract code. Eight ADRs gate implementation, of which three (soulbound, cron infra, yield-formula canonicalization) must resolve before migration 033 lands.
