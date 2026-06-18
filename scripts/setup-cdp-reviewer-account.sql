-- ─────────────────────────────────────────────────────────────────────────────
-- CDP Reviewer Test Account Setup
-- Run in Supabase SQL Editor (project: kjygovuiphbxcdxeduco)
--
-- STEP 1: Register a real account at https://cacaofrutabrutal.com with the
--         email you'll give CDP (e.g. amaury+cdpreview@cauaculture.co).
--         Then paste that email below and run this script.
-- ─────────────────────────────────────────────────────────────────────────────

-- Fill in before running:
-- REVIEWER_EMAIL  → the email used to register the test account
-- REVIEWER_WALLET → any Base-mainnet wallet you control (or use the CEO wallet below)

DO $$
DECLARE
  v_user_id uuid;
  v_email   text := 'cauacdpreview@gmail.com';  -- Google OAuth reviewer account
  v_wallet  text := '0x7E9E25cFfc8BC68Fb9E1f4708e761C68a37a846A'; -- CEO Coinbase wallet (Base-compatible)
BEGIN
  -- 1. Resolve user_id from auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found with email %. Register first.', v_email;
  END IF;

  -- 2. Ensure user_profiles row exists (created by trigger on signup, but guard anyway)
  INSERT INTO public.user_profiles (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. Mark KYC verified (Tier 1) + pre-link wallet + unflag geo-block
  UPDATE public.user_profiles
  SET
    kyc_status      = 'verified',
    kyc_tier        = 1,
    kyc_verified_at = now(),
    kyc_provider_id = 'cdp-reviewer-manual',
    wallet_address  = v_wallet,
    wallet_chain_id = 8453,           -- Base mainnet
    geo_blocked     = false,
    country         = 'US',
    caua_role       = 'founder'       -- founder role = no additional gates in UI
  WHERE user_id = v_user_id;

  -- 4. Confirm
  RAISE NOTICE '✅ CDP reviewer account configured: user_id=% email=% wallet=%',
    v_user_id, v_email, v_wallet;
END $$;

-- Verify
SELECT
  user_id,
  kyc_status,
  kyc_tier,
  wallet_address,
  wallet_chain_id,
  geo_blocked,
  country,
  caua_role
FROM public.user_profiles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'cauacdpreview@gmail.com' LIMIT 1);
