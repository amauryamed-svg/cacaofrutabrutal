-- Migration 022: extender investor_charges para soportar el flow de transferencia directa
-- (ETH directo a Bitso/Coinbase wallet) con verificación on-chain manual o automatizada.
--
-- Campos nuevos:
--   tx_hash         — hash de la transacción on-chain reportado por el investor
--   amount_sent_usd — monto que el investor declara haber enviado (vs amount_usd que es el solicitado)
--   network         — red blockchain (ethereum, polygon, base, bitcoin, solana...)
--   asset           — token enviado (ETH, USDC, BTC, SOL...)

ALTER TABLE public.investor_charges
  ADD COLUMN IF NOT EXISTS tx_hash         text,
  ADD COLUMN IF NOT EXISTS amount_sent_usd numeric,
  ADD COLUMN IF NOT EXISTS network         text DEFAULT 'ethereum',
  ADD COLUMN IF NOT EXISTS asset           text DEFAULT 'ETH';

CREATE INDEX IF NOT EXISTS investor_charges_tx_hash_idx
  ON public.investor_charges (tx_hash) WHERE tx_hash IS NOT NULL;

-- Nota: la verificación on-chain del tx_hash puede automatizarse en una fase 2
-- llamando a Etherscan API desde un cron / Edge Function. Por ahora el equipo CFB
-- verifica manualmente dentro de la ventana de 24h prometida en el UI.
