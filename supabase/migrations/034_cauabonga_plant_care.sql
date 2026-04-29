-- 034 — CauaBonga plant + care RPCs (Phase B of sprint 2 tokenization).
-- Adds two atomic Postgres functions invoked by Edge Functions
-- cauabonga-plant-seed and cauabonga-care-action. The harvest RPC
-- already lives in 033 (apply_cauabonga_harvest); this migration
-- completes the planting → growing → ready → harvest loop.
--
-- Both functions are SECURITY DEFINER + service_role-only, mirroring the
-- 033 pattern. Clients never call them directly — only Edge Functions
-- running as service_role.

-- ─── apply_cauabonga_plant ─────────────────────────────────────────
-- Atomic plant transaction:
--   1. Lock the planting row (FOR UPDATE) — must be in state='empty'.
--   2. Lock user_profiles row.
--   3. Verify mazorcas_balance >= seed_cost; raise insufficient_mazorcas.
--   4. Decrement mazorcas_balance.
--   5. Insert token_events row with negative mazorcas (sink).
--   6. Update planting → state='growing', crop_slug, mode, planted_at,
--      ready_at = now() + interval grow_minutes.
--   7. Append cauabonga_action_log row (action='plant').
-- Returns the new ready_at + new mazorcas_balance.

create or replace function public.apply_cauabonga_plant(
  p_user_id        uuid,
  p_planting_id    uuid,
  p_crop_slug      text,
  p_mode           text,
  p_seed_cost      int,
  p_grow_minutes   int,
  p_client_meta    jsonb default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plot_id        uuid;
  v_tile_idx       smallint;
  v_balance        numeric(12,2);
  v_new_balance    numeric(12,2);
  v_ready_at       timestamptz;
  v_token_event_id uuid;
begin
  if p_mode not in ('regen','traditional') then
    raise exception 'invalid_mode:%', p_mode;
  end if;
  if p_seed_cost < 0 then
    raise exception 'invalid_seed_cost:%', p_seed_cost;
  end if;
  if p_grow_minutes <= 0 then
    raise exception 'invalid_grow_minutes:%', p_grow_minutes;
  end if;

  -- Lock the planting row.
  select plot_id, tile_idx
    into v_plot_id, v_tile_idx
    from public.cauabonga_plantings
   where id = p_planting_id and user_id = p_user_id and state = 'empty'
   for update;

  if v_plot_id is null then
    raise exception 'planting_not_empty_or_unauthorized';
  end if;

  -- Lock and check balance.
  select mazorcas_balance into v_balance
    from public.user_profiles
   where user_id = p_user_id
   for update;

  if v_balance is null then
    raise exception 'profile_not_found';
  end if;
  if v_balance < p_seed_cost then
    raise exception 'insufficient_mazorcas:have=% need=%', v_balance, p_seed_cost;
  end if;

  v_new_balance := v_balance - p_seed_cost;
  v_ready_at    := now() + make_interval(mins => p_grow_minutes);

  -- Decrement balance.
  update public.user_profiles
     set mazorcas_balance = v_new_balance
   where user_id = p_user_id;

  -- Token event ledger row (negative mazorcas as sink).
  insert into public.token_events(user_id, event_type, mazorcas, beans, ref_id)
    values (p_user_id, 'cauabonga_plant', -p_seed_cost, 0,
            format('plot:%s:tile:%s:crop:%s:mode:%s', v_plot_id, v_tile_idx, p_crop_slug, p_mode))
    returning id into v_token_event_id;

  -- Transition planting.
  update public.cauabonga_plantings
     set state              = 'growing',
         crop_slug          = p_crop_slug,
         mode               = p_mode,
         planted_at         = now(),
         ready_at           = v_ready_at,
         care_actions_count = 0,
         updated_at         = now()
   where id = p_planting_id;

  -- Action log forensics.
  insert into public.cauabonga_action_log(user_id, plot_id, planting_id, action, client_meta)
    values (p_user_id, v_plot_id, p_planting_id, 'plant', p_client_meta);

  return jsonb_build_object(
    'planting_id',  p_planting_id,
    'plot_id',      v_plot_id,
    'tile_idx',     v_tile_idx,
    'state',        'growing',
    'ready_at',     v_ready_at,
    'seed_cost',    p_seed_cost,
    'new_balance',  v_new_balance,
    'token_event_id', v_token_event_id
  );
end;
$$;

revoke all  on function public.apply_cauabonga_plant(uuid, uuid, text, text, int, int, jsonb) from public, anon, authenticated;
grant execute on function public.apply_cauabonga_plant(uuid, uuid, text, text, int, int, jsonb) to service_role;

-- ─── apply_cauabonga_care ──────────────────────────────────────────
-- Atomic care action:
--   1. Lock planting (must be 'growing').
--   2. Verify last_<action>_at is null OR older than cooldown_minutes.
--   3. Apply soil_delta (clamped 0..100), increment care_actions_count.
--   4. Update last_<action>_at = now().
--   5. Optionally accelerate ready_at (regen-mode timing reward).
--   6. Insert action_log row.
-- Returns new soil_health + new ready_at + new care_actions_count.

create or replace function public.apply_cauabonga_care(
  p_user_id          uuid,
  p_planting_id      uuid,
  p_action           text,                   -- 'water' | 'sun' | 'nutrient' | 'pruning'
  p_cooldown_minutes int,                    -- -1 = once-per-cycle
  p_soil_delta       smallint,
  p_growth_speedup_seconds int default 0,
  p_client_meta      jsonb default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plot_id          uuid;
  v_tile_idx         smallint;
  v_soil_before      smallint;
  v_soil_after       smallint;
  v_last_at          timestamptz;
  v_ready_at         timestamptz;
  v_care_count       smallint;
  v_state            text;
begin
  if p_action not in ('water','sun','nutrient','pruning') then
    raise exception 'invalid_action:%', p_action;
  end if;

  -- Lock planting.
  select plot_id, tile_idx, soil_health, ready_at, care_actions_count, state,
         case p_action
           when 'water'     then last_water_at
           when 'sun'       then last_sun_at
           when 'nutrient'  then last_nutrient_at
           when 'pruning'   then last_pruning_at
         end
    into v_plot_id, v_tile_idx, v_soil_before, v_ready_at, v_care_count, v_state, v_last_at
    from public.cauabonga_plantings
   where id = p_planting_id and user_id = p_user_id
   for update;

  if v_plot_id is null then
    raise exception 'planting_not_found_or_unauthorized';
  end if;
  if v_state not in ('growing','seeded') then
    raise exception 'planting_not_growing:state=%', v_state;
  end if;

  -- Cooldown check.
  if p_cooldown_minutes < 0 then
    -- once-per-cycle: any prior timestamp within current cycle blocks.
    if v_last_at is not null then
      raise exception 'cooldown_once_per_cycle:last_at=%', v_last_at;
    end if;
  else
    if v_last_at is not null and v_last_at > now() - make_interval(mins => p_cooldown_minutes) then
      raise exception 'cooldown_active:last_at=% retry_after=%',
        v_last_at, v_last_at + make_interval(mins => p_cooldown_minutes);
    end if;
  end if;

  v_soil_after := greatest(0, least(100, v_soil_before + p_soil_delta));

  if p_growth_speedup_seconds > 0 and v_ready_at is not null then
    v_ready_at := greatest(now(), v_ready_at - make_interval(secs => p_growth_speedup_seconds));
  end if;

  -- Apply update on the right column.
  if p_action = 'water' then
    update public.cauabonga_plantings
       set last_water_at      = now(),
           soil_health        = v_soil_after,
           care_actions_count = v_care_count + 1,
           ready_at           = v_ready_at,
           updated_at         = now()
     where id = p_planting_id;
  elsif p_action = 'sun' then
    update public.cauabonga_plantings
       set last_sun_at        = now(),
           soil_health        = v_soil_after,
           care_actions_count = v_care_count + 1,
           ready_at           = v_ready_at,
           updated_at         = now()
     where id = p_planting_id;
  elsif p_action = 'nutrient' then
    update public.cauabonga_plantings
       set last_nutrient_at   = now(),
           soil_health        = v_soil_after,
           care_actions_count = v_care_count + 1,
           ready_at           = v_ready_at,
           updated_at         = now()
     where id = p_planting_id;
  elsif p_action = 'pruning' then
    update public.cauabonga_plantings
       set last_pruning_at    = now(),
           soil_health        = v_soil_after,
           care_actions_count = v_care_count + 1,
           ready_at           = v_ready_at,
           updated_at         = now()
     where id = p_planting_id;
  end if;

  -- Soil history audit.
  insert into public.cauabonga_soil_history
    (user_id, plot_id, planting_id, tile_idx, reason, delta, soil_before, soil_after)
    values (p_user_id, v_plot_id, p_planting_id, v_tile_idx, 'other', p_soil_delta, v_soil_before, v_soil_after);

  -- Action log forensics.
  insert into public.cauabonga_action_log(user_id, plot_id, planting_id, action, client_meta)
    values (p_user_id, v_plot_id, p_planting_id, p_action, p_client_meta);

  return jsonb_build_object(
    'planting_id',     p_planting_id,
    'plot_id',         v_plot_id,
    'tile_idx',        v_tile_idx,
    'soil_before',     v_soil_before,
    'soil_after',      v_soil_after,
    'ready_at',        v_ready_at,
    'care_actions',    v_care_count + 1,
    'action',          p_action
  );
end;
$$;

revoke all  on function public.apply_cauabonga_care(uuid, uuid, text, int, smallint, int, jsonb) from public, anon, authenticated;
grant execute on function public.apply_cauabonga_care(uuid, uuid, text, int, smallint, int, jsonb) to service_role;

comment on function public.apply_cauabonga_plant(uuid, uuid, text, text, int, int, jsonb) is
  'Atomic plant: lock empty tile, decrement mazorcas, insert token_events sink, transition tile to growing with ready_at. service_role only. See sprint-2 plan §B1.';
comment on function public.apply_cauabonga_care(uuid, uuid, text, int, smallint, int, jsonb) is
  'Atomic care action: lock growing tile, check cooldown, apply soil_delta + speedup, log action. service_role only. See sprint-2 plan §B2.';
