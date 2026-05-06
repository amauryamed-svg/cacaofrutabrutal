-- 041 — Alchemy event payloads + autoconfirm trigger + pg_cron catch-up.
-- Phase 5 cadena infrastructure. See memory project_alchemy_chain_e2e_verified.md
-- for the full journey + 6 root causes that led to this design.
--
-- Architecture:
--   Edge Function alchemy-nft-webhook v31+ → INSERT raw payload to alchemy_event_payloads
--   pg_cron 'alchemy-catchup-confirm' (every 1 min) → set-based UPDATE flips matching
--   adoption_charges from submitted → confirmed. Latency ≤ 60s.
--
-- The trigger _alchemy_debug_autoconfirm is kept as a fallback (works on synthetic
-- INSERTs) but doesn't fire reliably for PostgREST-driven INSERTs with the new
-- sb_secret_* keys. pg_cron is the source of truth.

-- ─── Table for raw Alchemy webhook payloads ────────────────────────────
create table if not exists public.alchemy_event_payloads (
  id           uuid primary key default gen_random_uuid(),
  received_at  timestamptz not null default now(),
  payload      jsonb,
  event_keys   text[],
  data_keys    text[],
  block_keys   text[],
  logs_len     int,
  first_log    jsonb,
  activity_len int,
  first_activity jsonb
);

create index if not exists idx_alchemy_event_payloads_received_at
  on public.alchemy_event_payloads (received_at desc);

alter table public.alchemy_event_payloads enable row level security;
-- No policies = service-role-only access (which is what alchemy-nft-webhook uses).

comment on table public.alchemy_event_payloads is
  'Raw Alchemy webhook payloads. Source for the pg_cron alchemy-catchup-confirm job that flips adoption_charges from submitted→confirmed. 7-day retention via daily cron sweep.';

-- ─── Autoconfirm trigger function (set-based, not iterative) ──────────
create or replace function public._alchemy_debug_autoconfirm()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.event_keys is null or not (NEW.event_keys @> array['data']) then
    return NEW;
  end if;

  -- TreeAdopted on TreeAdoption.sol → flip pending charge to confirmed
  update public.adoption_charges ac
  set status = 'confirmed', confirmed_at = now()
  from jsonb_array_elements(
         coalesce(NEW.payload->'event'->'data'->'block'->'logs', '[]'::jsonb)
       ) as je
  where lower(coalesce(je->'account'->>'address','')) = '0x1c6724cdfe8906ae5a2042c431169b6987755711'
    and ac.tx_hash = lower(coalesce(je->'transaction'->>'hash',''))
    and ac.status in ('pending','submitted');

  -- ERC-721 Transfer (mint) on CacaoTreeNFT → set token_id + owner
  update public.cacao_trees ct
  set nft_token_id = ('x' || lpad(replace(je->'topics'->>3, '0x', ''), 16, '0'))::bit(64)::bigint,
      owner_wallet = lower('0x' || right(je->'topics'->>2, 40))
  from jsonb_array_elements(
         coalesce(NEW.payload->'event'->'data'->'block'->'logs', '[]'::jsonb)
       ) as je
  where lower(coalesce(je->'account'->>'address','')) = '0xf5f2de2237334680fc74cfd1dbcfaf5e5285ad23'
    and lower(coalesce(je->'topics'->>0,'')) = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    and lower('0x' || right(je->'topics'->>1, 40)) = '0x0000000000000000000000000000000000000000'
    and ct.nft_mint_tx = lower(coalesce(je->'transaction'->>'hash',''))
    and (je->'topics'->>3) is not null;

  update public.tree_mints tm
  set status = 'confirmed', confirmed_at = now()
  from jsonb_array_elements(
         coalesce(NEW.payload->'event'->'data'->'block'->'logs', '[]'::jsonb)
       ) as je
  where lower(coalesce(je->'account'->>'address','')) = '0xf5f2de2237334680fc74cfd1dbcfaf5e5285ad23'
    and lower(coalesce(je->'topics'->>0,'')) = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    and lower('0x' || right(je->'topics'->>1, 40)) = '0x0000000000000000000000000000000000000000'
    and tm.tx_hash = lower(coalesce(je->'transaction'->>'hash',''));

  return NEW;
end;
$$;

drop trigger if exists alchemy_event_payloads_autoconfirm on public.alchemy_event_payloads;
create trigger alchemy_event_payloads_autoconfirm
  after insert on public.alchemy_event_payloads
  for each row execute function public._alchemy_debug_autoconfirm();

-- ENABLE ALWAYS in case PostgREST sets session_replication_role=replica.
alter table public.alchemy_event_payloads
  enable always trigger alchemy_event_payloads_autoconfirm;

-- ─── pg_cron jobs ─────────────────────────────────────────────────────
create extension if not exists pg_cron;

-- Catch-up sync: every minute, flip any matching pending/submitted charges.
-- Source of truth for cadena correctness — the trigger above is best-effort.
select cron.schedule(
  'alchemy-catchup-confirm',
  '* * * * *',
  $cmd$
    update public.adoption_charges ac
    set status = 'confirmed', confirmed_at = now()
    from public.alchemy_event_payloads p,
         lateral jsonb_array_elements(coalesce(p.payload->'event'->'data'->'block'->'logs', '[]'::jsonb)) as je
    where lower(coalesce(je->'account'->>'address','')) = '0x1c6724cdfe8906ae5a2042c431169b6987755711'
      and ac.tx_hash = lower(coalesce(je->'transaction'->>'hash',''))
      and ac.status in ('pending','submitted')
      and p.received_at >= now() - interval '15 minutes';
  $cmd$
)
on conflict do nothing;

-- 7-day retention sweep on alchemy_event_payloads.
select cron.schedule(
  'alchemy-payloads-retention',
  '0 3 * * *',
  $cmd$delete from public.alchemy_event_payloads where received_at < now() - interval '7 days';$cmd$
)
on conflict do nothing;
