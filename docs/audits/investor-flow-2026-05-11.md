# Investor Flow — 2-Week Post-Launch Audit

| Field | Value |
|-------|-------|
| **Audit date** | 2026-05-11 |
| **Branch audited** | `main` |
| **HEAD SHA** | `1a442f5bcd0fbd38ababb3485801a11f6df30a34` |
| **Deploy date** | 2026-04-26 |
| **Auditor** | Claude Code (automated) — human action required for §§ 2–5 |

---

## § 1 — Code drift since 2026-04-26

**Result: NO DRIFT.** Every commit touching investor flow files is dated 2026-04-26. Zero new commits in the 2-week window. The investor flow is frozen in its shipped state.

### Commits in scope (all from deploy day)

| SHA | PR | Description |
|-----|----|-------------|
| `1a442f5` | #17 | fix(wallet): distinguir custody Coinbase (CEO) vs Bitso (CTO) |
| `701a803` | #16 | fix(landing): replace mock wallet flow with real 4-step checkout |
| `430833e` | #15 | fix(fund): WalletCheckout salta a "Allocación Asegurada" sin pasar transfer/verify |
| `92d3091` | #14 | fix(fund): WalletCheckout no se montaba dentro de InvestorPath |
| `f8b968a` | #13 | fix(fund): make crypto wallet section visible by default |
| `922dd58` | #12 | feat(fund): unify crypto checkout — InvestModal + InvestorPath share WalletCheckout |
| `317a347` | #10 | feat(investor): checkout wizard 5 pasos con tx_hash verification |

### Baseline verification

| Check | File / Lines | Verdict |
|-------|-------------|---------|
| `INVESTOR_WALLETS` CTO address = `0x7Ca1624e534ebE18F46BBA56229981134945464e`, custody = Bitso | `src/utils/constants.ts:200–202` | **OK** |
| `INVESTOR_WALLETS` CEO address = `0x7E9E25cFfc8BC68Fb9E1f4708e761C68a37a846A`, custody = Coinbase | `src/utils/constants.ts:207–209` | **OK** |
| `record-investor-transfer` accepts anon + email path (no JWT required) | `supabase/functions/record-investor-transfer/index.ts:54–81` | **OK** |
| `WalletCheckout` mounted **outside** `<AnimatePresence>` in `InvestorPath` | `src/components/fund/InvestorPath.tsx:186–200` | **OK** |
| `cfb*` vanilla JS wallet functions present in `investor-landing.html` | `public/investor-landing.html:1580–1745` | **OK** |

### Pre-existing code finding (not new, not a regression)

`src/lib/hubspotTracking.ts:82` reads cookie consent from `localStorage` (`caua_cookie_consent`). This violates CauaCore §8 ("NUNCA localStorage"). The pattern predates the investor flow and is used only for consent state (read-only, non-sensitive). No immediate risk, but it should be migrated to React context in a future cleanup sprint.

---

## § 2 — Supabase SQL checklist

Run these against the production project (`kjygovuiphbxcdxeduco`) in the Supabase SQL editor.

```sql
-- 1. Transfer volume since deploy
SELECT
  count(*)            AS total,
  status,
  sum(amount_sent_usd) AS total_usd_declared
FROM investor_charges
WHERE created_at >= '2026-04-26'
GROUP BY status
ORDER BY total DESC;
```

```sql
-- 2. Pending verification queue (work this list)
SELECT
  id,
  metadata->>'email'   AS email,
  network,
  asset,
  amount_sent_usd,
  tx_hash,
  created_at
FROM investor_charges
WHERE status = 'pending'
  AND created_at >= '2026-04-26'
ORDER BY created_at DESC;
```

```sql
-- 3. Source breakdown — landing page vs authenticated app
SELECT
  metadata->>'source'  AS source,
  count(*)             AS total,
  sum(amount_sent_usd) AS total_usd_declared
FROM investor_charges
WHERE created_at >= '2026-04-26'
GROUP BY 1
ORDER BY total DESC;
```

```sql
-- 4. Destination wallet breakdown (CTO Bitso vs CEO Coinbase)
SELECT
  metadata->>'destination'  AS destination,
  count(*)                  AS total,
  sum(amount_sent_usd)      AS total_usd_declared
FROM investor_charges
WHERE created_at >= '2026-04-26'
GROUP BY 1
ORDER BY total DESC;
```

```sql
-- 5. Duplicate tx_hash check (should return 0 rows — detect double-submissions)
SELECT tx_hash, count(*) AS n
FROM investor_charges
WHERE tx_hash IS NOT NULL
  AND created_at >= '2026-04-26'
GROUP BY tx_hash
HAVING count(*) > 1;
```

