-- Migration 044 — Caua Creyentes funnel: care_actions + drop_purchases + guardians + golden_ticket_eligible
--
-- Cierra los 2 bloqueadores de deploy del funnel Caua Creyente:
--   1) Las edge functions send-adoption-email / send-tree-status-email /
--      send-lifecycle-email referencian tabla `guardians` que NO existe en la
--      DB — los Pentámera viven en `caua_bonga_farms` (sin `name`/`town`) y en
--      el array GUARDIANS de src/utils/constants.ts. Decisión: crear tabla
--      `public.guardians` seedeada con los 5 canónicos, no view.
--   2) Las features del Drop Cohorte 01 + Golden Ticket Workshop 2.0 piden
--      tablas `care_actions`, `drop_purchases` y view `golden_ticket_eligible`
--      que aún no existen.
--
-- Specs governing this migration:
--   ~/Documents/Caua/integrations/social/specs/CAUA-CACAO-DROP.md
--   ~/Documents/Caua/integrations/social/specs/GOLDEN-TICKET.md
--   ~/Documents/Caua/integrations/social/04-CAMPANA-CAUA-CREYENTES.md
--
-- Frontend acoplado (schema-of-record verificado):
--   src/pages/Drop.tsx                — SkuCard ids 'mucilago'|'bean'
--   src/hooks/useDropAvailability.ts  — query: cohort_id smallint, status in (pending,paid)
--   src/utils/constants.ts:GUARDIANS  — fuente canónica de nombres/towns/varieties
--
-- NO ejecutar `supabase db push` desde acá — eso lo hace el humano.

set local search_path = public;

-- ─────────────────────────────────────────────────────────────────────────
-- 1. care_actions — fila por acción (normalizada, NO jsonb opaco)
-- ─────────────────────────────────────────────────────────────────────────
-- Spec Golden Ticket §1 condición #2 cuenta filas con count(distinct id) >= 5,
-- así que necesitamos granularidad por acción. action_type incluye los 5 de
-- gameplay (water/prune/fertilize/inspect/harvest) + 2 del minijuego de
-- mantenimiento usados en CauaGotchi (tap/sun).

