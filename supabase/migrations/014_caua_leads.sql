-- ============================================================
-- Migration 011: caua_leads — Opt-in público de Caua-coti
-- ============================================================
-- Captura emails de visitantes de cualquier Caua-coti.
-- No requiere auth — insertable por anon con RLS permisiva.
-- ============================================================

create table if not exists public.caua_leads (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  source        text not null default 'unknown',   -- ej: 'caua-coti/andrea-rojas'
  metadata      jsonb not null default '{}'::jsonb, -- { participants, tiempos, ceremonial }
  created_at    timestamptz not null default now()
);

-- Índice para buscar por email y fuente
create index if not exists caua_leads_email_idx  on public.caua_leads (email);
create index if not exists caua_leads_source_idx on public.caua_leads (source);

-- ── RLS ─────────────────────────────────────────────────────
alter table public.caua_leads enable row level security;

-- Cualquier visitante (anon o autenticado) puede insertar su propio lead
create policy "anon_insert_lead"
  on public.caua_leads for insert
  to anon, authenticated
  with check (true);

-- Solo service_role (FastAPI CRM) puede leer todos los leads
create policy "service_read_leads"
  on public.caua_leads for select
  to service_role
  using (true);

-- Solo service_role puede borrar
create policy "service_delete_leads"
  on public.caua_leads for delete
  to service_role
  using (true);
