-- Migration 021: Investor charges audit log (Coinbase Commerce + ETH direct deposits intent)
-- Captures the investor intent to fund the company (vs per-lot tech investment which lives in `orders`).

CREATE TABLE IF NOT EXISTS public.investor_charges (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  kind            text        NOT NULL CHECK (kind IN ('equity_5k', 'b2b_sponsorship')),
  amount_usd      numeric     NOT NULL CHECK (amount_usd > 0),
  payment_method  text        NOT NULL CHECK (payment_method IN ('coinbase_usdc', 'eth_direct')),
  -- Coinbase Commerce fields (null when payment_method='eth_direct')
  charge_id       text,                               -- Coinbase charge.id
  charge_code     text,                               -- Coinbase charge.code (short)
  hosted_url      text,                               -- Coinbase hosted checkout URL
  -- ETH direct fields (null when payment_method='coinbase_usdc')
  destination     text,                               -- which wallet the user said they would send to (cto | ceo)
  -- Lifecycle
  status          text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','expired','cancelled')),
  metadata        jsonb       DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS investor_charges_user_id_idx   ON public.investor_charges (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS investor_charges_status_idx    ON public.investor_charges (status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS investor_charges_charge_id_idx ON public.investor_charges (charge_id) WHERE charge_id IS NOT NULL;

ALTER TABLE public.investor_charges ENABLE ROW LEVEL SECURITY;

-- Owners read their own charges
DROP POLICY IF EXISTS "investor_charges_owner_select" ON public.investor_charges;
CREATE POLICY "investor_charges_owner_select" ON public.investor_charges
  FOR SELECT USING (user_id = (SELECT auth.uid()));

-- Inserts come exclusively from Edge Function (service_role bypasses RLS) — no client INSERT policy.
