-- ═══════════════════════════════════════════════════════════════════
-- CAUA Corporation — Hourly notify-tree-care cron
-- Migration 045 · Phase: launch nurturing emails (cauacolombia.co/creyente)
-- ═══════════════════════════════════════════════════════════════════
--
-- Schedules an hourly call to the `notify-tree-care` Edge Function
-- via pg_cron + pg_net. The function sends Resend emails on critical
-- tree-state transitions: dead, dying, harvest_ready, care_reminder.
--
-- Mirrors the secret-passing pattern in 037c_vitals_cron.sql — bearer
-- token comes from a Postgres setting, not from a hard-coded value:
--   alter database postgres set app.admin_bearer_token = '...';
--   alter database postgres set app.functions_url = 'https://kjygovuiphbxcdxeduco.supabase.co/functions/v1';
--
-- Schedule: minute 15 of every hour. Offset from the vitals cron
-- (minute 0) so we run AFTER `vitals_critical_since` has been updated
-- by 037c — that way `dying` notifications see the freshest state.
--
-- Idempotent: unschedules any prior version of the same job first.

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
declare j record;
begin
  for j in select jobid, jobname from cron.job where jobname = 'notify-tree-care-hourly'
  loop
    perform cron.unschedule(j.jobid);
  end loop;
end $$;

select cron.schedule(
  'notify-tree-care-hourly',
  '15 * * * *',
  $cron$
  select net.http_post(
    url     := current_setting('app.functions_url', true) || '/notify-tree-care',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.admin_bearer_token', true),
      'Content-Type',  'application/json'
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $cron$
);
