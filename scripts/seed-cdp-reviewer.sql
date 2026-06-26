-- CDP reviewer test account seed
-- Run in Supabase SQL editor AFTER the target reviewer email has logged in
-- at least once (Google OAuth or magic link) so auth.users has their record.
--
-- Supported reviewer emails:
--   cauacdpreview@gmail.com   — original test account (Google OAuth)
--   rishabh.jain@coinbase.com — CDP reviewer account (magic link or Google Workspace)
--
-- Usage: paste in Supabase Dashboard → SQL Editor → Run

do $$
declare
  v_user_id uuid;
  v_target_email text := coalesce(
    (select email from auth.users where email = 'rishabh.jain@coinbase.com' limit 1),
    'cauacdpreview@gmail.com'
  );
begin
  select id into v_user_id
  from auth.users
  where email = v_target_email
  limit 1;

  if v_user_id is null then
    raise exception
      'No reviewer email found in auth.users. '
      'Make sure rishabh.jain@coinbase.com or cauacdpreview@gmail.com has logged in at least once first.';
  end if;

  raise notice 'Seeding reviewer account: %', v_target_email;

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
