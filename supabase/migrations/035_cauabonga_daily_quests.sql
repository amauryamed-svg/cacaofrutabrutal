-- 035 — CauaBonga daily-quests seeding + claim RPC.
-- Builds on top of `cauabonga_daily_quests` table from 033 by adding two functions:
--   1. seed_cauabonga_daily_quests(uuid)   — idempotently creates 3 quests/day/user.
--   2. claim_cauabonga_daily_quest(uuid, uuid) — atomic claim + token award.
-- The cauabonga-claim-quest Edge Function calls both.
--
-- Scope per sprint-2 plan §B5: backend only. UI deferred.

-- ─── seed_cauabonga_daily_quests ──────────────────────────────────
-- Insert 3 quest rows for today if not present. ON CONFLICT skip.
-- Templates per economy.md §6 — total reward = 80 mz (well under 120 mz quest cap).

create or replace function public.seed_cauabonga_daily_quests(
  p_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'America/Bogota')::date;
  v_inserted int := 0;
begin
  -- Slot 0 — easy: plant 3 tiles today.
  insert into public.cauabonga_daily_quests
    (user_id, quest_date, slot, template_id, params, reward_mz, target)
  values (p_user_id, v_today, 0, 'q_plant_3_today',
          jsonb_build_object('action','plant'), 10, 3)
  on conflict (user_id, quest_date, slot) do nothing;
  if found then v_inserted := v_inserted + 1; end if;

  -- Slot 1 — medium: 10 care actions today.
  insert into public.cauabonga_daily_quests
    (user_id, quest_date, slot, template_id, params, reward_mz, target)
  values (p_user_id, v_today, 1, 'q_care_10_today',
          jsonb_build_object('actions', array['water','sun','nutrient','pruning']), 25, 10)
  on conflict (user_id, quest_date, slot) do nothing;
  if found then v_inserted := v_inserted + 1; end if;

  -- Slot 2 — hard: harvest 5 tiles today.
  insert into public.cauabonga_daily_quests
    (user_id, quest_date, slot, template_id, params, reward_mz, target)
  values (p_user_id, v_today, 2, 'q_harvest_5_today',
          jsonb_build_object('action','harvest'), 45, 5)
  on conflict (user_id, quest_date, slot) do nothing;
  if found then v_inserted := v_inserted + 1; end if;

  return jsonb_build_object('quest_date', v_today, 'inserted', v_inserted);
end;
$$;

revoke all  on function public.seed_cauabonga_daily_quests(uuid) from public, anon, authenticated;
grant execute on function public.seed_cauabonga_daily_quests(uuid) to service_role;

-- ─── claim_cauabonga_daily_quest ──────────────────────────────────
-- Atomic quest claim:
--   1. Lock quest row (must be 'open' AND quest_date = today).
--   2. Count matching actions in cauabonga_action_log between quest_date+00:00 and now() (COL TZ).
--   3. If progress < target → update progress, return not_complete.
--   4. If progress >= target → mark complete, append token_events (+reward_mz),
--      increment user_profiles.mazorcas_balance.

create or replace function public.claim_cauabonga_daily_quest(
  p_user_id  uuid,
  p_quest_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_template      text;
  v_params        jsonb;
  v_target        int;
  v_reward_mz     int;
  v_state         text;
  v_quest_date    date;
  v_progress      int;
  v_action_filter text;
  v_action_array  text[];
  v_count         int;
  v_token_event_id uuid;
  v_new_balance   numeric(12,2);
  v_day_start     timestamptz;
  v_day_end       timestamptz;
begin
  -- Lock quest.
  select template_id, params, target, reward_mz, state, quest_date
    into v_template, v_params, v_target, v_reward_mz, v_state, v_quest_date
    from public.cauabonga_daily_quests
   where id = p_quest_id and user_id = p_user_id
   for update;

  if v_template is null then
    raise exception 'quest_not_found';
  end if;
  if v_state <> 'open' then
    raise exception 'quest_already_%', v_state;
  end if;

  -- Quest day window in COL TZ.
  v_day_start := (v_quest_date::timestamp at time zone 'America/Bogota');
  v_day_end   := v_day_start + interval '1 day';

  -- Count progress.
  v_action_filter := v_params->>'action';
  if v_action_filter is not null then
    select count(*) into v_count
      from public.cauabonga_action_log
     where user_id = p_user_id
       and action  = v_action_filter
       and created_at >= v_day_start
       and created_at <  v_day_end;
  else
    v_action_array := array(select jsonb_array_elements_text(v_params->'actions'));
    select count(*) into v_count
      from public.cauabonga_action_log
     where user_id = p_user_id
       and action = any(v_action_array)
       and created_at >= v_day_start
       and created_at <  v_day_end;
  end if;

  v_progress := least(v_count, v_target);

  -- Below target — update progress only.
  if v_progress < v_target then
    update public.cauabonga_daily_quests
       set progress = v_progress
     where id = p_quest_id;
    return jsonb_build_object(
      'state', 'open', 'progress', v_progress, 'target', v_target, 'reward_mz', v_reward_mz
    );
  end if;

  -- Complete — mark + award.
  update public.cauabonga_daily_quests
     set progress     = v_target,
         state        = 'complete',
         completed_at = now()
   where id = p_quest_id;

  insert into public.token_events(user_id, event_type, mazorcas, beans, ref_id)
    values (p_user_id, 'cauabonga_quest', v_reward_mz, 0,
            format('quest:%s:%s', v_template, v_quest_date))
    returning id into v_token_event_id;

  update public.user_profiles
     set mazorcas_balance = mazorcas_balance + v_reward_mz
   where user_id = p_user_id
   returning mazorcas_balance into v_new_balance;

  return jsonb_build_object(
    'state',          'complete',
    'progress',       v_target,
    'target',         v_target,
    'reward_mz',      v_reward_mz,
    'new_balance',    v_new_balance,
    'token_event_id', v_token_event_id
  );
end;
$$;

revoke all  on function public.claim_cauabonga_daily_quest(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_cauabonga_daily_quest(uuid, uuid) to service_role;

comment on function public.seed_cauabonga_daily_quests(uuid) is
  'Idempotent seeding of 3 daily quests/user/day in COL TZ. Lazy creation by cauabonga-claim-quest Edge Function. Total daily emission cap 80 mz < 120 mz quest cap (economy.md §6).';
comment on function public.claim_cauabonga_daily_quest(uuid, uuid) is
  'Atomic claim: lock quest, count cauabonga_action_log entries vs target, complete + award mz when reached. service_role only.';
