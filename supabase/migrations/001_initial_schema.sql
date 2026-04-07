-- ═══════════════════════════════════════════════════════════════════════════
-- CAUA Corporation — Initial Schema
-- Rule: single DB call per session — user_profiles aggregates all user data
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Products ─────────────────────────────────────────────────────────────────
create table if not exists products (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  description      text,
  base_price_cents int  not null check (base_price_cents > 0),
  auction_end      timestamptz,
  stock            int  not null default 0,
  product_type     text not null check (product_type in ('preorder','auction','subscription')),
  image_url        text,
  created_at       timestamptz not null default now()
);

-- ── User profiles (single-fetch aggregate) ───────────────────────────────────
-- All user state in ONE row — queried ONCE on login, cached in React context
create table if not exists user_profiles (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  email               text not null,
  full_name           text,
  avatar_url          text,
  locale              text not null default 'es' check (locale in ('es','en')),
  region              text not null default 'OTHER' check (region in ('EU','US','CO','OTHER')),
  hubspot_contact_id  text,
  referral_code       text unique default substr(md5(random()::text), 1, 8),
  referral_count      int  not null default 0,
  completed_orders    int  not null default 0,
  ritual_streak       int  not null default 0,
  last_seen_at        timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  constraint user_profiles_user_id_unique unique (user_id)
);

-- ── Bids ─────────────────────────────────────────────────────────────────────
create table if not exists bids (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  amount_cents int not null check (amount_cents > 0),
  multiplier  float not null default 1.0 check (multiplier >= 1.0 and multiplier <= 3.0),
  created_at  timestamptz not null default now()
);

-- ── Orders ───────────────────────────────────────────────────────────────────
create table if not exists orders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  product_id        uuid not null references products(id),
  amount_cents      int  not null check (amount_cents > 0),
  stripe_session_id text,
  status            text not null default 'pending'
                    check (status in ('pending','completed','failed','refunded')),
  created_at        timestamptz not null default now()
);

-- ── Rituals ──────────────────────────────────────────────────────────────────
create table if not exists user_rituals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  last_draw_date date not null default current_date,
  streak_count   int  not null default 1,
  total_draws    int  not null default 1,
  constraint user_rituals_user_id_unique unique (user_id)
);

-- ── Referrals ────────────────────────────────────────────────────────────────
create table if not exists user_referrals (
  id          uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id),
  referred_id uuid not null references auth.users(id),
  created_at  timestamptz not null default now(),
  constraint no_self_referral check (referrer_id <> referred_id),
  constraint unique_referral unique (referrer_id, referred_id)
);

-- ── Cookie consents (GDPR/CCPA) ──────────────────────────────────────────────
create table if not exists cookie_consents (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null,
  user_id     uuid references auth.users(id),
  necessary   boolean not null default true,
  analytics   boolean not null default false,
  marketing   boolean not null default false,
  locale      text not null default 'es',
  region      text not null default 'OTHER',
  ip_country  text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════════════════
alter table products        enable row level security;
alter table user_profiles   enable row level security;
alter table bids            enable row level security;
alter table orders          enable row level security;
alter table user_rituals    enable row level security;
alter table user_referrals  enable row level security;
alter table cookie_consents enable row level security;

-- Products: public read
create policy "products_public_read" on products
  for select using (true);

-- User profiles: own row only
create policy "profiles_own_read"   on user_profiles for select using (auth.uid() = user_id);
create policy "profiles_own_insert" on user_profiles for insert with check (auth.uid() = user_id);
create policy "profiles_own_update" on user_profiles for update using (auth.uid() = user_id);

-- Bids: own rows
create policy "bids_own_read"   on bids for select using (auth.uid() = user_id);
create policy "bids_own_insert" on bids for insert with check (auth.uid() = user_id);

-- Orders: own rows
create policy "orders_own_read"   on orders for select using (auth.uid() = user_id);
create policy "orders_own_insert" on orders for insert with check (auth.uid() = user_id);

-- Rituals: own row
create policy "rituals_own"   on user_rituals for all using (auth.uid() = user_id);

-- Referrals: can read own referrals
create policy "referrals_own_read" on user_referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referred_id);

-- Cookie consents: insert always allowed (no auth required), read own
create policy "consents_insert" on cookie_consents for insert with check (true);
create policy "consents_own_read" on cookie_consents
  for select using (user_id is null or auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════════════
-- TRIGGER: auto-create user_profile on signup + update last_seen
-- ════════════════════════════════════════════════════════════════════════════
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (user_id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ════════════════════════════════════════════════════════════════════════════
-- TRIGGER: update counters on order completion (keeps profile aggregate fresh)
-- ════════════════════════════════════════════════════════════════════════════
create or replace function update_profile_on_order()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'completed' and old.status <> 'completed' then
    update public.user_profiles
    set completed_orders = completed_orders + 1
    where user_id = new.user_id;
  end if;
  return new;
end;
$$;

create or replace trigger on_order_completed
  after update on orders
  for each row execute procedure update_profile_on_order();

-- ════════════════════════════════════════════════════════════════════════════
-- SEED: sample products
-- ════════════════════════════════════════════════════════════════════════════
insert into products (name, description, base_price_cents, product_type, stock) values
  ('SUNRISE SHOT',       'Mucílago 20% · Epicatequina · Teobromina',              1200, 'preorder',     100),
  ('SUNSET SHOT',        'Mucílago 40% · Doble concentración funcional',          1800, 'preorder',      75),
  ('CACAO CEREMONIAL',   'Fine-flavor criollo · Huila · 250g bloque puro',        3500, 'auction',       50),
  ('EDICIÓN GUARDIÁN',   'Kit numerado · 5 orígenes · Colección limitada',        8500, 'auction',       12),
  ('CÍRCULO SUMAPAZ',    'Suscripción mensual · Cacao + Ritual + Comunidad',      4500, 'subscription', 999),
  ('COLD BREW CACAO',    'Fermentado en frío · Probióticos naturales',            2200, 'preorder',      60)
on conflict do nothing;
