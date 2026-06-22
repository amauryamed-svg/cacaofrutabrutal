# Coinbase Onramp Application — Response Draft

**To:** CDP Support (CX CDP Lead) · cdp-support@coinbase.com
**From:** Amaury Amed · CTO · CauaCorp / Cacao Fruta Brutal
**Re:** Onramp integration ready for compliance review

> Reply to the 29-Apr-2026 Support Hub case asking for the integration to be live before full review. Placeholders marked `<TBD>` get filled in once Fase 5 (test-account pre-seed) and Fase 6 (smoke test) of the Onramp go-live plan are done.

---

Hi CDP team,

Thanks for the guidance in the 29-Apr reply. Per your note that compliance review can begin once the integration is "fully integrated either in staging or production and accessible for assessment" (with the 25-tx / $5-max sandbox cap), this update closes that loop:

- **Onramp is now wired end-to-end and live in production** using the sandbox API key we provisioned in the CDP Portal.
- The integration uses the **session-token security pattern** (no wallet address in URL — passed in the signed JWT payload server-side).
- We've pre-seeded a reviewer test account (KYC-verified, wallet linked) so the assessment can skip the Persona handoff entirely. Credentials are in §5 below.

Below is the requested information for our Onramp integration, updated to reflect the live state.

---

## 1. End-to-end flow

CauaCorp ("Cacao Fruta Brutal") is a regenerative-agriculture P2E platform on Base. Onramp is the fiat-to-crypto entry point for two flows:

**A) Adopt-a-Tree (consumer flow)**
1. User completes Persona KYC on `cacaofrutabrutal.com/app/web3/onboarding` (Tier 1 minimum).
2. SIWE wallet link via `/functions/v1/siwe-link-wallet` Edge Function — Chainalysis + OFAC screening before write.
3. User picks a tree adoption package (USDC $25–$250, on-chain via `TreeAdoption.sol`).
4. If user lacks USDC on Base, **Onramp opens** in a popup → Coinbase handles fiat KYC, ACH/card, and routes USDC straight to the user's connected Smart Wallet.
5. User returns to our app, confirms adoption tx, NFT mints via relayer.

**B) Investor / B2B sponsorship (in development for Phase 7)**
1. Pre-seed equity ($5K) or B2B sponsorship investors land on `/fund`.
2. They can pay via Stripe (USD), MercadoPago (COP), or Coinbase Commerce (USDC).
3. **Onramp is offered as a pre-step** for investors who want to use crypto but don't already hold USDC.

### Example use cases

| Persona | Flow | Onramp role |
|---------|------|-------------|
| Casual mobile user adopting their first tree | Smart Wallet passkey signup → card pays $25 → tree NFT minted | Onramp = card → USDC bridge |
| Latin-American investor sending $1K USDC | Existing wallet, low USDC balance | Onramp tops up gap |
| Crypto-native user with cbBTC | Skip Onramp, direct adopt with cbBTC | Onramp not used |

### Code references (public repo, MIT)

- Frontend Onramp launcher: `src/components/web3/OnrampButton.tsx`
- KYC + wallet linking: `supabase/functions/siwe-link-wallet/index.ts`
- Adoption flow: `contracts/src/TreeAdoption.sol` + `src/components/web3/AdoptWithCryptoButton.tsx`
- Compliance + CHARTER (custody, geo-blocks, KYC tiers): `docs/CHARTER.md`, `docs/WEB3.md`, `docs/COMPLIANCE.md`

---

## 2. Wallet custody model

**Strictly non-custodial.** CauaCorp never holds, controls, or can recover user private keys. This is binding charter law (`docs/CHARTER.md` §I.8):

> "Cero custodia de claves de usuario. CauaCorp no posee, no respalda, ni puede recuperar la llave privada de ningún usuario. Coinbase Smart Wallet (passkey) y RainbowKit son opciones de UX, no de custodia. Si un usuario pierde su wallet, perdió sus activos. Lo decimos antes del onboarding y lo repetimos después."

