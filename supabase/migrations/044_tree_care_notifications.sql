-- ═══════════════════════════════════════════════════════════════════
-- CAUA Corporation — tree_care_notifications
-- Migration 044 · Phase: launch nurturing emails (cauacolombia.co/creyente)
-- ═══════════════════════════════════════════════════════════════════
--
-- One row per email sent by the `notify-tree-care` Edge Function.
-- Used both as an audit log and as a dedupe key — the unique index on
-- (tree_id, notification_type, sent_at::date) enforces "max one email of
-- each type per tree per UTC day", which is what the function relies on
-- via INSERT ON CONFLICT DO NOTHING to claim a send slot.
--
-- The `care_reminder` lookup ("send only once ever per tree") is a
-- simple SELECT in the function — no extra index needed because the
-- (user_id, sent_at) index plus the unique-per-day index already make
-- per-tree filters cheap at this scale.

create table tree_care_notifications (
  id                uuid primary key default gen_random_uuid(),
  tree_id           uuid not null references cacao_trees(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  notification_type text not null check (notification_type in ('harvest_ready','dying','dead','care_reminder')),
  sent_at           timestamptz default now(),
  resend_message_id text
);

-- One email per tree per type per calendar day (UTC).
create unique index tcn_unique_per_day
  on tree_care_notifications (tree_id, notification_type, (date(sent_at)));

create index tcn_user_sent_at_idx on tree_care_notifications (user_id, sent_at);

alter table tree_care_notifications enable row level security;

create policy tcn_service_role_all
  on tree_care_notifications
  for all
  to service_role
  using (true)
  with check (true);

comment on table tree_care_notifications is
  'Audit + dedupe ledger for the notify-tree-care Edge Function. '
  'Unique-per-day index prevents the hourly cron from spamming users. '
  'See supabase/functions/notify-tree-care/index.ts.';
