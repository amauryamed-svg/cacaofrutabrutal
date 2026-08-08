# Investor Flow — 2-Week Post-Launch Audit

| Field | Value |
|-------|-------|
| **Audit date** | 2026-05-11 |
| **Branch audited** | `main` |
| **HEAD SHA** | `c807bae45068e8ddd3ce751f8d9db02ea53bdc12` |
| **Deploy date** | 2026-04-26 |
| **Auditor** | Claude Code (automated) — human action required for §§ 2–5 |

> **Note:** A draft of this report was merged as PR #18 on 2026-05-06 with HEAD `1a442f5` (the deploy-day state). This version reflects the current HEAD `c807bae` and captures 15 additional commits that landed after the original draft was written.

---

## § 1 — Code drift since 2026-04-26

**Result: DRIFT DETECTED** — 15+ new commits have touched investor flow files since the deploy. Checkout logic is intact but the investor landing page has been rebuilt. See detail below.

### Commits in scope — deploy day (2026-04-26)

| SHA | PR | Description |
|-----|----|-------------|
| `1a442f5` | #17 | fix(wallet): distinguir custody Coinbase (CEO) vs Bitso (CTO) |
| `701a803` | #16 | fix(landing): replace mock wallet flow with real 4-step checkout |
| `430833e` | #15 | fix(fund): WalletCheckout salta a "Allocación Asegurada" sin pasar transfer/verify |
| `92d3091` | #14 | fix(fund): WalletCheckout no se montaba dentro de InvestorPath |
| `f8b968a` | #13 | fix(fund): make crypto wallet section visible by default |

### Commits landing AFTER deploy (new since PR #18 draft)