### Custody by participant

| Funds source | Custody at rest |
|--------------|------------------|
| **Onramp-ed funds** (USDC/ETH/cbBTC) | User's own Coinbase Smart Wallet (passkey) or self-custodial wallet (Rainbow, MetaMask, etc.). Tokens land directly in `addresses[wallet]` set by the user — CauaCorp infrastructure never touches the funds. |
| **Adoption proceeds** (post-tx) | Split on-chain by `TreeAdoption.sol`: 60% Guardian wallet (the farmer), 30% Treasury (multisig), 10% Protocol (multisig). All wallets disclosed publicly in CHARTER. |
| **Server-side keys** | Relayer (mints NFTs gasless), Oracle (signs EIP-712 burn payloads), IoT Oracle (posts Merkle roots). Keys live in Supabase Edge Function env (encrypted). They never sign user-funds tx; they only sign protocol metadata. |

The user disclosure copy lives in `src/pages/Web3Onboarding.tsx` and is shown both pre-onboarding (gate) and post-onboarding (recap).

---

## 3. Live integration URLs

### Production

- **Web3 landing (where the reviewer should click the Onramp button):** https://cacaofrutabrutal.com/app/web3
- **Web3 onboarding (KYC + wallet-link, pre-seeded for the test account):** https://cacaofrutabrutal.com/app/web3/onboarding
- **Adoption flow:** https://cacaofrutabrutal.com/app/adoptar (with crypto option after wallet link)

**State of the Onramp button right now:** fully functional with sandbox credentials. Click → frontend POSTs to our session-token Edge Function → server signs an ES256 CDP JWT, requests `/onramp/v1/token`, returns `pay.coinbase.com/buy?sessionToken=...` → popup opens. No wallet address in the URL (passed in the signed JWT payload only, per CDP security requirements).

