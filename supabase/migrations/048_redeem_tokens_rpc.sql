-- Migration 048: atomic redeem_tokens RPC for $CACAO flywheel
-- Called by the redeem-tokens Edge Function to ensure balance check + decrement
-- happen in a single transaction (no negative balances possible).

create or replace function public.redeem_tokens(
  p_user_id   uuid,
  p_beans     numeric,
  p_item_type text,
  p_item_ref  text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current numeric;
  v_new     numeric;
begin
  -- Lock the row for this user
  select beans_balance into v_current
  from user_profiles
  where user_id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  if v_current < p_beans then
    return jsonb_build_object(
      'ok', false,
      'error', 'insufficient_balance',
      'have', v_current,
      'need', p_beans
    );
  end if;

  v_new := v_current - p_beans;

  update user_profiles
  set beans_balance = v_new
  where user_id = p_user_id;

  -- Immutable ledger row (negative beans = spend)
  insert into token_events (user_id, event_type, beans, mazorcas, ref_id)
  values (p_user_id, 'redeem_' || p_item_type, -p_beans, 0, p_item_ref);

  return jsonb_build_object(
    'ok',          true,
    'beans_spent', p_beans,
    'new_balance', v_new
  );
end;
$$;

-- Only service_role (Edge Functions) can call this
revoke execute on function public.redeem_tokens(uuid, numeric, text, text) from anon, authenticated;
grant execute on function public.redeem_tokens(uuid, numeric, text, text) to service_role;
