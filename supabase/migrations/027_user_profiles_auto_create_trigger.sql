-- 027 — Auto-create user_profiles on signup + backfill missing rows
-- Root cause of "Recolectar 500": users authenticated via auth.users had no
-- corresponding row in public.user_profiles, so award-tokens balance UPDATE
-- found nothing to update and returned 500. This adds the trigger that should
-- have existed since day 1.

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.user_profiles (
    id, user_id, email, locale, region,
    referral_count, completed_orders, ritual_streak,
    beans_balance, mazorcas_balance, beans_lifetime,
    last_seen_at, created_at
  )
  values (
    gen_random_uuid(), new.id, new.email, 'es', 'OTHER',
    0, 0, 0,
    0, 0, 0,
    now(), now()
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

-- Backfill — create user_profiles rows for users that signed up before this trigger existed.
insert into public.user_profiles (
  id, user_id, email, locale, region,
  referral_count, completed_orders, ritual_streak,
  beans_balance, mazorcas_balance, beans_lifetime,
  last_seen_at, created_at
)
select
  gen_random_uuid(), au.id, au.email, 'es', 'OTHER',
  0, 0, 0, 0, 0, 0, now(), au.created_at
from auth.users au
left join public.user_profiles up on up.user_id = au.id
where up.user_id is null
on conflict (user_id) do nothing;

-- Reconstruct balances from existing token_events for any user whose ledger
-- has events but whose user_profiles row was created with zeros (the backfill).
-- Idempotent: SUMs the ledger and sets the balance fields.
update public.user_profiles up
set
  beans_balance    = coalesce(t.total_beans, 0),
  mazorcas_balance = coalesce(t.total_mazorcas, 0),
  beans_lifetime   = coalesce(t.lifetime_beans, 0)
from (
  select
    user_id,
    sum(beans)::numeric                      as total_beans,
    sum(mazorcas)::numeric                   as total_mazorcas,
    sum(case when beans > 0 then beans else 0 end)::numeric as lifetime_beans
  from public.token_events
  group by user_id
) t
where up.user_id = t.user_id
  and up.beans_balance = 0
  and up.mazorcas_balance = 0;
