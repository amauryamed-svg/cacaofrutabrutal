-- ═══════════════════════════════════════════════════════════════════
-- CAUA Corporation — Hourly vitals evaluation cron
-- Migration 037c · Phase 1.5 of the Fruit-Ninja arc
-- ═══════════════════════════════════════════════════════════════════
--
-- Schedules an hourly call to the `evaluate-tree-vitals` Edge Function
-- via pg_cron + pg_net. The function transitions tree state:
--
--   - Vitals all ≥ VITAL_THRESHOLD → vitals_critical_since = NULL
--   - Any vital < threshold AND vitals_critical_since IS NULL
--     → vitals_critical_since = NOW()
--   - vitals_critical_since IS NOT NULL AND > VITAL_GRACE_HOURS atrás
--     → died_at = NOW() + emit tree_death_burn token_event (existing path)
--
-- Why an Edge Function and not pure SQL: el burn de tokens cuando un árbol
-- muere ya está implementado en el Edge Function tree-death-forfeit (que
-- usa el ledger view). Reutilizamos esa misma lógica desde
-- evaluate-tree-vitals para mantener un solo path de muerte.
--
-- Requires the `pg_cron` and `pg_net` extensions (Supabase enables both
-- by default on the postgres role).
--
-- Idempotent: select cron.unschedule first if exists.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Unschedule any prior version of this job (idempotent re-run safety).
do $$
declare j record;
begin
  for j in select jobid, jobname from cron.job where jobname = 'evaluate-tree-vitals-hourly'
  loop
    perform cron.unschedule(j.jobid);
  end loop;
end $$;

-- Schedule: at minute 0 of every hour, hit the Edge Function with a
-- bearer token (ADMIN_BEARER_TOKEN) so the function can verify the call
-- comes from the cron, not from a user.
--
-- Note: the URL is project-specific and the token is read from a Postgres
-- setting that an admin sets via:
--   alter database postgres set app.admin_bearer_token = '...';
--   alter database postgres set app.functions_url = 'https://kjygovuiphbxcdxeduco.supabase.co/functions/v1';
-- This avoids hard-coding secrets in the migration file.
select cron.schedule(
  'evaluate-tree-vitals-hourly',
  '0 * * * *',
  $cron$
  select net.http_post(
    url     := current_setting('app.functions_url', true) || '/evaluate-tree-vitals',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.admin_bearer_token', true),
      'Content-Type',  'application/json'
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $cron$
);

comment on extension pg_cron is
  'Hourly evaluate-tree-vitals job — see migration 037c. Vitals-based '
  'death replaces the legacy 5h-post-maturity timer.';
