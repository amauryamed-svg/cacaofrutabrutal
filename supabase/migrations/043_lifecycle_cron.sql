-- Migration 041 — Lifecycle email cron + idempotency
--
-- Wires the send-lifecycle-email Edge Function to pg_cron so the 6-touch
-- inbound funnel (D1/D3/D7/D14/D21/D28) ships automatically instead of
-- requiring a founder to click "Send" in AdminCRM per tree per day.
--
-- Spec: ~/Documents/Caua/integrations/social/04-CAMPANA-CAUA-CREYENTES.md
-- Replaces: manual invocation of send-tree-status-email from AdminCRM
--
-- Prereq:
--   - pg_cron extension enabled in the project (Supabase Dashboard → Database → Extensions)
--   - pg_net extension enabled (for net.http_post)
--   - LIFECYCLE_CRON_SECRET set in Edge Function env
--   - Vault secret `lifecycle_cron_secret` matching the env value
--   - Vault secret `project_url` = https://<ref>.supabase.co

set local search_path = public;

-- ─── Idempotency table ───────────────────────────────────────────
create table if not exists lifecycle_schedule (
  tree_id        uuid        not null references cacao_trees(id) on delete cascade,
  day_offset     smallint    not null check (day_offset in (1, 3, 7, 14, 21, 28)),
  status         text        not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  resend_id      text,
  sent_at        timestamptz,
  attempted_at   timestamptz,
  last_error     text,
  created_at     timestamptz not null default now(),
  primary key (tree_id, day_offset)
);

create index if not exists lifecycle_schedule_status_idx
  on lifecycle_schedule (status, day_offset)
  where status in ('pending', 'failed');

comment on table lifecycle_schedule is
  'One row per (tree, lifecycle-day) intent. Guarantees a single delivery per email per tree.';

-- ─── RLS — only founders read, service_role writes ─────────────
alter table lifecycle_schedule enable row level security;

drop policy if exists lifecycle_schedule_founder_read on lifecycle_schedule;
create policy lifecycle_schedule_founder_read
  on lifecycle_schedule for select
  using (is_founder_cached((select auth.uid())));

-- Service role writes via Edge Function — no insert/update/delete policy
-- needed (service_role bypasses RLS).

-- ─── pg_cron jobs ────────────────────────────────────────────────
-- One job per day-offset. Each job runs at a different minute to avoid
-- hammering Resend in parallel. Runs once daily at ~13:00 UTC = 08:00 COT
-- (early morning Colombia time — emails land before users start their day).

-- Clean up any prior schedule entries with the same job names (idempotent)
do $$
declare
  job_name text;
begin
  for job_name in
    select jobname from cron.job
    where jobname like 'lifecycle_d%'
  loop
    perform cron.unschedule(job_name);
  end loop;
end $$;

-- Helper to schedule a day-offset job.
-- Uses net.http_post + vault.read_secret for secret hygiene.
create or replace function schedule_lifecycle_job(p_day smallint, p_cron_minute int)
returns void
language plpgsql
security definer
as $$
declare
  v_project_url   text;
  v_cron_secret   text;
  v_cron_expr     text;
begin
  select decrypted_secret into v_project_url
    from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_cron_secret
    from vault.decrypted_secrets where name = 'lifecycle_cron_secret';

  if v_project_url is null or v_cron_secret is null then
    raise exception 'vault secrets project_url and lifecycle_cron_secret must be set';
  end if;

  v_cron_expr := format('%s 13 * * *', p_cron_minute);

  perform cron.schedule(
    format('lifecycle_d%s', p_day),
    v_cron_expr,
    format($job$
      select net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', %L
        ),
        body := jsonb_build_object('day', %s)
      ) as request_id;
    $job$, v_project_url || '/functions/v1/send-lifecycle-email', v_cron_secret, p_day)
  );
end $$;

-- Schedule the 6 lifecycle days at staggered minutes (13:00–13:25 UTC).
select schedule_lifecycle_job(1::smallint, 0);
select schedule_lifecycle_job(3::smallint, 5);
select schedule_lifecycle_job(7::smallint, 10);
select schedule_lifecycle_job(14::smallint, 15);
select schedule_lifecycle_job(21::smallint, 20);
select schedule_lifecycle_job(28::smallint, 25);

-- ─── Backfill — schedule existing adopted trees ──────────────────
-- For trees adopted before this migration, the cron will pick them up
-- naturally as their adopted_at + day_offset hits the daily window.
-- No retroactive flood — only future cohorts get the lifecycle.

-- ─── Monitoring view ─────────────────────────────────────────────
create or replace view lifecycle_health as
select
  day_offset,
  status,
  count(*)                                       as tree_count,
  count(*) filter (where sent_at > now() - interval '24 hours') as sent_last_24h,
  max(sent_at)                                   as last_sent_at,
  max(attempted_at) filter (where status = 'failed') as last_failure_at
from lifecycle_schedule
group by day_offset, status
order by day_offset, status;

comment on view lifecycle_health is
  'Operational health: deliveries per day-offset per status. Alert if any day_offset has >5 failed rows in 24h.';

-- ─── Notify on completion ────────────────────────────────────────
do $$
begin
  raise notice 'Migration 041 applied. pg_cron jobs scheduled: lifecycle_d1, d3, d7, d14, d21, d28.';
  raise notice 'Verify with: select * from cron.job where jobname like ''lifecycle_d%%'';';
  raise notice 'Monitor with: select * from lifecycle_health;';
end $$;
