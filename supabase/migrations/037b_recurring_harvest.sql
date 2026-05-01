-- ═══════════════════════════════════════════════════════════════════
-- CAUA Corporation — Recurring harvest + vital-based death
-- Migration 037b · Phase 1.5 of the Fruit-Ninja arc
-- ═══════════════════════════════════════════════════════════════════
--
-- Refactors cocoa-tree lifecycle:
--
--   - Cosecha pasa de one-time a recurrente.
--     `cacao_trees.harvested_at` se mantiene (compat) pero ya NO actúa
--     como lock; se conserva como timestamp de la PRIMERA cosecha.
--   - `last_harvest_at` es el timestamp del ciclo actual; lo lee
--     `isHarvestReady` para decidir si volvió a estar listo.
--   - `harvest_count` rastrea el total de cosechas de un árbol.
--
--   - Muerte por TIMER absoluto (5h post-Maduración) ya NO ocurre.
--     Solo se setea `died_at` cuando un árbol descuidado supera
--     VITAL_GRACE_HOURS con `vitals_critical_since` activo.
--   - `vitals_critical_since` lo poblá un cron horario:
--     - Vitals todos ≥ umbral → resetea a NULL (recuperación)
--     - Cualquier vital < umbral y NULL → setea a NOW()
--     - NOT NULL y > VITAL_GRACE_HOURS atrás → setea died_at = NOW()
--
-- Idempotente.

-- ── Columnas ───────────────────────────────────────────────────────
alter table public.cacao_trees
  add column if not exists last_harvest_at        timestamptz,
  add column if not exists harvest_count          integer not null default 0,
  add column if not exists vitals_critical_since  timestamptz;

-- Backfill: árboles ya cosechados → last_harvest_at = harvested_at,
-- harvest_count = 1 si harvested_at no es NULL. Cero efecto si ya tiene
-- last_harvest_at poblado.
update public.cacao_trees
   set last_harvest_at = harvested_at,
       harvest_count   = 1
 where harvested_at is not null
   and last_harvest_at is null;

-- ── Índices para el cron ──────────────────────────────────────────
create index if not exists idx_cacao_trees_vitals_critical_since
  on public.cacao_trees(vitals_critical_since)
  where died_at is null;

create index if not exists idx_cacao_trees_last_harvest_at
  on public.cacao_trees(last_harvest_at);

-- ── Helper view: trees a evaluar por el cron ──────────────────────
-- Solo árboles vivos. La función Edge corre el algoritmo de transición
-- de estado (sano ↔ critical ↔ dead) por cada row.
create or replace view tree_vital_evaluation as
select
  id,
  user_id,
  guardian_id,
  health,
  moisture,
  sunlight,
  vitals_critical_since,
  greatest(coalesce(extract(epoch from now() - vitals_critical_since) / 3600, 0), 0) as hours_critical,
  -- min vital (any one below threshold = below)
  least(coalesce(health, 100), coalesce(moisture, 100), coalesce(sunlight, 100)) as min_vital
from public.cacao_trees
where died_at is null;

comment on view tree_vital_evaluation is
  'Per-tree vital snapshot consumed by evaluate-tree-vitals Edge Function. '
  'min_vital is the worst of (health, moisture, sunlight). hours_critical '
  'is the elapsed time since vitals went critical (0 if never).';
