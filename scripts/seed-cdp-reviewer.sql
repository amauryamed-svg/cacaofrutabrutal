-- CDP reviewer test account seed
-- Run in Supabase SQL editor AFTER cauacdpreview@gmail.com has logged in
-- at least once via Google OAuth so auth.users has their record.
--
-- Usage: paste in Supabase Dashboard → SQL Editor → Run

do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id
  from auth.users
  where email = 'cauacdpreview@gmail.com'
  limit 1;

  if v_user_id is null then
    raise exception
      'User cauacdpreview@gmail.com not found in auth.users. '
      'Make sure they have logged in at least once via Google OAuth first.';
  end if;

  -- Remove any existing wallet binding that would conflict on the unique index
  update public.user_profiles
  set wallet_address = null, wallet_chain_id = null
  where lower(wallet_address) = lower('0x7E9E25cFfc8BC68Fb9E1f4708e761C68a37a846A')
    and user_id <> v_user_id;

  insert into public.user_profiles (
    user_id,
    country,
    kyc_status,
    kyc_tier,
    kyc_verified_at,
    kyc_provider_id,
    wallet_address,
    wallet_chain_id,
    geo_blocked
  ) values (
    v_user_id,
    'US',
    'verified',
    1,
    now(),
    'cdp-review-manual-tier1',
    '0x7E9E25cFfc8BC68Fb9E1f4708e761C68a37a846A',
    84532,  -- Base Sepolia (ACTIVE_CHAIN_ID) — switch to 8453 post-mainnet
    false
  )
  on conflict (user_id) do update set
    country         = excluded.country,
    kyc_status      = excluded.kyc_status,
    kyc_tier        = excluded.kyc_tier,
    kyc_verified_at = excluded.kyc_verified_at,
    kyc_provider_id = excluded.kyc_provider_id,
    wallet_address  = excluded.wallet_address,
    wallet_chain_id = excluded.wallet_chain_id,
    geo_blocked     = excluded.geo_blocked;

  raise notice 'CDP reviewer account seeded: user_id=%, wallet=0x7E9E25cFfc8BC68Fb9E1f4708e761C68a37a846A, kyc_tier=1',
    v_user_id;
end;
$$;

-- Verify:
select
  u.email,
  p.user_id,
  p.kyc_status,
  p.kyc_tier,
  p.wallet_address,
  p.wallet_chain_id,
  p.geo_blocked,
  p.country
from auth.users u
join public.user_profiles p on p.user_id = u.id
where u.email = 'cauacdpreview@gmail.com';