| SHA | Date | Files touched | Description |
|-----|------|--------------|-------------|
| `b0854e7` | 2026-05-11 | `constants.ts`, `public/` | feat(phase1): Camino del Creyente + GoldenTicket freemium (#52) |
| `6c115f2` | ~2026-05-07 | `public/investor-landing.html` | feat(landing): tabs Adoptar/Inversores · Web3 transparency (#47) |
| `5ad29aa` | ~2026-05-05 | `public/investor-landing.html` | chore: update adoption price in investor landing |
| `d6cd8cc` | ~2026-05-01 | `public/investor-landing.html`, `src/` | feat(web3): CDP Onramp ready for review (#41) |
| `ed8abaa` | ~2026-04-30 | `public/investor-landing.html` | feat: landing copy changes — harvest + CDP JWT (#36) |
| `e5d7c47` | 2026-04-29 | `public/investor-landing.html` | **feat: SPA + investor landing rebuild** — new UE, 60/30/10, fiat+web3 mockups |
| `eb30b80` | 2026-04-28 | `public/investor-landing.html` | copy: simplify s015_body |
| `cac5fd4` | ~2026-04-28 | `public/investor-landing.html` | fix(logo): caua-bean entrance animation |
| `32b4949` | ~2026-04-28 | `public/investor-landing.html` | feat: JSON-driven cacao tree builder + Caúa logo |
| `7e7e245` | ~2026-04-27 | `public/investor-landing.html` | copy: hero ecosystem framing, 2026 footer |
| `3c212ec` | ~2026-04-27 | `public/investor-landing.html` | feat(landing-3d): cacao tree narrative (#33) |
| `4006ef7` | ~2026-04-27 | `public/investor-landing.html` | feat(landing): relocate dual-CTA + B2B-SaaS upgrade tiers (#31) |
| `b1023f5` | ~2026-04-27 | `public/investor-landing.html` | chore: add ES + EN i18n bundles for dual-path CTA (#30) |
| `8b3b627` | ~2026-04-27 | `public/investor-landing.html` | feat(landing): dual-path CTA — Creyente vs Inversor (#29) |
| `6966afe` | ~2026-04-26 | `public/investor-landing.html` | feat(phase-1): HubSpot contact bridge (#24) |
| `faba16c` | ~2026-04-26 | `public/investor-landing.html` | feat: OG thumbnail + Meta API + HubSpot sync (#20) |

### Baseline verification (run against HEAD `c807bae`)

| Check | File / Lines | Verdict |
|-------|-------------|---------|
| `INVESTOR_WALLETS` CTO = `0x7Ca1624e534ebE18F46BBA56229981134945464e`, custody = Bitso | `src/utils/constants.ts:211–218` | **OK** |
| `INVESTOR_WALLETS` CEO = `0x7E9E25cFfc8BC68Fb9E1f4708e761C68a37a846A`, custody = Coinbase | `src/utils/constants.ts:219–225` | **OK** — `b0854e7` touched `constants.ts` but did not modify `INVESTOR_WALLETS` |
| `record-investor-transfer` accepts anon + email path | `supabase/functions/record-investor-transfer/index.ts:54–81` | **OK** — zero new commits to this function |
| `WalletCheckout` mounted **outside** `<AnimatePresence>` in `InvestorPath` | `src/components/fund/InvestorPath.tsx:184–190` | **OK** — protective comment preserved |
| `cfb*` vanilla JS wallet functions present in `investor-landing.html` | `public/investor-landing.html:3168–3335` | **DRIFT** — functions intact (11 confirmed) but migrated from original lines ~1580–1745 to ~3168–3335 due to page rebuild. See below. |

### DRIFT detail — `public/investor-landing.html`

The landing page grew from ~1,750 lines at deploy to **3,421 lines** today. The rebuild (`e5d7c47`, Apr 29) added substantial new content above the wallet checkout block — 3D cacao tree animation, dual-path CTA, i18n bundles, CDP Onramp section, and a GoldenTicket freemium section. The `cfb*` checkout functions themselves were **not modified**; they were pushed down as new sections were prepended.

**Checkout logic integrity: intact.** All 11 `cfb*` functions are present:
`cfbBox`, `cfbCloseModal`, `cfbCloseBtn`, `cfbEsc`, `cfbRenderStep1`, `cfbContinueStep1`, `cfbRenderStep2`, `cfbCopyAddr`, `cfbRenderStep3`, `cfbSubmit`, `cfbRenderSuccess`

**Risk:** Any future diff that edits lines in the 3000–3421 range carries regression risk for the wallet flow. The line-number reference in the original PR #16 description (`~lines 1564–1730`) is now stale documentation.

### Pre-existing code finding (not new, not a regression)

`src/lib/hubspotTracking.ts:82` reads cookie consent from `localStorage` (`caua_cookie_consent`). This violates CauaCore §8 ("NUNCA localStorage"). The pattern predates the investor flow and is used only for consent state (read-only, non-sensitive). Still unresolved as of this audit.

---

## § 2 — Supabase SQL checklist

Run these against the production project (`kjygovuiphbxcdxeduco`) in the Supabase SQL editor.

```sql
-- 1. Transfer volume since deploy
SELECT
  count(*)             AS total,
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

**Expected healthy state:** Query 5 returns 0 rows. Query 6 returns 0 rows (all pending verified within 24h SLA). Query 1 shows a mix of `pending` and whatever final state your team uses (`verified`, `rejected`).

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

3. **Check event volume by source:** The `investor_transfer_recorded` event fires from the React SPA (`/app/fund`). The static landing page fires its own HubSpot tracking directly via `_hsq.push`. Verify both sources show events.

4. **Contacts created:** Filter contacts in HubSpot by `Create date >= 2026-04-26` and check for contacts with `caua_tracking_consent = analytics` or `both` — these are investors who completed the form and consented.

---

## § 4 — Coinbase Commerce recommendation

**Recommendation: INVESTIGATE** *(upgraded from KEEP DISABLED in PR #18 draft)*

### Evidence

**Git log** for `supabase/functions/create-coinbase-charge/`:
```
f8b968a  2026-04-26  fix(fund): make crypto wallet section visible by default (#13)
```
Zero code changes since deploy. The function itself is frozen.

**Env var wiring** (`git grep COINBASE_COMMERCE_API_KEY`):
```
supabase/functions/create-coinbase-charge/index.ts:8:  // Required env vars: ... COINBASE_COMMERCE_API_KEY
supabase/functions/create-coinbase-charge/index.ts:55:  const apiKey = Deno.env.get('COINBASE_COMMERCE_API_KEY')
```

**New finding since PR #18 draft** — `docs/MAINNET_PREP.md:183`:
```
| `COINBASE_COMMERCE_API_KEY` | Investor flow `create-coinbase-charge` |
| ... | provisioned 2026-04-29 (legacy Commerce key) |
```
This note was added after the original audit was drafted. It states the key was provisioned on 2026-04-29 — 3 days after deploy. If accurate, the `create-coinbase-charge` endpoint now returns a real response rather than a 503 when called directly (bypassing the UI gate).

**UI surface** (`src/components/fund/PaymentSelector.tsx:67–68`):
```ts
sub: T('Multi-chain · próximamente', 'Multi-chain · coming soon'),
coming: true,   // button disabled, opacity 0.5, onClick gated
```
Users cannot reach the endpoint from the UI. But the function may be callable via direct API call.

**Conclusion:** The UI gate is intact so there is no user-facing impact. However, the `MAINNET_PREP.md` note suggests the Supabase secret may now be active. The operator must verify whether `COINBASE_COMMERCE_API_KEY` is actually set in Supabase Secrets today and decide on next step (keep disabled + remove key, or enable the UI gate for a controlled rollout).

---

## § 5 — Action items

| # | Owner | Action | Where | Urgency |
|---|-------|--------|-------|---------|
| 1 | Operator | Run SQL queries 1–4 (§ 2) | Supabase SQL editor | **Now** |
| 2 | Operator | Run SQL query 5 (duplicate tx_hash check) | Supabase SQL editor | **Now** |
| 3 | Operator | Run SQL query 6 (stale pending SLA check) — manually verify or reject rows older than 48h | Supabase SQL editor | **Now** |
| 4 | Operator | Open HubSpot funnel report for 3 events (§ 3) | HubSpot → Reports | This week |
| 5 | Operator | **Check if `COINBASE_COMMERCE_API_KEY` is set in Supabase Secrets.** If yes: decide to enable UI gate or remove the key. If no: update MAINNET_PREP.md to reflect actual status. | Supabase Dashboard → Edge Functions → Secrets | **This week** |
| 6 | Dev team | Update PR #16 line-number reference — `cfb*` functions now at `investor-landing.html:3168–3335`, not `~1564–1730` (stale docs, low risk) | `public/investor-landing.html` | Low priority |
| 7 | Dev team | Migrate `hubspotTracking.ts` consent read from `localStorage` to React context (CauaCore §8) | `src/lib/hubspotTracking.ts:82` | Low priority — tech debt |
| 8 | Dev team | Plan Coinbase Commerce phase 2: set secret + remove `coming: true` flag + E2E test on staging before enabling | `src/components/fund/PaymentSelector.tsx:68` | When roadmap permits |