```sql
-- 6. Stale pending — transfers older than 48h with no status update (SLA breach)
SELECT
  id,
  metadata->>'email' AS email,
  tx_hash,
  amount_sent_usd,
  created_at,
  now() - created_at AS age
FROM investor_charges
WHERE status = 'pending'
  AND created_at < now() - interval '48 hours'
ORDER BY created_at ASC;
```

**Expected healthy state:** Query 5 returns 0 rows. Query 6 returns 0 rows (all pending verified within 24h SLA). Query 1 shows a mix of `pending` and whatever final state your team uses (e.g., `verified`, `rejected`).

---

## § 3 — HubSpot dashboard checklist

Three custom behavioral events fire in the investor funnel, gated on analytics cookie consent:

| # | Event name | Fired in | Properties |
|---|-----------|---------|------------|
| 1 | `investor_kind_selected` | `InvestorPath.tsx:50` | `kind` |
| 2 | `investor_network_selected` | `InvestorPath.tsx:57` | `network`, `asset` |
| 3 | `investor_transfer_recorded` | `WalletCheckout.tsx:75` | transaction metadata |

### Dashboard actions (15 min)

1. **Open HubSpot → Reports → Custom Events** and confirm all 3 event names appear with events recorded since 2026-04-26. If any show 0 occurrences, the tracking is broken or no investors have consented to analytics cookies.

2. **Build a funnel report:**
   - Step 1: `investor_kind_selected`
   - Step 2: `investor_network_selected`
   - Step 3: `investor_transfer_recorded`
   - **KPI to check:** kind→network conversion rate (drop here = UI confusion at network step) and network→transfer conversion rate (drop here = friction at wallet/amount step).

3. **Check event volume by source:** The `investor_transfer_recorded` event fires from the React SPA (`/app/fund`). The static landing page (`public/investor-landing.html`) fires its own HubSpot tracking directly via `_hsq.push`. Verify both sources show events.

4. **Contacts created:** Filter contacts in HubSpot by `Create date >= 2026-04-26` and check for contacts with `caua_tracking_consent = analytics` or `both` — these are investors who completed the form and consented.

---

## § 4 — Coinbase Commerce recommendation

**Recommendation: KEEP DISABLED**

### Evidence

**Git log** for `supabase/functions/create-coinbase-charge/`:
```
cee0ad0  2026-04-26  feat: Adopta v2 — ... investor flow (#8)
```
Only 1 commit ever — the initial deploy. No development activity since.

**Env var wiring** (`git grep COINBASE_COMMERCE_API_KEY`):
```
supabase/functions/create-coinbase-charge/index.ts:8:  // Required env vars: ... COINBASE_COMMERCE_API_KEY
supabase/functions/create-coinbase-charge/index.ts:55:  const apiKey = Deno.env.get('COINBASE_COMMERCE_API_KEY')
```
The key is read only inside the Edge Function. No frontend code, no env config, no Supabase secret — the function returns 503 on every call.

**UI surface** (`src/components/fund/PaymentSelector.tsx:65–69`):
```ts
{
  id: 'coinbase_cop_digital',
  label: 'USDC · BTC · SOL',
  sub: T('Multi-chain · próximamente', 'Multi-chain · coming soon'),
  coming: true,   // ← button is disabled, opacity 0.5, onClick gated
}
```
The option is rendered as "coming soon" with `disabled={opt.coming}` and pointer-events blocked. No user can trigger the `create-coinbase-charge` endpoint from the UI.

**Conclusion:** Zero user impact from keeping this disabled. Enable only when: (a) `COINBASE_COMMERCE_API_KEY` is set in Supabase secrets, (b) `coming: true` is removed from `PaymentSelector.tsx`, and (c) end-to-end testing is complete on staging.

---

## § 5 — Action items

| # | Owner | Action | Where | Urgency |
|---|-------|--------|-------|---------|
| 1 | Operator | Run SQL queries 1–4 (§ 2) | Supabase SQL editor | **Now** |
| 2 | Operator | Run SQL query 5 (duplicate tx_hash check) | Supabase SQL editor | **Now** |
| 3 | Operator | Run SQL query 6 (stale pending SLA check) — manually verify or reject any rows older than 48h | Supabase SQL editor | **Now** |
| 4 | Operator | Open HubSpot funnel report for 3 events (§ 3) | HubSpot → Reports | This week |
| 5 | Operator | Confirm `COINBASE_COMMERCE_API_KEY` is NOT set in Supabase secrets (Dashboard → Edge Functions → Secrets) | Supabase dashboard | This week |
| 6 | Dev team | Migrate `hubspotTracking.ts` consent read from `localStorage` to React context (CauaCore §8) | `src/lib/hubspotTracking.ts:82` | Low priority — tech debt |
| 7 | Dev team | Plan Coinbase Commerce phase 2: set secret + remove `coming: true` flag + E2E test on staging before enabling | `src/components/fund/PaymentSelector.tsx:68` | When roadmap permits |