create table if not exists public.care_actions (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  tree_id      uuid        references public.cacao_trees(id) on delete set null,
  action_type  text        not null check (action_type in (
                              'water', 'prune', 'fertilize', 'inspect',
                              'harvest', 'tap', 'sun'
                            )),
  metadata     jsonb       not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists care_actions_user_created_idx
  on public.care_actions (user_id, created_at desc);

create index if not exists care_actions_tree_idx
  on public.care_actions (tree_id)
  where tree_id is not null;

alter table public.care_actions enable row level security;

drop policy if exists care_actions_owner_select on public.care_actions;
create policy care_actions_owner_select
  on public.care_actions for select
  using (
    (select auth.uid()) = user_id
    or public.is_founder_cached((select auth.uid()))
  );

drop policy if exists care_actions_owner_insert on public.care_actions;
create policy care_actions_owner_insert
  on public.care_actions for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists care_actions_owner_update on public.care_actions;
create policy care_actions_owner_update
  on public.care_actions for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists care_actions_owner_delete on public.care_actions;
create policy care_actions_owner_delete
  on public.care_actions for delete
  using ((select auth.uid()) = user_id);

comment on table public.care_actions is
  'One row per care action on an adopted cacao tree. Source for Golden Ticket eligibility (≥5 rows required) and CauaGotchi gameplay log.';

-- ─────────────────────────────────────────────────────────────────────────
-- 2. drop_purchases — Caua Cacao Drop Cohorte 01 (Lote 2025)
-- ─────────────────────────────────────────────────────────────────────────
-- SCHEMA DEFINITIVO — alineado con useDropAvailability.ts (query es:
--   select sku, status from drop_purchases
--     where cohort_id = 1 and status in ('pending','paid')
-- ) y con el spec CAUA-CACAO-DROP.md §1 (precios COP/USD, NFT mint trigger).
--
-- Cap por (cohort_id, sku) = 10 rows activas (status in pending|paid).
-- Implementado vía trigger function (no se puede con exclusion constraint
-- porque smallint+text no es GiST-indexable sin btree_gist extension, y no
-- queremos depender de eso). Refunded rows liberan el slot.

create table if not exists public.drop_purchases (
  id                  uuid           primary key default gen_random_uuid(),
  user_id             uuid           not null references auth.users(id) on delete restrict,
  cohort_id           smallint       not null,
  sku                 text           not null check (sku in ('mucilago', 'bean')),
  status              text           not null default 'pending'
                                       check (status in ('pending', 'paid', 'refunded')),
  amount_cop          numeric(12, 2),
  amount_usd          numeric(10, 2),
  stripe_session_id   text,
  coinbase_charge_id  text,
  paid_at             timestamptz,
  created_at          timestamptz    not null default now()
);

-- Una sola sesión Stripe / charge Coinbase por purchase. NULL permitido (los
-- 2 rails alternativos pueden estar vacíos según el método elegido).
create unique index if not exists drop_purchases_stripe_session_uniq
  on public.drop_purchases (stripe_session_id)
  where stripe_session_id is not null;

create unique index if not exists drop_purchases_coinbase_charge_uniq
  on public.drop_purchases (coinbase_charge_id)
  where coinbase_charge_id is not null;

create index if not exists drop_purchases_cohort_sku_active_idx
  on public.drop_purchases (cohort_id, sku)
  where status in ('pending', 'paid');

create index if not exists drop_purchases_user_idx
  on public.drop_purchases (user_id, created_at desc);

alter table public.drop_purchases enable row level security;

drop policy if exists drop_purchases_owner_read on public.drop_purchases;
create policy drop_purchases_owner_read
  on public.drop_purchases for select
  using (
    (select auth.uid()) = user_id
    or public.is_founder_cached((select auth.uid()))
  );

-- Writes solo service_role (Edge Functions handle-stripe-webhook /
-- coinbase-commerce-webhook). NO insert/update/delete policy => RLS blockea
-- anon+authenticated; service_role bypasses.

comment on table public.drop_purchases is
  'Caua Cacao Drop purchases. Frontend (useDropAvailability) reads aggregate counts; webhooks write rows via service_role. Cap 10 per (cohort_id, sku) enforced by trigger.';

-- ─── Cap trigger: max 10 rows activas por (cohort_id, sku) ──────────────
-- Bloquea inserts y updates que dejen >10 rows en status in (pending,paid)
-- para el mismo (cohort_id, sku). Refunds liberan slot automáticamente
-- porque el filtro WHERE excluye 'refunded'.
create or replace function public.enforce_drop_purchase_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_active_count integer;
  v_cap          constant integer := 10;
begin
  if tg_op = 'INSERT' and new.status not in ('pending', 'paid') then
    return new;
  end if;
  if tg_op = 'UPDATE'
     and new.status not in ('pending', 'paid')
     and old.status not in ('pending', 'paid') then
    return new;
  end if;

  select count(*)
    into v_active_count
    from public.drop_purchases
   where cohort_id = new.cohort_id
     and sku       = new.sku
     and status in ('pending', 'paid')
     and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if v_active_count >= v_cap then
    raise exception 'Drop cap reached for cohort_id=% sku=% (limit=%)',
      new.cohort_id, new.sku, v_cap
      using errcode = '23505';
  end if;

  return new;
end $$;

drop trigger if exists drop_purchases_cap_trigger on public.drop_purchases;
create trigger drop_purchases_cap_trigger
  before insert or update of cohort_id, sku, status on public.drop_purchases
  for each row execute function public.enforce_drop_purchase_cap();

comment on function public.enforce_drop_purchase_cap is
  'Enforces ≤10 active (pending|paid) rows per (cohort_id, sku). Refunded rows are excluded so refunds free up slots.';

-- ─────────────────────────────────────────────────────────────────────────
-- 3. guardians — tabla canónica de los 5 Pentámera (NO view)
-- ─────────────────────────────────────────────────────────────────────────
-- Decisión arquitectónica: `caua_bonga_farms` modela el mundo CauaGotchi
-- (layout_x/y, biome, npc_dialogue) y NO tiene `name`/`town`. Los nombres
-- canónicos viven en el array GUARDIANS de src/utils/constants.ts.
-- send-adoption-email, send-tree-status-email y send-lifecycle-email asumen
-- una tabla `guardians` con (id, name, town, region) — la creamos como tabla
-- real seedeada para que sea consultable on-chain y joinable. NO view
-- porque las Edge Functions necesitan idempotency y la fuente (constants.ts)
-- es compile-time, no runtime.

create table if not exists public.guardians (
  id                  smallint     primary key,            -- 0..4 (matches GUARDIANS array index)
  name                text         not null,
  town                text         not null,
  region              text         not null,
  variety_specialty   text         not null,
  created_at          timestamptz  not null default now()
);

alter table public.guardians enable row level security;

drop policy if exists guardians_public_read on public.guardians;
create policy guardians_public_read
  on public.guardians for select
  using (true);

drop policy if exists guardians_founder_write on public.guardians;
create policy guardians_founder_write
  on public.guardians for all
  using (public.is_founder_cached((select auth.uid())))
  with check (public.is_founder_cached((select auth.uid())));

comment on table public.guardians is
  'Pentámera canonical roster — seeded from src/utils/constants.ts GUARDIANS. Read public (data pública del proyecto), writes solo founders.';

-- Seed: 5 Pentámera con datos exactos extraídos de src/utils/constants.ts.
-- variety_specialty es campo derivado de GUARDIANS[i].varieties[0] +
-- GUARDIANS[i].power (resumen one-liner para usar en email templates).
insert into public.guardians (id, name, town, region, variety_specialty) values
  (0, 'Lucho',    'Hobo',      'Huila',        'Híbrido Acriollado · Mucílago Cítrico · Agroforestería'),
  (1, 'Marta',    'Saravena',  'Arauca',       'Criollo Élite · Fine-Flavor Floral · Modelo Araucano'),
  (2, 'Rafael',   'Arbeláez',  'Cundinamarca', 'Criollo Élite · Polifenoles Diméricos · Altitudinal Sumapaz'),
  (3, 'Fernando', 'Guamal',    'Meta',         'Criollo Élite · Medalla de Oro 2024 · FEAR5 + San Vicente 41'),
  (4, 'Ricardo',  'Landázuri', 'Santander',    'Trinitario · Robusto · Trazabilidad lote a lote')
on conflict (id) do update set
  name              = excluded.name,
  town              = excluded.town,
  region            = excluded.region,
  variety_specialty = excluded.variety_specialty;

-- ─── Soft FK check: cacao_trees.guardian_id → guardians.id ──────────────
-- NO se enforcea HARD porque cacao_trees ya está poblado en prod y un orphan
-- puede romper el deploy. En su lugar, RAISE NOTICE si hay drift — operador
-- ve el aviso en logs de migración y decide si patchea data.
do $$
declare
  v_orphan_count integer;
begin
  select count(*) into v_orphan_count
    from public.cacao_trees t
   where t.guardian_id is not null
     and not exists (select 1 from public.guardians g where g.id = t.guardian_id);

  if v_orphan_count > 0 then
    raise notice 'DATA QUALITY: % cacao_trees rows reference guardian_id not in guardians table. Inspect with: select distinct guardian_id from cacao_trees where guardian_id not in (select id from guardians);', v_orphan_count;
  else
    raise notice 'cacao_trees.guardian_id integrity OK — all rows reference valid guardians.';
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. golden_ticket_eligible — view (copia textual del spec §3.1)
-- ─────────────────────────────────────────────────────────────────────────
-- Spec source: ~/Documents/Caua/integrations/social/specs/GOLDEN-TICKET.md §3.1
-- Una fila por usuario. is_eligible=true significa cumplió las 5 condiciones
-- del Caua Creyente (adoptó + 5 care actions + ≥1 blog read + ≥1 blog share +
-- ≥1 Drop Cohorte 01 paid).
--
-- Tablas referenciadas (todas existen post-migración 044):
--   user_profiles    — migration 001/004
--   cacao_trees      — migration 005/007
--   care_actions     — migration 044 (esta misma, declarada arriba)
--   token_events     — migration 010 (blog_tokens_crm)
--   drop_purchases   — migration 044 (esta misma, declarada arriba)

create or replace view public.golden_ticket_eligible as
select
  up.user_id,
  up.email,
  up.full_name,
  bool_or(t.id is not null) as has_tree,
  count(distinct ca.id) as care_action_count,
  count(distinct te_read.id) as blog_reads,
  count(distinct te_share.id) as blog_shares,
  count(distinct dp.id) filter (where dp.cohort_id = 1 and dp.status = 'paid') as drop_purchases,
  (
    bool_or(t.id is not null)
    and count(distinct ca.id) >= 5
    and count(distinct te_read.id) >= 1
    and count(distinct te_share.id) >= 1
    and count(distinct dp.id) filter (where dp.cohort_id = 1 and dp.status = 'paid') >= 1
  ) as is_eligible
from public.user_profiles up
  left join public.cacao_trees t on t.user_id = up.user_id
  left join public.care_actions ca on ca.user_id = up.user_id
  left join public.token_events te_read on te_read.user_id = up.user_id and te_read.event_type = 'blog_read'
  left join public.token_events te_share on te_share.user_id = up.user_id and te_share.event_type = 'blog_share'
  left join public.drop_purchases dp on dp.user_id = up.user_id
group by up.user_id, up.email, up.full_name;

comment on view public.golden_ticket_eligible is
  'One row per user. is_eligible = true means user has completed all 5 Caua Creyente conditions (spec GOLDEN-TICKET.md §1).';

-- ─── Notify on completion ───────────────────────────────────────────────
do $$
begin
  raise notice 'Migration 044 applied. Created: care_actions, drop_purchases (+cap trigger), guardians (seed 5), golden_ticket_eligible view.';
  raise notice 'Verify Drop with: select cohort_id, sku, count(*) from drop_purchases where status in (''pending'',''paid'') group by 1,2;';
  raise notice 'Verify Golden Ticket with: select count(*) filter (where is_eligible) as eligible, count(*) as total from golden_ticket_eligible;';
end $$;
