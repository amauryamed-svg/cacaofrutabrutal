# Cacao Ceremony 1-week Post-Launch Audit
Date: 2026-05-04
PR: #19 — merged: **NO** (state: open, created 2026-04-27)
Branch checked: main @ 04427b3

---

> **⚠ AUDIT ABORTED AT STEP 1 — PR #19 IS NOT MERGED.**
> Issue #43 opened: "Cacao Ceremony PR #19 not merged 1w post-creation"
> The following sections cover a partial audit of ceremony code that reached `main`
> through other PRs — this is itself a critical finding.

---

## § 1 Code drift since merge

### PR #19 landing status on `main`

| File | On `main`? | Route to main |
|------|-----------|---------------|
| `src/components/marketplace/CacaoCeremonyCard.tsx` | ✅ yes | commit `5bfcf50` (#26) + updated `037d007` (#27) |
| `supabase/functions/create-shopify-discount/index.ts` | ✅ yes | commit `5bfcf50` (#26) |
| `supabase/functions/shopify-webhook/index.ts` | ✅ yes | commit `5bfcf50` (#26) |
| `supabase/config.toml` | ✅ yes | earlier PR, expanded since |
| `supabase/migrations/023_cacao_ceremony_integration.sql` | ❌ **MISSING** | blocked in unmerged PR #19 |
| `supabase/migrations/024_cacao_ceremony_webhook.sql` | ❌ **MISSING** | blocked in unmerged PR #19 |

**This means the Edge Functions and component are live on `main` without the DB schema they depend on.** Tables `cacao_ceremony_discounts` and `cacao_ceremony_orders`, and RPCs `get_user_tree_count`, `debit_mazorcas`, `get_user_id_by_email`, `get_user_ceremony_order_count` are presumed absent from production. Any live request to `create-shopify-discount` or `shopify-webhook` will produce an unhandled DB error after passing the secrets check.

### Files touched in the last 7 days

| File | Commit | Message | Impact |
|------|--------|---------|--------|
| `src/components/marketplace/CacaoCeremonyCard.tsx` | `037d007` | `feat(ui): retro/Tamagotchi TreeDetail + Web3 motion + universal burger nav` | Error-message extraction improvement — positive change, no regression |

The `037d007` change replaced `throw new Error(error.message)` with a block that unpacks `FunctionsHttpError.context.response`, reads the JSON body for `error`/`detail`, and provides a user-friendly 503 message when `SHOPIFY_ADMIN_TOKEN` is not configured. Logic is correct and backward-compatible.

No other ceremony files were touched in the last 7 days.

### Tier rules consistency — UI ↔ Edge Fn

Both `CacaoCeremonyCard.tsx` and `create-shopify-discount/index.ts` declare identical constants:

| Constant | UI | Edge Fn |
|----------|----|---------|
| `TREE_TIER_PCT` | `{0:0, 1:5, 2:10, 3:15}` | `{0:0, 1:5, 2:10, 3:15}` |
| `TREE_TIER_CAP_PCT` | `20` | `20` |
| `MAZORCA_TO_PCT` | `1` | `1` |
| `MAZORCA_REDEEM_CAP_PCT` | `10` | `10` |
| `TOTAL_DISCOUNT_CAP` | `30` | `30` |

**Verdict: ✅ No tier-rules drift.** The UI preview and the Edge Fn enforcement are in agreement.

### Webhook integrity — `shopify-webhook/index.ts`

| Check | Result |
|-------|--------|
| HMAC SHA-256 verification (constant-time compare) | ✅ present, lines 14–28 |
| Idempotency guard via `shopify_order_id` unique lookup | ✅ present, lines 77–84 |
| Email → user_id match via `get_user_id_by_email` RPC | ✅ present, line 89 |
| Handles `orders/paid` only; acks other topics with 200 | ✅ present, lines 49–51 |

**Minor ledger observation (not a regression):** The repeat-buyer mazorca bonus (`+10`) is added to the `mazorcas` counter in the `cacao_ceremony_purchase` token_events row, while the separate `cacao_ceremony_repeat_buyer` row records `mazorcas: 0`. Balance math is correct; attribution in `token_events` is slightly inconsistent. Low severity.

### `config.toml` integrity

`verify_jwt = false` confirmed for both `shopify-webhook` and `stripe-webhook`. Config has been expanded since PR #19 (added `persona-webhook`, `alchemy-nft-webhook`, `tree-metadata`, `refund-expired-redemption`, `coinbase-commerce-webhook`, `post-iot-root`) — all additions are from subsequent Web3 PRs and are unrelated to ceremony.

**Verdict: ✅ config.toml intact.**

### Overall § 1 verdict: **REGRESSION-RISK**

The code on `main` is half the integration without the DB schema. The integration cannot function end-to-end in production until PR #19 is merged and `npx supabase db push` is run.

---

## § 2 Build sanity

- `npm run build`: **PASS** (2.51 s, TypeScript clean, no errors in ceremony files)
- New errors: none
- Chunk size warning (pre-existing, unrelated to ceremony): `Web3Onboarding` > 500 kB

---

## § 3 Operator SQL queries (run in Supabase SQL editor)

> **Note:** These queries will fail until migrations 023 + 024 are applied. Run them after PR #19 is merged and `npx supabase db push` completes.

```sql
-- Discount codes issued in last 7 days
SELECT count(*) AS issued, status, sum(mazorcas_spent) AS mazorcas_burned
FROM cacao_ceremony_discounts
WHERE created_at >= now() - interval '7 days'
GROUP BY status;

-- Conversion: % of issued codes actually used
SELECT
  count(*) FILTER (WHERE status = 'used')::numeric / NULLIF(count(*),0) * 100 AS conversion_pct,
  count(*) FILTER (WHERE status = 'used') AS used,
  count(*) AS total
FROM cacao_ceremony_discounts
WHERE created_at >= now() - interval '7 days';

-- Orders received from Shopify webhook
SELECT count(*) AS orders, sum(amount_cents)/100.0 AS total_usd,
       count(*) FILTER (WHERE user_id IS NOT NULL) AS matched_users,
       count(*) FILTER (WHERE user_id IS NULL)     AS unmatched_users
FROM cacao_ceremony_orders
WHERE created_at >= now() - interval '7 days';

-- Tokens awarded for ceremony purchases
SELECT event_type, count(*), sum(beans) AS beans, sum(mazorcas) AS mazorcas
FROM token_events
WHERE event_type IN ('cacao_ceremony_purchase','cacao_ceremony_repeat_buyer')
  AND created_at >= now() - interval '7 days'
GROUP BY event_type;

-- Cross-check: any used discount without matching order?
SELECT d.shopify_code, d.used_order_id, d.user_id
FROM cacao_ceremony_discounts d
LEFT JOIN cacao_ceremony_orders o ON o.shopify_order_id = d.used_order_id
WHERE d.status = 'used' AND o.id IS NULL;

-- Confirm migrations applied (should return 2 rows)
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('cacao_ceremony_discounts','cacao_ceremony_orders')
  AND table_schema = 'public';

-- Confirm RPCs exist (should return 4 rows)
SELECT routine_name FROM information_schema.routines
WHERE routine_name IN ('get_user_tree_count','debit_mazorcas','get_user_id_by_email','get_user_ceremony_order_count')
  AND routine_schema = 'public';
```

---

## § 4 Shopify Admin checklist (manual)

- [ ] `caua-9917.myshopify.com` / Settings / Notifications / Webhooks: confirm `Order paid` webhook still active and pointing to `https://kjygovuiphbxcdxeduco.supabase.co/functions/v1/shopify-webhook`
- [ ] Discounts panel: spot-check 3 codes prefixed `CAUA-` for correct % and `once_per_customer + usage_limit=1`
- [ ] Orders panel: filter by discount code prefix `CAUA-` to see orders attributable to integration
- [ ] Verify Shopify custom app still has scopes `write_discounts`, `write_price_rules`, `read_orders`, `read_customers`

---

## § 5 HubSpot checklist

- [ ] Search events `cacao_ceremony_traffic_sent` in last 7d — funnel: card view → click → (manual: actual checkout completion via Shopify orders panel)
- [ ] If zero events: likely means no user has triggered the card (expected if migrations are missing and Edge Fn returns 500)

---

## § 6 Action items

| Priority | Owner | Action |
|----------|-------|--------|
| P0 | Engineer | Merge PR #19 — it is the only path to applying migrations 023 + 024 |
| P0 | Engineer | After merge: `npx supabase db push` to create `cacao_ceremony_discounts`, `cacao_ceremony_orders` tables and 4 RPCs |
| P0 | Operator | Verify Shopify secrets set: `SHOPIFY_ADMIN_TOKEN`, `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_WEBHOOK_SECRET` via `npx supabase secrets set` |
| P0 | Operator | Verify Shopify webhook still registered and pointing to correct Edge Fn URL |
| P1 | Engineer | Consider feature-gating `CacaoCeremonyCard` behind a flag until DB schema is confirmed live — currently shows UI with broken backend |
| P1 | Operator | Run SQL queries in § 3 (after migrations applied) and paste results into issue #43 thread |
| P2 | Engineer | Ledger: attribute repeat-buyer mazorca bonus to `cacao_ceremony_repeat_buyer` event type rather than bundling into `cacao_ceremony_purchase` row |

---

## § 7 Secrets sanity

`git grep` confirmed all `SHOPIFY_*` references are either:
- `Deno.env.get(...)` inside Edge Functions — correct ✅
- A regex pattern-match string in `CacaoCeremonyCard.tsx:66` checking an error message — not a secret read ✅

**No Shopify secrets in client-side code.**
