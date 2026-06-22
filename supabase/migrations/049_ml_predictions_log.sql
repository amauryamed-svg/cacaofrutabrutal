-- Migration 049: ml_predictions_log — audit trail for ML predictions
-- RLS: service_role INSERT only (ML microservice), founder SELECT for audit.
-- anon_token = SHA-256(user_id + tree_id + PRIVACY_SALT) — no PII stored.

create table if not exists public.ml_predictions_log (
  id               uuid        primary key default gen_random_uuid(),
  anon_token       text        not null,
  tree_id          uuid        references public.cacao_trees(id) on delete set null,
  temp_c           numeric,
  soil_moisture    numeric,
  sunlight_lux     numeric,
  predicted_health numeric     not null,
  stress_alert     boolean     not null default false,
  created_at       timestamptz not null default now()
);

alter table public.ml_predictions_log enable row level security;

create policy "ml_service_insert" on public.ml_predictions_log
  for insert to service_role with check (true);

create policy "founder_select" on public.ml_predictions_log
  for select using (
    exists (
      select 1 from public.user_profiles
      where user_id = (select auth.uid())
        and caua_role = 'founder'
    )
  );

create index ml_predictions_log_tree_id_idx on public.ml_predictions_log (tree_id);
create index ml_predictions_log_created_at_idx on public.ml_predictions_log (created_at desc);
