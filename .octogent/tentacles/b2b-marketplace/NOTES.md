# NOTES — b2b-marketplace

## Architectural Decisions

**[2026-04-18] All monetary values stored as integer cents (never floats)**
`lot_price_usd` and `amount_usd_cents` are stored as cents (int) — e.g., $250 = `25000`. COP amounts are stored in a separate `amount_cop` column (not converted from USD). Never perform currency arithmetic across columns. Never store prices as floats.

**[2026-04-18] Stripe secret key is Edge Function only**
`STRIPE_SECRET_KEY` lives in Vercel/Supabase Edge Function secrets. It never appears in `src/`. The frontend uses only `VITE_STRIPE_PUBLISHABLE_KEY`. Violating this rule creates a P0 security incident.

**[2026-04-18] MercadoPago preference created server-side and returned as redirect URL**
The frontend receives a `redirectUrl` from the `create-mp-preference` Edge Function and navigates to it. The MercadoPago SDK or iframe is never loaded in the frontend. This keeps the secret key server-side.

**[2026-04-18] `update_technology_funding()` trigger is the only path to increment funding counters**
Never write `lots_funded` or `raised_usd_cents` directly via frontend. The DB trigger on `lot_investments` INSERT handles this atomically. This ensures consistency even under concurrent purchases.

**[2026-04-18] Marketplace checkout currently redirects to Fund page — intentional MVP shortcut**
In Phase 1, individual product purchases redirect users to the Fund page to complete investment. Building a separate Marketplace checkout flow is P1 work. Do not remove the redirect without implementing the replacement flow first.

## Known Risks

- Coinbase Commerce webhook handler does not exist. USDC payments will silently fail until implemented.
- The `stripe-webhook` Edge Function needs signature verification (`stripe.webhooks.constructEvent`). This has not been tested end-to-end in production — confirm before going live.
- Lot-tier pricing is not yet in the DB schema. Adding it requires a migration to `lot_investments` and updates to the discount calculation in `InvestModal.tsx`.