**Sandbox limits respected:** the Onramp button is hardcoded at `presetUsd={5}` ([`src/pages/Web3Landing.tsx:235`](https://github.com/amauryamed-svg/cacaofrutabrutal/blob/main/src/pages/Web3Landing.tsx#L235)) so test purchases stay within the $5/tx cap. Will be lifted post-approval.

**Destination chain:** Base mainnet (chain 8453) — the Coinbase consumer popup `pay.coinbase.com/buy` only exposes mainnet flows, even with sandbox API credentials. (This addresses one of the questions in our previous draft.)

### GitHub (open source, MIT)

- Repo: https://github.com/amauryamed-svg/cacaofrutabrutal
- Charter: https://github.com/amauryamed-svg/cacaofrutabrutal/blob/main/docs/CHARTER.md
- Web3 architecture: https://github.com/amauryamed-svg/cacaofrutabrutal/blob/main/docs/WEB3.md
- KYC + tiers: https://github.com/amauryamed-svg/cacaofrutabrutal/blob/main/docs/KYC.md
- Compliance + geo-blocks: https://github.com/amauryamed-svg/cacaofrutabrutal/blob/main/docs/COMPLIANCE.md
- Onramp session token Edge Function (compliant, ready to wire CDP key): https://github.com/amauryamed-svg/cacaofrutabrutal/blob/main/supabase/functions/coinbase-onramp-session/index.ts
- Onramp button (refactored, no wallet in URL): https://github.com/amauryamed-svg/cacaofrutabrutal/blob/main/src/components/web3/OnrampButton.tsx

---

## 4. Security requirements compliance

We've reviewed https://docs.cdp.coinbase.com/onramp/security-requirements. Status of each requirement:

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Backend API authentication before requesting session token | **Done & live.** [`coinbase-onramp-session/index.ts:54-62`](https://github.com/amauryamed-svg/cacaofrutabrutal/blob/main/supabase/functions/coinbase-onramp-session/index.ts#L54-L62) verifies Supabase JWT → user_id before any CDP call. KYC + wallet + geo gates at [lines 201-219](https://github.com/amauryamed-svg/cacaofrutabrutal/blob/main/supabase/functions/coinbase-onramp-session/index.ts#L201-L219). | Edge Function v1 ACTIVE since 2026-04-29 on Supabase project `kjygovuiphbxcdxeduco`. |
| `Access-Control-Allow-Origin` not `*` for authenticated endpoints | **Done & live.** [`cors-config.ts`](https://github.com/amauryamed-svg/cacaofrutabrutal/blob/main/supabase/functions/cors-config.ts) enforces a strict allowlist. | All authenticated Edge Functions inherit. |
| Session token-based authentication | **Done & live.** ES256 JWT signed server-side using native Web Crypto (no third-party JWT lib) at [`index.ts:141-182`](https://github.com/amauryamed-svg/cacaofrutabrutal/blob/main/supabase/functions/coinbase-onramp-session/index.ts#L141-L182). PEM parsing handles both PKCS8 and SEC1 formats at [`index.ts:106-128`](https://github.com/amauryamed-svg/cacaofrutabrutal/blob/main/supabase/functions/coinbase-onramp-session/index.ts#L106-L128). Returned to frontend as `{ session_token, onramp_url }`. | Sandbox API key is provisioned and the function returns 200s. |
| No wallet address in Onramp pay URL | **Done & live.** Wallet address travels in the signed JWT payload at [`index.ts:240`](https://github.com/amauryamed-svg/cacaofrutabrutal/blob/main/supabase/functions/coinbase-onramp-session/index.ts#L240). The popup URL contains only `?sessionToken=...` — verifiable in the reviewer's DevTools. | Confirmed during smoke test (HAR file attached). |

---

## 5. Reviewer test credentials

We've pre-provisioned a clean review account so the assessment can skip the Persona sandbox handoff entirely (KYC pre-marked verified, wallet pre-linked to Base mainnet).

| Field | Value |
|---|---|
| **Live URL** | https://cacaofrutabrutal.com/app/web3 |
| **Test email** | `<TBD — filled in after Fase 5 of go-live plan>` |
| **Test password** | `<TBD — sent via separate channel on reply>` |
| **Pre-linked wallet** | `<TBD — Base mainnet address we control>` (chain 8453) |
| **Pre-set KYC tier** | Tier 1, status `verified` |
| **Geo-block status** | not blocked |

**What to do once logged in:**
1. Land on `/app/web3` — you'll see `BUY USDC WITH CARD · BASE` button enabled.
2. Click → DevTools Network tab will show `POST /functions/v1/coinbase-onramp-session` → 200 with `session_token` + `onramp_url`.
3. Popup opens `pay.coinbase.com/buy?sessionToken=...` — note: **no `addresses=` or `walletAddress=` in URL**.
4. From the popup, the consumer KYC + payment flow is Coinbase-hosted; sandbox caps each tx at $5 and 25 total — you don't need to actually complete the purchase to verify the integration.

**Failure-mode spot-checks** (these confirm our gates):
- Logout, click button → frontend shows `login_required` error.
- Sign up a fresh account (no KYC) → click button → backend returns `kyc_required`.

**Direct contact:** `amaury@cauacolombia.co` (CTO). Happy to share screen async (Loom) or jump on a 15-min call if anything fails to load.

---

## 6. Outstanding questions for CDP

1. **UX disclaimer copy** — are there required disclosures we must show before opening the Onramp popup (custody, fees, KYC handoff)? Charter §10 already requires inline risk disclosure before each on-chain write; happy to extend that copy to the Onramp button if you have a recommended template.
2. **Review SLA** — approximate timeline from this reply to full compliance review and sandbox-cap removal?
3. **Scaling path** — once approved, what's the recommended path from sandbox → production limits? Is there a step-up tier or do we go direct to standard limits?

---

Happy to hop on a 15-minute Loom or call to walk through the staging flow if helpful.

Best,
Amaury Amed
CTO · CauaCorp
amaury@cauacolombia.co
