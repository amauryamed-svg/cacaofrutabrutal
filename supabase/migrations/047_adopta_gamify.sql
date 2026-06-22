-- ═══════════════════════════════════════════════════════════════════
-- 047 — Adopta gamify foundation (Phase A2)
-- ═══════════════════════════════════════════════════════════════════
--
-- Six tables + one view + three RPCs + one trigger that wire the
-- gamify loop on /adoptar:
--
--   1. user_streaks            — daily care commitment counter
--   2. achievements_catalog    — 8 seeded badges (P0)
--   3. user_achievements       — per-user unlocks
--   4. adopta_quests           — 5 quest templates per user
--   5. user_levels             — Aprendiz → Cuidador → Guardian → Maestro
--   6. mazorca_inventory       — collectible rarity tiers (common/rare/epic/legendary)
--
-- RPCs:
--   - unlock_achievement(uid, slug)           — idempotent ON CONFLICT, awards mz
--   - seed_adopta_quests(uid)                 — idempotent, called on first adoption
--   - claim_adopta_quest(uid, quest_id)       — atomic claim + token award
--
-- Trigger:
--   - update_streak_on_care                   — fires on cacao_trees UPDATE when last_update_at advances
--
-- All RLS scoped (select auth.uid()) per CauaCore §8.

-- ─── 1. user_streaks ────────────────────────────────────────────
create table if not exists public.user_streaks (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  current_days     int not null default 0,
  longest_days     int not null default 0,
  last_care_date   date,
  frozen_until     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.user_streaks enable row level security;

drop policy if exists "user_streaks_own_select" on public.user_streaks;
create policy "user_streaks_own_select" on public.user_streaks
  for select using (user_id = (select auth.uid()));

-- No insert/update from clients — only trigger + service_role.

-- ─── 2. achievements_catalog ────────────────────────────────────
create table if not exists public.achievements_catalog (
  id           text primary key,
  name         text not null,
  descripcion  text not null,
  icon         text not null,                       -- emoji or asset key
  rarity       text not null check (rarity in ('common','rare','epic','legendary')),
  secret       boolean not null default false,
  reward_mz    int not null default 5,
  sort_order   int not null default 100
);

-- Public-read on the catalog (needed for AchievementGrid before unlock).
alter table public.achievements_catalog enable row level security;

drop policy if exists "public_read_achievements_catalog" on public.achievements_catalog;
create policy "public_read_achievements_catalog" on public.achievements_catalog
  for select using (true);

-- Seed 8 base achievements (P0 set per plan).
insert into public.achievements_catalog (id, name, descripcion, icon, rarity, secret, reward_mz, sort_order) values
  ('first_adoption',       'Primera semilla',     'Adopta tu primer árbol de cacao.',                 '🌱', 'common',    false,  5,  10),
  ('first_harvest',        'Primera cosecha',     'Cosecha tu primera mazorca.',                       '🍫', 'common',    false, 10,  20),
  ('streak_7',             'Una semana fiel',     'Cuida tu árbol 7 días seguidos.',                   '🔥', 'rare',      false, 15,  30),
  ('streak_30',            'Pacto del mes',       '30 días sin saltar un día de cuidado.',             '⚜️', 'epic',      false, 50,  40),
  ('multi_tree_5',         'Bosque íntimo',       'Adopta 5 árboles distintos.',                       '🌳', 'rare',      false, 20,  50),
  ('multi_guardian_all_5', 'Vínculo completo',    'Adopta de los 5 guardianes.',                       '🤝', 'epic',      false, 35,  60),
  ('perfect_harvest',      'Cosecha perfecta',    'Logra combo +50% en tu primer harvest minigame.',   '✨', 'rare',      false, 20,  70),
  ('lineage_regenerator',  'Regeneración',        'Compostas un árbol caído y siembras su linaje.',    '♻️', 'legendary', true,  25,  80)
on conflict (id) do nothing;

comment on table public.achievements_catalog is
  'Static badge catalog. Public-read. Seeded 8 base achievements (Phase A2). New badges add via subsequent migrations.';

-- ─── 3. user_achievements ──────────────────────────────────────
create table if not exists public.user_achievements (
  user_id        uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null references public.achievements_catalog(id) on delete cascade,
  unlocked_at    timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

alter table public.user_achievements enable row level security;

drop policy if exists "user_achievements_own_select" on public.user_achievements;
create policy "user_achievements_own_select" on public.user_achievements
  for select using (user_id = (select auth.uid()));

create index if not exists idx_user_achievements_user
  on public.user_achievements (user_id, unlocked_at desc);

-- ─── 4. adopta_quests ──────────────────────────────────────────
create table if not exists public.adopta_quests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  quest_id     text not null,
  state        text not null default 'open' check (state in ('open','complete','claimed')),
  target       int not null,
  progress     int not null default 0,
  reward_mz    int not null,
  title        text not null,
  descripcion  text not null,
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  claimed_at   timestamptz,
  unique (user_id, quest_id)
);

alter table public.adopta_quests enable row level security;

drop policy if exists "adopta_quests_own_select" on public.adopta_quests;
create policy "adopta_quests_own_select" on public.adopta_quests
  for select using (user_id = (select auth.uid()));

create index if not exists idx_adopta_quests_user_state
  on public.adopta_quests (user_id, state);

-- ─── 5. user_levels ────────────────────────────────────────────
create table if not exists public.user_levels (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  total_xp      int not null default 0,
  current_level int not null default 1,
  title         text not null default 'Aprendiz',
  updated_at    timestamptz not null default now()
);

alter table public.user_levels enable row level security;

drop policy if exists "user_levels_own_select" on public.user_levels;
create policy "user_levels_own_select" on public.user_levels
  for select using (user_id = (select auth.uid()));

-- View aggregating XP from token_events. 1 bean = 1 XP, 1 mazorca = 5 XP.
create or replace view public.v_user_xp as
  select
    user_id,
    coalesce(sum(beans), 0)::int + coalesce(sum(mazorcas * 5), 0)::int as total_xp
  from public.token_events
  group by user_id;

-- ─── 6. mazorca_inventory ──────────────────────────────────────
create table if not exists public.mazorca_inventory (
  user_id          uuid not null references auth.users(id) on delete cascade,
  mazorca_kind     text not null check (mazorca_kind in ('common','rare','epic','legendary')),
  count            int not null default 0 check (count >= 0),
  last_minted_at   timestamptz,
  primary key (user_id, mazorca_kind)
);

alter table public.mazorca_inventory enable row level security;

drop policy if exists "mazorca_inventory_own_select" on public.mazorca_inventory;
create policy "mazorca_inventory_own_select" on public.mazorca_inventory
  for select using (user_id = (select auth.uid()));

-- ─── RPC: unlock_achievement ───────────────────────────────────
-- Idempotent: ON CONFLICT do nothing. If newly inserted, awards reward_mz
-- via token_events + user_profiles balance update.

create or replace function public.unlock_achievement(
  p_user_id  uuid,
  p_slug     text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reward_mz       int;
  v_inserted        boolean := false;
  v_token_event_id  uuid;
  v_new_balance     numeric(12,2);
begin
  select reward_mz into v_reward_mz
    from public.achievements_catalog
   where id = p_slug;

  if v_reward_mz is null then
    raise exception 'achievement_not_found:%', p_slug;
  end if;

  -- Try to insert. If already unlocked, do nothing.
  insert into public.user_achievements (user_id, achievement_id)
  values (p_user_id, p_slug)
  on conflict (user_id, achievement_id) do nothing;

  get diagnostics v_inserted = row_count;

  if not v_inserted then
    return jsonb_build_object('unlocked', false, 'reason', 'already_unlocked', 'achievement_id', p_slug);
  end if;

  -- Award mazorcas.
  insert into public.token_events (user_id, event_type, mazorcas, beans, ref_id)
    values (p_user_id, 'achievement_unlocked', v_reward_mz, 0, format('achievement:%s', p_slug))
    returning id into v_token_event_id;

  update public.user_profiles
     set mazorcas_balance = mazorcas_balance + v_reward_mz
   where user_id = p_user_id
   returning mazorcas_balance into v_new_balance;

  return jsonb_build_object(
    'unlocked',       true,
    'achievement_id', p_slug,
    'reward_mz',      v_reward_mz,
    'token_event_id', v_token_event_id,
    'new_balance',    v_new_balance
  );
end;
$$;

revoke all      on function public.unlock_achievement(uuid, text) from public, anon, authenticated;
grant execute   on function public.unlock_achievement(uuid, text) to service_role;

comment on function public.unlock_achievement(uuid, text) is
  'Idempotent achievement unlock. Awards reward_mz on first unlock, no-op on subsequent. service_role only.';

-- ─── RPC: seed_adopta_quests ───────────────────────────────────
-- Insert 5 quest templates for a user. Idempotent ON CONFLICT.

create or replace function public.seed_adopta_quests(
  p_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted int := 0;
begin
  -- pact_30d — cuida diario 30 días
  insert into public.adopta_quests (user_id, quest_id, target, reward_mz, title, descripcion)
  values (p_user_id, 'pact_30d', 30, 50,
          'Pacto del mes',
          'Cuida tu árbol 30 días sin saltar uno solo. Recompensa: título Maestro.')
  on conflict (user_id, quest_id) do nothing;
  if found then v_inserted := v_inserted + 1; end if;

  -- harvest_perfect
  insert into public.adopta_quests (user_id, quest_id, target, reward_mz, title, descripcion)
  values (p_user_id, 'harvest_perfect', 1, 25,
          'Cosecha perfecta',
          'Logra un combo +50% en el harvest minigame.')
  on conflict (user_id, quest_id) do nothing;
  if found then v_inserted := v_inserted + 1; end if;

  -- redeem_first_chocolate
  insert into public.adopta_quests (user_id, quest_id, target, reward_mz, title, descripcion)
  values (p_user_id, 'redeem_first_chocolate', 1, 30,
          'Primera redención',
          'Canjea tu primera gift card de Cacao Ceremony.')
  on conflict (user_id, quest_id) do nothing;
  if found then v_inserted := v_inserted + 1; end if;

  -- support_3_guardians
  insert into public.adopta_quests (user_id, quest_id, target, reward_mz, title, descripcion)
  values (p_user_id, 'support_3_guardians', 3, 35,
          'Tres guardianes',
          'Adopta árboles de 3 guardianes distintos.')
  on conflict (user_id, quest_id) do nothing;
  if found then v_inserted := v_inserted + 1; end if;

  -- seed_to_chocolate
  insert into public.adopta_quests (user_id, quest_id, target, reward_mz, title, descripcion)
  values (p_user_id, 'seed_to_chocolate', 1, 80,
          'Semilla a chocolate',
          'Forja una barra completa en /lab desde una mazorca.')
  on conflict (user_id, quest_id) do nothing;
  if found then v_inserted := v_inserted + 1; end if;

  return jsonb_build_object('inserted', v_inserted);
end;
$$;

revoke all      on function public.seed_adopta_quests(uuid) from public, anon, authenticated;
grant execute   on function public.seed_adopta_quests(uuid) to service_role;

comment on function public.seed_adopta_quests(uuid) is
  'Idempotent quest seeding. Called by award-tokens Edge Function on first tree_adoption event.';

-- ─── RPC: claim_adopta_quest ───────────────────────────────────
-- Atomic claim: lock quest, verify state='complete', mark claimed,
-- emit token_event, increment user_profiles balance.

create or replace function public.claim_adopta_quest(
  p_user_id  uuid,
  p_quest_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quest record;
  v_token_event_id uuid;
  v_new_balance    numeric(12,2);
begin
  select * into v_quest
    from public.adopta_quests
   where id = p_quest_id and user_id = p_user_id
   for update;

  if v_quest is null then
    raise exception 'quest_not_found';
  end if;

  if v_quest.state = 'claimed' then
    raise exception 'quest_already_claimed';
  end if;

  if v_quest.state <> 'complete' then
    raise exception 'quest_not_complete';
  end if;

  update public.adopta_quests
     set state = 'claimed',
         claimed_at = now()
   where id = p_quest_id;

  insert into public.token_events (user_id, event_type, mazorcas, beans, ref_id)
    values (p_user_id, 'quest_claimed', v_quest.reward_mz, 0,
            format('quest:%s', v_quest.quest_id))
    returning id into v_token_event_id;

  update public.user_profiles
     set mazorcas_balance = mazorcas_balance + v_quest.reward_mz
   where user_id = p_user_id
   returning mazorcas_balance into v_new_balance;

  return jsonb_build_object(
    'state',          'claimed',
    'reward_mz',      v_quest.reward_mz,
    'token_event_id', v_token_event_id,
    'new_balance',    v_new_balance
  );
end;
$$;

revoke all      on function public.claim_adopta_quest(uuid, uuid) from public, anon, authenticated;
grant execute   on function public.claim_adopta_quest(uuid, uuid) to authenticated;
grant execute   on function public.claim_adopta_quest(uuid, uuid) to service_role;

comment on function public.claim_adopta_quest(uuid, uuid) is
  'Atomic claim of completed quest. Authenticated users may call for their own quests.';

-- ─── Trigger: update_streak_on_care ────────────────────────────
-- Fires on cacao_trees UPDATE when last_update_at advances. Compares
-- last_care_date in user_streaks (Bogotá TZ) and increments/resets
-- current_days accordingly.
--
-- Same-day care: no increment, no reset.
-- Next consecutive day: +1 (longest_days max).
-- Day skipped: reset to 1 (today's care).

create or replace function public.update_streak_on_care()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today        date := (now() at time zone 'America/Bogota')::date;
  v_last         date;
  v_current      int;
  v_longest      int;
begin
  -- Only react if last_update_at moved forward.
  if NEW.last_update_at <= OLD.last_update_at then
    return NEW;
  end if;

  -- Upsert user_streaks row.
  insert into public.user_streaks (user_id, current_days, longest_days, last_care_date)
  values (NEW.user_id, 1, 1, v_today)
  on conflict (user_id) do update
    set
      last_care_date = case
        when public.user_streaks.last_care_date = v_today           then public.user_streaks.last_care_date
        else v_today
      end,
      current_days = case
        when public.user_streaks.last_care_date = v_today                            then public.user_streaks.current_days
        when public.user_streaks.last_care_date = v_today - interval '1 day'         then public.user_streaks.current_days + 1
        else 1
      end,
      longest_days = greatest(
        public.user_streaks.longest_days,
        case
          when public.user_streaks.last_care_date = v_today                            then public.user_streaks.current_days
          when public.user_streaks.last_care_date = v_today - interval '1 day'         then public.user_streaks.current_days + 1
          else 1
        end
      ),
      updated_at = now();

  return NEW;
end;
$$;

drop trigger if exists trg_update_streak_on_care on public.cacao_trees;
create trigger trg_update_streak_on_care
  after update of last_update_at on public.cacao_trees
  for each row execute function public.update_streak_on_care();

comment on function public.update_streak_on_care() is
  'Increments user_streaks.current_days on consecutive-day cuidados, resets on skip. Bogotá TZ. Triggered by cacao_trees.last_update_at advance.';
