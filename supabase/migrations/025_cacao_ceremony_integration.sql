-- ─────────────────────────────────────────────────────────────────
-- 023 — Cacao Ceremony (Cauacolombia.co Shopify) integration
-- Phase 1: discount codes issued to CFB users
-- Phase 2 (next): inbound orders from Shopify webhook
-- ─────────────────────────────────────────────────────────────────

-- Discount codes generated for users redeeming token / adoption benefits
create table if not exists cacao_ceremony_discounts (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  shopify_code             text not null unique,
  shopify_price_rule_id    text,
  discount_pct             int not null check (discount_pct between 0 and 100),
  trees_at_issue           int not null default 0,
  mazorcas_spent           int not null default 0 check (mazorcas_spent >= 0),
  status                   text not null default 'active'
                           check (status in ('active','used','expired','revoked')),
  expires_at               timestamptz,
  used_at                  timestamptz,
  used_order_id            text,
  metadata                 jsonb default '{}'::jsonb,
  created_at               timestamptz not null default now()
);

create index if not exists idx_ceremony_discounts_user on cacao_ceremony_discounts(user_id);
create index if not exists idx_ceremony_discounts_code on cacao_ceremony_discounts(shopify_code);
create index if not exists idx_ceremony_discounts_status on cacao_ceremony_discounts(status) where status = 'active';

alter table cacao_ceremony_discounts enable row level security;

create policy "ceremony_discounts_own_read" on cacao_ceremony_discounts
  for select using ((select auth.uid()) = user_id);

-- Inbound order log (populated by shopify-webhook in Phase 2)
create table if not exists cacao_ceremony_orders (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid references auth.users(id) on delete set null,
  shopify_order_id         text not null unique,
  shopify_order_number     text,
  shopify_email            text not null,
  shopify_discount_code    text references cacao_ceremony_discounts(shopify_code) on delete set null,
  amount_cents             int not null,
  currency                 text not null default 'USD',
  line_items_count         int default 1,
  status                   text not null default 'paid'
                           check (status in ('paid','refunded','cancelled','pending')),
  tokens_awarded           jsonb,
  raw_event                jsonb,
  created_at               timestamptz not null default now()
);

create index if not exists idx_ceremony_orders_user on cacao_ceremony_orders(user_id);
create index if not exists idx_ceremony_orders_email on cacao_ceremony_orders(shopify_email);
create index if not exists idx_ceremony_orders_created on cacao_ceremony_orders(created_at desc);

alter table cacao_ceremony_orders enable row level security;

create policy "ceremony_orders_own_read" on cacao_ceremony_orders
  for select using ((select auth.uid()) = user_id);

-- Helper: count adopted trees per user (used by Edge Function for tier calc)
-- Definer = SECURITY DEFINER so service_role and end users get same result
create or replace function get_user_tree_count(p_user_id uuid)
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int from cacao_trees where user_id = p_user_id;
$$;

grant execute on function get_user_tree_count(uuid) to authenticated, service_role;

-- Drop legacy CHECK on token_events.event_type (migration 010 added a narrow whitelist
-- that already conflicts with newer event types like 'tree_adoption', 'mazorca_redeem_ceremony').
-- Validation lives in the Edge Function layer.
do $$
declare
  v_constraint text;
begin
  select conname into v_constraint
    from pg_constraint
   where conrelid = 'public.token_events'::regclass
     and contype = 'c'
     and pg_get_constraintdef(oid) ilike '%event_type%';
  if v_constraint is not null then
    execute format('alter table public.token_events drop constraint %I', v_constraint);
  end if;
end $$;

-- Atomic mazorca debit (used by create-shopify-discount Edge Function).
-- Decrements balance and writes a negative ledger entry in token_events.
create or replace function debit_mazorcas(p_user_id uuid, p_amount int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_balance int;
begin
  if p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;

  update user_profiles
     set mazorcas_balance = mazorcas_balance - p_amount
   where user_id = p_user_id and mazorcas_balance >= p_amount
  returning mazorcas_balance into v_new_balance;

  if v_new_balance is null then
    raise exception 'Insufficient mazorcas balance for user %', p_user_id;
  end if;

  insert into token_events (user_id, event_type, beans, mazorcas, ref_id)
  values (p_user_id, 'mazorca_redeem_ceremony', 0, -p_amount, null);

  return v_new_balance;
end;
$$;

grant execute on function debit_mazorcas(uuid, int) to service_role;
