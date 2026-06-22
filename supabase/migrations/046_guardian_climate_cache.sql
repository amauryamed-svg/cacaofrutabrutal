-- ═══════════════════════════════════════════════════════════════════
-- 046 — Guardian climate cache + adoption count + leaderboard views
-- Sprint: Adopta UX revamp + gamify (Phase A1)
-- ═══════════════════════════════════════════════════════════════════
--
-- Three artifacts feeding the new GuardianLiveChip on /adoptar:
--   1. guardian_climate_cache — TTL 1h cache for cacao_predictor.py climate
--      readings, written through by the guardian-climate Edge Function.
--   2. v_guardian_adoption_count_30d — social proof aggregate
--      ("Lucho ya tiene 47 adopciones este mes").
--   3. v_guardian_leaderboard_30d — anonymous top-cuidadores per guardian
--      (used by SwipeableTreeCard slide 'stakes').
--
-- All RLS scoped per CauaCore §8: (select auth.uid()) form, founder cache
-- pattern reused from 007. Cache is public-read (no PII, public ground truth).

-- ─── 1. guardian_climate_cache ───────────────────────────────────
create table if not exists public.guardian_climate_cache (
  guardian_id  smallint primary key references public.guardians(id) on delete cascade,
  payload      jsonb not null,
  fetched_at   timestamptz not null default now()
);

create index if not exists idx_guardian_climate_cache_fetched_at
  on public.guardian_climate_cache (fetched_at desc);

alter table public.guardian_climate_cache enable row level security;

drop policy if exists "public_read_guardian_climate" on public.guardian_climate_cache;
create policy "public_read_guardian_climate" on public.guardian_climate_cache
  for select using (true);

-- Only service_role can write (Edge Function uses service key).
-- No insert/update policies for anon/authenticated — RLS denies by default.

comment on table public.guardian_climate_cache is
  'Write-through cache for cacao_predictor.py climate readings. TTL 1h enforced by guardian-climate Edge Function.';

-- ─── 2. v_guardian_adoption_count_30d ───────────────────────────
-- Social proof aggregate: count of cacao_trees adopted in the last 30 days
-- per guardian_id. Anonymous count, no user data exposed.

create or replace view public.v_guardian_adoption_count_30d as
  select
    guardian_id,
    count(*)::int as adoption_count_30d
  from public.cacao_trees
  where adopted_at > now() - interval '30 days'
  group by guardian_id;

-- Views inherit RLS from underlying tables. cacao_trees has user-scoped RLS,
-- but for an aggregate count we need bypass — wrap in security_invoker=off
-- security definer function returning the rows publicly.

create or replace function public.guardian_adoption_count_30d()
returns table(guardian_id smallint, adoption_count_30d int)
language sql
security definer
set search_path = public
stable
as $$
  select
    guardian_id::smallint,
    count(*)::int as adoption_count_30d
  from public.cacao_trees
  where adopted_at > now() - interval '30 days'
  group by guardian_id;
$$;

revoke all      on function public.guardian_adoption_count_30d() from public;
grant execute   on function public.guardian_adoption_count_30d() to anon, authenticated;

comment on function public.guardian_adoption_count_30d() is
  'Anonymous aggregate count of adoptions per guardian over the last 30 days. Public-read.';

-- ─── 3. v_guardian_leaderboard_30d ──────────────────────────────
-- Top 10 anonymous cuidadores per guardian, ranked by total CO2 + harvest count
-- in the last 30 days. Returned via security definer function so the user's
-- own RLS doesn't filter out other users' rows.

create or replace function public.guardian_leaderboard_30d(p_guardian_id smallint)
returns table(
  rank          int,
  display_name  text,
  co2_kg        numeric,
  care_count    int,
  streak_days   int
)
language sql
security definer
set search_path = public
stable
as $$
  with care as (
    select
      t.user_id,
      t.guardian_id,
      sum(t.co2_kg)::numeric as co2_kg,
      count(distinct tu.id)::int as care_count
    from public.cacao_trees t
    left join public.tree_updates tu
      on tu.tree_id = t.id
     and tu.created_at > now() - interval '30 days'
    where t.guardian_id = p_guardian_id
      and t.adopted_at > now() - interval '30 days'
    group by t.user_id, t.guardian_id
  ),
  ranked as (
    select
      row_number() over (order by co2_kg desc, care_count desc) as rank,
      user_id, co2_kg, care_count
    from care
  )
  select
    r.rank::int,
    -- Truncated anonymous handle: '@anon' + last 4 of user_id hex.
    '@anon' || substr(replace(r.user_id::text, '-', ''), 1, 4) as display_name,
    r.co2_kg,
    r.care_count,
    coalesce(us.current_days, 0)::int as streak_days
  from ranked r
  left join public.user_streaks us on us.user_id = r.user_id
  where r.rank <= 10
  order by r.rank;
$$;

revoke all      on function public.guardian_leaderboard_30d(smallint) from public;
grant execute   on function public.guardian_leaderboard_30d(smallint) to anon, authenticated;

comment on function public.guardian_leaderboard_30d(smallint) is
  'Top 10 anonymous cuidadores per guardian over the last 30 days. Returns rank, anon handle, co2, care count, streak. user_streaks may be created in 047 — function handles its absence via left join.';
