# Coinbase Onramp Application — Response Draft

**To:** CDP Support (CX CDP Lead) · cdp-support@coinbase.com
**From:** Amaury Amed · CTO · CauaCorp / Cacao Fruta Brutal
**Re:** Onramp App ID approval

> Copy this into the email reply. Replace `<placeholders>` with the live values when sending.

---

Hi CDP team,

Thanks for the prompt review. Below is the requested information for our Onramp integration.

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

### Production (Base Sepolia testnet currently — mainnet pending audit)

- **Web3 onboarding:** https://cacaofrutabrutal.com/app/web3/onboarding
- **Web3 landing (where OnrampButton renders):** https://cacaofrutabrutal.com/app/web3
- **Adoption flow:** https://cacaofrutabrutal.com/app/adoptar (with crypto option after wallet link)

The Onramp button currently shows **"ONRAMP CONFIG PENDING"** because we haven't been issued an App ID yet — that's exactly what this application is for. Once approved, the same component will render the live Onramp launcher (compliant flow described in §4).

### GitHub (open source)

- Repo: https://github.com/<org>/cacao-fruta-brutal (MIT)
- Charter: `docs/CHARTER.md`
- Web3 architecture: `docs/WEB3.md`
- KYC + tiers: `docs/KYC.md`
- Compliance + geo-blocks: `docs/COMPLIANCE.md`

---

## 4. Security requirements compliance

We've reviewed https://docs.cdp.coinbase.com/onramp/security-requirements. Status of each requirement:

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Backend API authentication before requesting session token | **In progress** — see commit `<hash>` introducing `supabase/functions/coinbase-onramp-session` Edge Function. Auth via Supabase JWT (user must be logged in + KYC verified Tier 1+). | Ready to wire CDP API key + JWT signing once approved. |
| `Access-Control-Allow-Origin` not `*` for authenticated endpoints | **Done** — `supabase/functions/cors-config.ts` enforces a strict allowlist (`cacaofrutabrutal.com`, `app.cacaofrutabrutal.com`, dev origins). | All authenticated Edge Functions inherit this config. |
| Session token-based authentication | **Implementing now** — `coinbase-onramp-session` Edge Function will sign the CDP JWT server-side using our CDP API key and return a short-lived session token to the frontend. | Frontend (`OnrampButton.tsx`) refactored to request a session token before opening the popup. |
| No wallet address in Onramp pay URL | **Will be enforced** — the new flow passes only the session token in the URL; wallet address is in the JWT payload server-side. | Old code (App ID + addresses[] in URL) is being deprecated. |

---

## 5. Test credentials

- **Test user:** `cdp-review@cauaculture.co` · password: provided separately in your CRM ticket
- **Sandbox KYC:** Persona sandbox template ID provided on request
- **Test wallet:** Smart Wallet passkey created during onboarding — no manual import needed

---

## 6. Outstanding questions for CDP

1. Does Onramp Sandbox accept Base Sepolia destination addresses, or do we need to point at Base mainnet for review even though our smart contracts are still on Sepolia?
2. Are there UX guidelines about the disclaimer copy we must show before opening the Onramp popup (custody, fees, KYC handoff)?
3. Approximate review SLA once §1–§5 are complete?

---

Happy to hop on a 15-minute Loom or call to walk through the staging flow if helpful.

Best,
Amaury Amed
CTO · CauaCorp
amaury@cauaculture.co
