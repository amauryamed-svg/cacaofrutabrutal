-- ═══════════════════════════════════════════════════════════════════════════
-- CAUA Corporation — Crowdfunding Schema
-- Adds: technologies, mvps, lot_investments tables
--       + caua_role column on user_profiles
-- ═══════════════════════════════════════════════════════════════════════════

-- ── User roles ───────────────────────────────────────────────────────────────
alter table user_profiles
  add column if not exists caua_role text
    check (caua_role in ('investor','creyente','colono','nativo','farmer','founder'))
    default 'creyente';

-- ── Technologies ─────────────────────────────────────────────────────────────
-- Each row = one fundable biotech process (MucilageExtract™, HydroSol™, etc.)
create table if not exists technologies (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  name                text not null,
  tagline             text,
  input_description   text not null,
  process_steps       jsonb not null default '[]',
  output_description  text not null,
  lot_price_cop       int  not null,
  lot_price_usd_cents int  not null,
  lots_total          int  not null default 100,
  lots_funded         int  not null default 0,
  goal_usd_cents      bigint not null,
  raised_usd_cents    bigint not null default 0,
  category            text not null default 'extract'
    check (category in ('extract','hydrosol','beverage','ferment','ceremonial')),
  eu_approval_target  text,
  active              boolean not null default true,
  sort_order          int  not null default 0,
  created_at          timestamptz not null default now()
);

-- ── MVPs / Paid Pilots ───────────────────────────────────────────────────────
create table if not exists mvps (
  id              uuid primary key default gen_random_uuid(),
  technology_id   uuid not null references technologies(id) on delete cascade,
  name            text not null,
  description     text,
  sku             text unique,
  size_label      text,
  price_usd_cents int  not null,
  price_cop       int,
  stripe_price_id text,
  stock           int  not null default 0,
  image_url       text,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ── Lot investments ──────────────────────────────────────────────────────────
create table if not exists lot_investments (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  technology_id    uuid not null references technologies(id),
  order_id         uuid not null references orders(id),
  lots_count       int  not null default 1,
  amount_usd_cents int  not null,
  amount_cop       int,
  currency         text not null default 'USD'
    check (currency in ('USD','COP','EUR')),
  caua_role        text,
  created_at       timestamptz not null default now()
);

-- ── Extended orders columns ──────────────────────────────────────────────────
alter table orders
  add column if not exists technology_id            uuid references technologies(id),
  add column if not exists mvp_id                  uuid references mvps(id),
  add column if not exists lots_count              int  not null default 1,
  add column if not exists currency                text not null default 'USD',
  add column if not exists payment_provider        text not null default 'stripe',
  add column if not exists mercadopago_preference_id text;

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table technologies    enable row level security;
alter table mvps            enable row level security;
alter table lot_investments enable row level security;

create policy "tech_public_read"  on technologies    for select using (true);
create policy "mvps_public_read"  on mvps            for select using (true);
create policy "lots_own_read"     on lot_investments for select using (auth.uid() = user_id);
create policy "lots_own_insert"   on lot_investments for insert with check (auth.uid() = user_id);

-- ── Trigger: auto-update lots_funded + raised_usd_cents ─────────────────────
create or replace function update_technology_funding()
returns trigger language plpgsql security definer as $$
begin
  update technologies
  set lots_funded      = lots_funded      + new.lots_count,
      raised_usd_cents = raised_usd_cents + new.amount_usd_cents
  where id = new.technology_id;
  return new;
end;
$$;

create trigger on_lot_investment_created
  after insert on lot_investments
  for each row execute procedure update_technology_funding();

-- ── Seed data ────────────────────────────────────────────────────────────────
-- MucilageExtract™
insert into technologies (
  slug, name, tagline,
  input_description, process_steps, output_description,
  lot_price_cop, lot_price_usd_cents, lots_total,
  goal_usd_cents, raised_usd_cents, lots_funded,
  category, eu_approval_target, sort_order
) values (
  'mucilage-extract',
  'MucilageExtract™',
  'Liofilización criogénica de pulpa de cacao criollo élite',
  '40 kg de mucílago fresco de finca certificada (criollo élite)',
  '[
    {"step":1,"label":"Cold Pressing","icon":"⚙️","detail":"Extracción mecánica en frío — conserva bioactivos"},
    {"step":2,"label":"Ultra-Freeze −20°C","icon":"❄️","detail":"Congelación ultrarrápida para detener oxidación"},
    {"step":3,"label":"Blast Freeze −80°C","icon":"🧊","detail":"Crioconservación profunda — temperatura vítrea"},
    {"step":4,"label":"Liofilización +30°C","icon":"🌡️","detail":"Sublimación controlada · curva 30°C · <2% humedad"}
  ]'::jsonb,
  '20 kg pulpa liofilizada + 2 kg mucílago puro (<2% humedad)',
  1000000, 25000, 1000,
  25000000, 1725000, 69,
  'extract',
  'Novel Food EU Regulation 2015/2283',
  1
);

