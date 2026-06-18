# CDP Support Reply — 17 Jun 2026

**To:** cdp-support@coinbase.com (reply to Support Hub case)
**From:** Amaury Amed · amaury@cauaculture.co
**Re:** Onramp review — links, credentials, Loom, and backend API

---

Hi CDP team,

Thank you for the follow-up. Here is everything you requested:

---

## 1. Integration URLs

The Onramp is live at two entry points on production:

| Screen | URL | Notes |
|--------|-----|-------|
| **Web3 landing (start here)** | https://cacaofrutabrutal.com/app/web3 | "BUY USDC WITH CARD · BASE" button visible after login |
| Adoption flow (secondary) | https://cacaofrutabrutal.com/app/adoptar | Onramp appears as a pre-step when user lacks USDC |

---

## 2. Test credentials

We've provisioned a reviewer account with KYC pre-verified (Tier 1) and a wallet pre-linked to Base Sepolia, so you can skip the Persona and SIWE steps entirely.

| Field | Value |
|-------|-------|
| Login URL | https://cacaofrutabrutal.com |
| Auth method | **Sign in with Google** |
| Google email | `amaury@cauaculture.co` |
| Google password | `<SEND VIA SEPARATE CHANNEL>` |
| Pre-linked wallet (Base Sepolia) | `<SEND VIA SEPARATE CHANNEL>` |
| KYC status | `verified` · Tier 1 |
| Geo-block | `false` · country `US` |

> **Note on credentials:** I will send the password and wallet address via a separate reply to avoid storing them in this thread.

**What to do once logged in:**

1. Click **"Sign in with Google"** using `amaury@cauaculture.co`
2. Navigate to **https://cacaofrutabrutal.com/app/web3**
3. Click **"BUY USDC WITH CARD · BASE"**
4. Open DevTools → Network → filter for `coinbase-onramp-session`
5. Verify the POST returns `200` with `{ ok: true, session_token: "...", onramp_url: "..." }`
6. Popup opens `pay.coinbase.com/buy?sessionToken=...`
   - ✅ Confirm: **no `addresses=` or `walletAddress=` parameter in the URL**

**Failure-mode gates (confirm our checks work):**

- Log out → click button → frontend returns `login_required`
- Register a fresh account (no KYC) → button returns `kyc_required` from the Edge Function

---

## 3. Screen recording

Loom: **[PASTE LOOM URL HERE]**

The recording covers:

1. Login with reviewer credentials
2. Navigate to `/app/web3` — Onramp button visible
3. Click the button — DevTools Network panel shows `coinbase-onramp-session` POST → 200
4. Response body: `session_token` + `onramp_url` (no wallet in URL)
5. `pay.coinbase.com/buy?sessionToken=...` popup opens
6. Failure gates: `kyc_required` (fresh account) and `login_required` (logged out)

---

## 4. Backend API that mints the session token

**Live endpoint:**

```
POST https://kjygovuiphbxcdxeduco.supabase.co/functions/v1/coinbase-onramp-session
Authorization: Bearer <user-supabase-jwt>
Content-Type: application/json

Body: { "asset": "USDC", "preset_usd": 5 }

Response 200: { "ok": true, "session_token": "...", "onramp_url": "https://pay.coinbase.com/buy?sessionToken=..." }
Response 401: { "error": "invalid_jwt" }
Response 403: { "error": "kyc_required" | "geo_blocked" | "wallet_link_required" }
Response 503: { "error": "cdp_api_key_not_configured" }
```

**Source code (open source, MIT):**
https://github.com/amauryamed-svg/cacaofrutabrutal/blob/main/supabase/functions/coinbase-onramp-session/index.ts

**What the function does, step by step:**

1. Validates the `Authorization: Bearer` Supabase JWT → resolves `user_id`
2. Fetches `user_profiles` row: checks `kyc_status = 'verified'`, `kyc_tier ≥ 1`, `wallet_address` not null, `geo_blocked = false`
3. Signs a short-lived CDP JWT (2-minute TTL) using our CDP API key — supports both legacy ES256/ECDSA and current EdDSA Ed25519 key formats (auto-detected from the secret format)
4. POSTs to `https://api.developer.coinbase.com/onramp/v1/token` with `addresses: [{ address: wallet_address, blockchains: ['base'] }]`
5. Returns `{ session_token, onramp_url }` to the client — the wallet address travels in the signed JWT payload server-side and **never appears as a URL parameter**

**CDP App ID:** `69f4de157c4c8997912c20ac`

---

Happy to jump on a 15-minute screen share if anything doesn't load.

Best,

Amaury Amed
Co-Founder & CTO — Caúa Colombia SAS / WA'KA1 CORP
amaury@cauaculture.co | cacaofrutabrutal.com
