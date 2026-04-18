# Tentacle: b2b-marketplace

## Domain
B2B crowdfunding, lot investments, 3 biotech technologies, multi-currency payments, investor roles.

## What This Domain Owns
- `/src/pages/Fund.tsx` — Technology listings, funding progress, role-gated content
- `/src/components/fund/FundHero.tsx` — Hero section with supply chain narrative
- `/src/components/fund/TechnologyCard.tsx` — Individual tech card (process steps, lots, MVP products)
- `/src/components/fund/InvestModal.tsx` — Investment flow modal (currency selector → payment provider → checkout)
- `/src/components/fund/PaymentSelector.tsx` — Gateway selection (MercadoPago / Stripe / Coinbase)
- `/src/components/fund/RoleSelector.tsx` — Role selection for discount calculation
- `/src/components/fund/MvpCard.tsx` — MVP product card within a technology
- `/src/components/fund/SupplyChainFlow.tsx` — Visual supply chain diagram
- `/src/components/fund/FundingProgress.tsx` — Progress bar component
- `/src/pages/Marketplace.tsx` — B2C product grid (preorders, auctions, subscriptions)
- `/src/components/auction/ProductCard.tsx` — Marketplace product card with countdown timer
- `/supabase/functions/create-stripe-checkout/index.ts` — Stripe Checkout Session Edge Function
- `/supabase/functions/create-mp-preference/index.ts` — MercadoPago Preference Edge Function
- `/supabase/functions/stripe-webhook/index.ts` — Stripe payment confirmation webhook

## Data Model

### `technologies` table (3 seeded rows)
```
id              uuid PK
slug            text UNIQUE (mucilage-extract | hydrosol | theobroma-brew)
name            text
tagline         text
category        text (lyophilization | distillation | fermentation)
lot_price_usd   int  (cents: 25000 | 20000 | 15000)
lot_price_cop   int  (colombian pesos)
lots_total      int  (1000 | 500 | 300)
lots_funded     int  (auto-incremented by trigger)
raised_usd_cents int (auto-incremented by trigger)
goal_usd_cents  int
input_desc      text (40 kg cacao input description)
output_desc     text (22 kg output description)
process_steps   jsonb (array of step objects)
eu_approval_target text (regulatory pathway)
```

### `mvps` table (MVP pre-order products per technology)
```
id              uuid PK
technology_id   uuid FK → technologies
name            text
size_label      text
price_usd_cents int
price_cop       int
stripe_price_id text
stock           int
```

### `lot_investments` table
```
id              uuid PK
user_id         uuid FK → auth.users
technology_id   uuid FK → technologies
order_id        uuid FK → orders
lots_count      int
amount_usd_cents int
amount_cop      int
currency        text (usd | eur | cop | usdc)
caua_role       text (investor | creyente | nativo | farmer | founder)
created_at      timestamptz
```

### `orders` table
```
id                     uuid PK
user_id                uuid FK
technology_id          uuid FK (nullable for marketplace orders)
product_id             uuid FK (nullable for lot orders)
amount_cents           int
currency               text
payment_provider       text (stripe | mercadopago | coinbase)
stripe_session_id      text
mercadopago_preference_id text
status                 text (pending | completed | failed | refunded)
created_at             timestamptz
```

## The 3 Technologies

| Slug | Name | Process | Price/lot | Goal | Status |
|------|------|---------|-----------|------|--------|
| mucilage-extract | MucilageExtract™ | Lyophilization | $250 | $250K | 69 lots funded ✅ |
| hydrosol | HydroSol™ | Steam distillation | $200 | $100K | 20 lots funded |
| theobroma-brew | TheobromaBrew™ | Cold fermentation | $150 | $50K | 0 lots |

EU regulatory pathways:
- MucilageExtract™ → EU Novel Food Regulation 2015/2283
- HydroSol™ → EFSA Botanical List
- TheobromaBrew™ → EFSA Novel Food Authorization

## Role-Based Discounts

| Role | Discount | Min investment |
|------|----------|---------------|
| investor | 50% off | $1,000 |
| nativo | 25% off | $10 |
| creyente | 15% off | $20 |
| farmer | 0% (canVend=true) | — |
| founder | 0% (canVend=true) | — |

## Payment Flow

### Stripe (USD/EUR)
1. Frontend calls `supabase.functions.invoke('create-stripe-checkout', { lots, technology_id, role })`
2. Edge Function creates Stripe Checkout Session, returns `{ sessionId, url }`
3. Frontend redirects to Stripe-hosted checkout
4. `stripe-webhook` Edge Function receives `checkout.session.completed` → updates order status → triggers token award

### MercadoPago (COP)
1. Frontend calls `supabase.functions.invoke('create-mp-preference', { lots, technology_id, role })`
2. Edge Function creates MercadoPago Preference, returns `{ preferenceId, redirectUrl }`
3. Frontend redirects to MercadoPago checkout
4. Webhook receives `payment.approved` → updates order status

### Coinbase Commerce (USDC)
- Not yet implemented. Planned: `create-coinbase-charge` Edge Function
- UI shows "en proceso" for USDC digital payments

## DB Trigger: `update_technology_funding()`
This trigger fires AFTER INSERT on `lot_investments`:
```sql
UPDATE technologies
SET lots_funded = lots_funded + NEW.lots_count,
    raised_usd_cents = raised_usd_cents + NEW.amount_usd_cents
WHERE id = NEW.technology_id;
```
Never manually update `lots_funded` or `raised_usd_cents` — use this trigger path.

## Marketplace Products (8 items in src/utils/constants.ts PRODUCTS)

| Name | Type | Price | Status |
|------|------|-------|--------|
| SUNRISE SOCIAL TONIC | preorder | $6 | P1 |
| SUNSET SOCIAL TONIC | preorder | $10 | P1 |
| CACAO CEREMONIAL | auction | $35 | P1 |
| EDICIÓN GUARDIÁN | auction | $85 | P1 |
| CÍRCULO SUMAPAZ | subscription | $45/mo | P2 |
| MIDNIGHT COLD BREW | preorder | $12 | P1 |
| HIDROSOL DE CACAO | preorder | $35 | P1 |
| ACEITE ESENCIAL CACAO | preorder | $5 | P1 |

Marketplace checkout is not yet wired to Stripe — products redirect to Fund page. This is a known gap.

## Multiplier System (Marketplace)
```js
const getMultiplier = (referrals, prevLots) => {
  const refBonus = Math.min(referrals * 0.1, 1.0)   // max +100%
  const loyBonus = Math.min(prevLots * 0.15, 1.0)   // max +100%
  return Math.min(1.0 + refBonus + loyBonus, 3.0)   // cap 3×
}
```
This multiplier applies to auction bids — stored in `bids.multiplier`.
