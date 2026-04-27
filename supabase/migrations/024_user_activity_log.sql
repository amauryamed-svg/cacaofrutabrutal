-- Migration 024: user_activity log — single source of truth for user behavior
-- Existing tables (token_events, cacao_trees, tree_updates, caua_leads) feed this log
-- via triggers added in a later migration. The log is what the dashboard self-view
-- and the HubSpot mirror sync (Phase 2) read from. Append-only by design.

create table if not exists public.user_activity (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  activity     text        not null,
  payload      jsonb       not null default '{}'::jsonb,
  occurred_at  timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

comment on table public.user_activity is
  'Append-only behavior log. Source for self-view dashboard timeline and HubSpot mirror sync. Activities: tree_adoption, tree_care, ritual_completed, blog_read, blog_share, coupon_redeemed, shopify_purchase, referral_converted, etc.';

create index if not exists user_activity_user_time_idx
  on public.user_activity (user_id, occurred_at desc);
create index if not exists user_activity_activity_idx
  on public.user_activity (activity);

alter table public.user_activity enable row level security;

create policy "user_activity_select_own" on public.user_activity
  for select using ((select auth.uid()) = user_id);

-- No permissive write policy → anon/authenticated cannot INSERT/UPDATE/DELETE via PostgREST.
-- Service role bypasses RLS (Edge Functions / triggers).
