-- 032 — IoT device registry + Ed25519-signed readings + Merkle attestation roots
-- Phase 6 of the Web3 transformation. See docs/WEB3.md, contracts/src/IoTAttestation.sol.
--
-- Each Guardian has 1+ ESP32 devices. Each device holds an Ed25519 keypair;
-- pubkey is registered here. Readings are signed by the device and verified
-- in api/iot_receiver.py before insertion. Verified readings are merkle-rooted
-- weekly and posted on-chain via post-iot-root Edge Function.

create table if not exists public.iot_devices (
  id              uuid primary key default gen_random_uuid(),
  device_id       text unique not null,        -- human label, e.g. 'esp32-lucho-01'
  guardian_id     smallint not null references public.guardians(id),
  tree_id         uuid references public.cacao_trees(id) on delete set null,
  pubkey_hex      text not null,               -- Ed25519 pubkey, 64 hex chars (32 bytes)
  firmware_hash   text,                        -- sha256 of firmware build for attestation
  active          boolean not null default true,
  rotated_from    uuid references public.iot_devices(id),
  registered_at   timestamptz not null default now(),
  last_seen_at    timestamptz,
  notes           text
);

create unique index if not exists uniq_iot_devices_pubkey
  on public.iot_devices (lower(pubkey_hex))
  where active = true;
create index if not exists idx_iot_devices_guardian on public.iot_devices (guardian_id);
create index if not exists idx_iot_devices_tree     on public.iot_devices (tree_id);

-- ─── iot_readings_signed ─────────────────────────────────────────────
-- Append-only. Each row was signature-verified at insert time.
-- ml_predictor.py reads from this table (not legacy iot_readings) for verified-only inputs.

create table if not exists public.iot_readings_signed (
  id            uuid primary key default gen_random_uuid(),
  device_id     text not null references public.iot_devices(device_id),
  tree_id       uuid references public.cacao_trees(id) on delete set null,
  recorded_at   timestamptz not null,
  temp_c        numeric(5,2),
  soil_moisture numeric(5,2),
  sunlight_lux  bigint,
  reading_nonce text not null,                  -- per-reading nonce, prevents replay
  signature_hex text not null,                  -- Ed25519 signature, 128 hex chars (64 bytes)
  payload_hash  bytea not null,                 -- sha256(canonical_json) — leaf for Merkle tree
  week_index    int not null,                   -- ISO weekIndex used by IoTAttestation contract
  created_at    timestamptz not null default now()
);

create unique index if not exists uniq_iot_signed_nonce
  on public.iot_readings_signed (device_id, reading_nonce);
create index if not exists idx_iot_signed_week    on public.iot_readings_signed (week_index);
create index if not exists idx_iot_signed_tree    on public.iot_readings_signed (tree_id);
create index if not exists idx_iot_signed_recent  on public.iot_readings_signed (recorded_at desc);

-- ─── iot_attestation_roots ───────────────────────────────────────────
-- One row per (week_index, contract). Posted on-chain → tx_hash filled in.

create table if not exists public.iot_attestation_roots (
  id            uuid primary key default gen_random_uuid(),
  week_index    int not null,
  root          bytea not null,
  leaf_count    int not null,
  contract      text not null,
  chain_id      int not null,
  tx_hash       text,
  status        text not null default 'computed'
                 check (status in ('computed','submitted','confirmed','failed')),
  computed_at   timestamptz not null default now(),
  confirmed_at  timestamptz,
  error_message text
);

create unique index if not exists uniq_iot_roots_week_contract
  on public.iot_attestation_roots (week_index, lower(contract));

-- ─── RLS ──────────────────────────────────────────────────────────────

alter table public.iot_devices            enable row level security;
alter table public.iot_readings_signed    enable row level security;
alter table public.iot_attestation_roots  enable row level security;

-- Devices: users see devices for trees they own; founders see all.
drop policy if exists "user_reads_own_devices" on public.iot_devices;
create policy "user_reads_own_devices" on public.iot_devices
  for select using (
    tree_id in (select id from public.cacao_trees where user_id = (select auth.uid()))
    or (select auth.uid()) in (
      select user_id from public.user_profiles where caua_role = 'founder'
    )
  );

-- Readings: same — user owns tree.
drop policy if exists "user_reads_own_readings" on public.iot_readings_signed;
create policy "user_reads_own_readings" on public.iot_readings_signed
  for select using (
    tree_id in (select id from public.cacao_trees where user_id = (select auth.uid()))
    or (select auth.uid()) in (
      select user_id from public.user_profiles where caua_role = 'founder'
    )
  );

-- Roots are public (they are on-chain anyway).
drop policy if exists "public_read_roots" on public.iot_attestation_roots;
create policy "public_read_roots" on public.iot_attestation_roots
  for select using (true);

-- ─── Helpers ─────────────────────────────────────────────────────────

-- ISO week index used both off-chain (Python/Deno) and on-chain (uint64).
-- Convention: epoch-week = floor(unix_ts / 604800). Stable, monotonic, no DST.
create or replace function public.compute_week_index(ts timestamptz)
returns int
language sql
immutable
as $$
  select (extract(epoch from ts)::bigint / 604800)::int;
$$;

-- ─── Comments ────────────────────────────────────────────────────────

comment on table public.iot_devices is
  'ESP32 device registry. pubkey_hex is the Ed25519 public key used to verify signed readings.';
comment on column public.iot_devices.rotated_from is
  'If this device replaced a compromised one, points at the prior row (also flipped active=false).';
comment on table public.iot_readings_signed is
  'Append-only ledger of signature-verified IoT readings. Source-of-truth for ml_predictor.py + weekly Merkle root.';
comment on column public.iot_readings_signed.payload_hash is
  'SHA-256(canonical_json) — used as Merkle tree leaf. Canonical JSON = sorted keys, no whitespace.';
comment on table public.iot_attestation_roots is
  'Weekly Merkle roots committed to IoTAttestation contract. status flips on Alchemy/cron confirmation.';
