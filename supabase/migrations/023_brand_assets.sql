-- Migration 023: Brand assets registry — in-house source of truth
-- Frees us from external CDN dependencies (HubSpot, third-party hosts).
-- Bytes stored as bytea so the DB is authoritative even if Vercel/repo state diverges.
-- Canonical OG thumbnails, logos, and social cards live here.

create table if not exists public.brand_assets (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null unique,
  mime          text        not null,
  width         int,
  height        int,
  bytes_size    int         not null,
  sha256        text        not null,
  bytes         bytea       not null,
  is_canonical  boolean     not null default false,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.brand_assets is
  'In-house brand asset registry. Authoritative source for OG thumbnails, logos, social cards. Independent of external CDN/hosts.';

create index if not exists brand_assets_name_idx on public.brand_assets (name);
create index if not exists brand_assets_canonical_idx on public.brand_assets (is_canonical) where is_canonical;

alter table public.brand_assets enable row level security;

-- Public can read metadata (and bytes if they hit the row directly via service-role-fronted API).
create policy "brand_assets_select_public" on public.brand_assets
  for select using (true);

-- Writes restricted to service_role (Edge Functions / migrations) — no permissive write policy means
-- anon/authenticated cannot INSERT/UPDATE/DELETE via PostgREST. Service role bypasses RLS.

create or replace function public.brand_assets_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger brand_assets_updated_at
  before update on public.brand_assets
  for each row execute function public.brand_assets_set_updated_at();