-- HydroSol™
insert into technologies (
  slug, name, tagline,
  input_description, process_steps, output_description,
  lot_price_cop, lot_price_usd_cents, lots_total,
  goal_usd_cents, raised_usd_cents, lots_funded,
  category, eu_approval_target, sort_order
) values (
  'hydrosol',
  'HydroSol™',
  'Destilación de hidrosoles de cacao para industria de bebidas',
  '60 kg de baba de cacao (híbridos acriollados + trinitarios)',
  '[
    {"step":1,"label":"Selección varietal","icon":"🌱","detail":"Híbridos acriollados y trinitarios certificados"},
    {"step":2,"label":"Prensado + vapor","icon":"💧","detail":"Destilación por arrastre de vapor a 100°C"},
    {"step":3,"label":"Separación","icon":"⚗️","detail":"Separación agua floral + aceite esencial"},
    {"step":4,"label":"Filtración fría","icon":"🧪","detail":"Micro-filtración 0.22µm · estabilización de pH"}
  ]'::jsonb,
  '15 L hidrosol premium + 50 mL aceite esencial de cacao',
  800000, 20000, 500,
  10000000, 400000, 20,
  'hydrosol',
  'EFSA Botanical Substances List',
  2
);

-- TheobromaBrew™
insert into technologies (
  slug, name, tagline,
  input_description, process_steps, output_description,
  lot_price_cop, lot_price_usd_cents, lots_total,
  goal_usd_cents, raised_usd_cents, lots_funded,
  category, eu_approval_target, sort_order
) values (
  'theobroma-brew',
  'TheobromaBrew™',
  'Fermentación fría y bebidas funcionales de mucílago',
  '20 kg baba de cacao liofilizada MucilageExtract™',
  '[
    {"step":1,"label":"Rehidratación","icon":"🫙","detail":"Rehidratación controlada 4°C — 12h"},
    {"step":2,"label":"Fermentación","icon":"🦠","detail":"Lactofermentación espontánea 48h con probióticos nativos"},
    {"step":3,"label":"Cold Brew","icon":"☕","detail":"Maceración en frío 72h · 0°C — extrae cafeína + teobromina"},
    {"step":4,"label":"Embotellado","icon":"🍶","detail":"Carbonatación natural + envasado en N₂ inerte"}
  ]'::jsonb,
  '200 L bebida funcional · 400 botellas 500mL',
  600000, 15000, 300,
  5000000, 0, 0,
  'beverage',
  'EFSA Novel Food Authorization',
  3
);

-- MVPs for MucilageExtract™
insert into mvps (technology_id, name, description, sku, size_label, price_usd_cents, price_cop, stock)
select id, 'Baba de Cacao',
  'Pulpa liofilizada 100% cacao criollo élite · Bebible · Sin aditivos',
  'MVP-BAB-100G', '100g', 2000, 80000, 500
from technologies where slug = 'mucilage-extract';

insert into mvps (technology_id, name, description, sku, size_label, price_usd_cents, price_cop, stock)
select id, 'Mucílago Puro',
  'Sachets concentrados · mucílago liofilizado puro · <2% humedad',
  'MVP-MUC-50G', '50g', 1500, 60000, 300
from technologies where slug = 'mucilage-extract';

-- MVPs for HydroSol™
insert into mvps (technology_id, name, description, sku, size_label, price_usd_cents, price_cop, stock)
select id, 'Hidrosol de Cacao',
  'Agua floral de cacao premium · Uso cosmético + alimentario · IaaS B2B',
  'MVP-HYD-100ML', '100mL', 3500, 140000, 150
from technologies where slug = 'hydrosol';

-- MVPs for TheobromaBrew™
insert into mvps (technology_id, name, description, sku, size_label, price_usd_cents, price_cop, stock)
select id, 'SUNRISE SHOT Fermentado',
  'Bebida funcional · mucílago fermentado · probióticos nativos · 0% azúcar',
  'MVP-SUN-250ML', '250mL', 1200, 48000, 400
from technologies where slug = 'theobroma-brew';
