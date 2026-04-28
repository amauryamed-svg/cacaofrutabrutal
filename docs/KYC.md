# CauaCorp KYC Implementation — Persona

> Versión 1.0 · 2026-04-27 · Implementación técnica del programa AML/CFT en [`docs/COMPLIANCE.md`](COMPLIANCE.md).

## Provider: Persona

**Por qué Persona:** $0 hasta 1k verifs/mes (free starter), webhook simple HMAC, hosted UI quita responsabilidad UX, geographic coverage incluye Latam + EEUU + EU. Costo post-1k: ~$0.50/Government ID, ~$2/Government ID + Selfie.

**Account:** `cauacorp.withpersona.com` (a crear en Phase 2).

## Tier matrix

| Tier | Persona Inquiry Template | Required fields | Acumulado lifetime cap |
|---|---|---|---|
| **0 — Anonymous** | (none, pre-KYC) | Wallet connect SIWE only | $0 — solo lectura, sin mint/redeem |
| **1 — Basic** | `tmpl_basic_v1` | Government ID + Country + DOB | $1,000 |
| **2 — Enhanced** | `tmpl_enhanced_v1` | Tier 1 + Selfie liveness + Address proof | $10,000 |
| **3 — Investor** | `tmpl_investor_v1` | Tier 2 + Accredited investor self-cert + KYB if entity | Sin cap |

## User flow

```
1. User clicks "Mint Tree NFT" or "Redeem Mazorcas" or "Adopt with crypto"
2. Frontend checks user_profiles.kyc_status + kyc_tier
3. If insufficient tier:
   ┌─────────────────────────────────────┐
   │ Modal: "Verification required for   │
   │ this action. Verify identity →"     │
   └────────────────┬────────────────────┘
                    ▼
4. Frontend opens Persona hosted flow (popup or redirect):
   https://withpersona.com/verify?inquiry-template-id=tmpl_basic_v1
                                  &reference-id={user_id}
                                  &fields[wallet_address]={addr}
5. User completes Persona flow (~3-5 min for Tier 1, ~7-10 min for Tier 2)
6. Persona POSTs webhook → /functions/v1/persona-webhook
7. Webhook verifies HMAC, writes:
   user_profiles.kyc_verified_at = now()
   user_profiles.kyc_tier = N
   user_profiles.kyc_provider_id = inquiry_id
   user_profiles.country = country_code
8. Frontend polls /functions/v1/get-kyc-status until verified
9. Original action retried — mint/redeem/adopt proceeds
```

## Webhook implementation

### `/supabase/functions/persona-webhook/index.ts`

```ts
// Pseudocode — actual impl in Phase 2
import { createHmac } from 'std/crypto'

Deno.serve(async (req) => {
  const sig = req.headers.get('persona-signature')
  const body = await req.text()
  const expected = createHmac('sha256', Deno.env.get('PERSONA_WEBHOOK_SECRET')!)
    .update(body)
    .digest('hex')
  if (sig !== `t=...,v1=${expected}`) return new Response('invalid sig', { status: 401 })

  const event = JSON.parse(body)
  if (event.data.type !== 'inquiry.completed') return new Response('ignored', { status: 200 })

  const inquiryId = event.data.id
  const referenceId = event.data.attributes.referenceId  // = user_id
  const status = event.data.attributes.status            // 'completed' | 'failed'
  const country = event.data.attributes.fields.country
  const tier = inferTierFromTemplate(event.data.attributes.inquiryTemplateId)

  if (status !== 'completed') {
    await supabase.from('user_profiles').update({ kyc_status: 'failed' }).eq('user_id', referenceId)
    return new Response('logged failure', { status: 200 })
  }

  // Geo-block check
  if (GEO_BLOCKED_COUNTRIES.includes(country)) {
    await supabase.from('user_profiles').update({
      kyc_status: 'blocked',
      country,
      geo_blocked: true
    }).eq('user_id', referenceId)
    return new Response('blocked country', { status: 200 })
  }

  await supabase.from('user_profiles').update({
    kyc_status: 'verified',
    kyc_tier: tier,
    kyc_verified_at: new Date().toISOString(),
    kyc_provider_id: inquiryId,
    country,
    geo_blocked: false
  }).eq('user_id', referenceId)

  return new Response('ok', { status: 200 })
})
```

`verify_jwt = false` (HMAC en body es la auth real). Configurado en `supabase/config.toml`:

```toml
[functions.persona-webhook]
verify_jwt = false
```

## Database schema (migración 028)

```sql
-- supabase/migrations/028_kyc_wallet.sql

ALTER TABLE user_profiles
  ADD COLUMN country         text,
  ADD COLUMN kyc_status      text DEFAULT 'none' CHECK (kyc_status IN
                              ('none','pending','verified','failed','blocked','paused_review')),
  ADD COLUMN kyc_tier        smallint DEFAULT 0 CHECK (kyc_tier BETWEEN 0 AND 3),
  ADD COLUMN kyc_verified_at timestamptz,
  ADD COLUMN kyc_provider_id text,    -- Persona inquiry_id
  ADD COLUMN wallet_address  text,
  ADD COLUMN wallet_chain_id integer,
  ADD COLUMN geo_blocked     boolean DEFAULT false;

CREATE INDEX idx_user_profiles_wallet_address
  ON user_profiles (wallet_address)
  WHERE wallet_address IS NOT NULL;

CREATE INDEX idx_user_profiles_kyc_status
  ON user_profiles (kyc_status)
  WHERE kyc_status != 'none';

-- RLS unchanged: user reads own row (the trigger pattern from migration 001)

-- Sanctions screenings
CREATE TABLE sanctions_screenings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id),
  wallet_address text,
  provider     text NOT NULL,                 -- 'chainalysis' | 'ofac'
  verdict      text NOT NULL,                 -- 'green' | 'flagged_for_review' | 'blocked_chainalysis' | 'blocked_ofac'
  payload      jsonb,                         -- raw provider response
  created_at   timestamptz DEFAULT now()
);
CREATE INDEX ON sanctions_screenings (wallet_address);
CREATE INDEX ON sanctions_screenings (user_id);

-- OFAC SDN cron-pulled
CREATE TABLE ofac_blocklist (
  address      text PRIMARY KEY,
  list_type    text NOT NULL,
  added_at     timestamptz DEFAULT now(),
  removed_at   timestamptz,
  source_url   text NOT NULL
);

-- SIWE replay protection
CREATE TABLE wallet_link_nonces (
  nonce        text PRIMARY KEY,
  user_id      uuid REFERENCES auth.users(id),
  wallet_address text NOT NULL,
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  consumed_at  timestamptz
);
CREATE INDEX ON wallet_link_nonces (user_id, expires_at);

-- RLS
ALTER TABLE sanctions_screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_link_nonces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_reads_own_screenings" ON sanctions_screenings
  FOR SELECT USING (
    user_id = (SELECT auth.uid())
    OR (SELECT auth.uid()) IN (SELECT user_id FROM user_profiles WHERE caua_role = 'founder')
  );

CREATE POLICY "user_reads_own_nonces" ON wallet_link_nonces
  FOR SELECT USING (user_id = (SELECT auth.uid()));

-- ofac_blocklist es público read (no PII, es info pública)
ALTER TABLE ofac_blocklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_ofac" ON ofac_blocklist FOR SELECT USING (true);
```

## SIWE flow (`/supabase/functions/siwe-link-wallet/index.ts`)

```
1. User clicks "Connect wallet" en /web3/onboarding
2. wagmi opens Smart Wallet/Rainbow → user signs SIWE message:
     "cacaofrutabrutal.com wants you to sign in with your Ethereum account:
      0x...
      URI: https://cacaofrutabrutal.com
      Version: 1
      Chain ID: 8453
      Nonce: <from server>
      Issued At: <ISO>
      Expires At: <ISO + 5min>"
3. Frontend POSTs { message, signature } + Bearer JWT to siwe-link-wallet
4. Edge Function:
   a. Verifica JWT → user_id
   b. Lee nonce de message → check wallet_link_nonces (consumed_at IS NULL, not expired)
   c. viem.verifyMessage({ message, signature }) → recovered address
   d. Address screening: Chainalysis + OFAC pre-write
   e. Si todo verde:
       - INSERT sanctions_screenings (verdict='green')
       - UPDATE wallet_link_nonces SET consumed_at = now() WHERE nonce = ?
       - UPDATE user_profiles SET wallet_address=?, wallet_chain_id=8453 WHERE user_id=?
   f. Return 200 { wallet_address }
5. Si screening rojo: return 403 { reason: 'sanctioned' | 'high_risk' }
```

Nonce previene replay; expiry 5min limita ventana de attack.

## RLS guarantees

- Solo el usuario puede ver su propio `kyc_provider_id`, `wallet_address`, `kyc_verified_at`. Founders ven todo (auditoría).
- `sanctions_screenings` accesible al usuario propio y founders.
- `wallet_link_nonces` no accesible al frontend en producción (solo Edge Function via service_role).
- `ofac_blocklist` lectura pública (info que el Treasury publica abierto).

## Frontend integration

```tsx
// src/components/web3/KYCGate.tsx (Phase 2)
const { kyc_status, kyc_tier } = useKYCStatus()
const required: Tier = action === 'mint' ? 1 : action === 'redeem' ? 1 : action === 'adopt_crypto' ? 2 : 3

if (kyc_tier < required) {
  return <KYCPromptModal target={required} reason={action} />
}
return children
```

KYCPromptModal abre Persona hosted flow vía `https://withpersona.com/verify?...`. Polling cada 3s a `/get-kyc-status` hasta `verified`.

## Retention & deletion

| Data | Storage | Retention | Deletion trigger |
|---|---|---|---|
| `kyc_verified_at`, `kyc_tier`, `kyc_provider_id` | Supabase `user_profiles` | 5 años post-account-close | Account deletion + 5y cron |
| Government ID images | Persona (provider) | 90 días | Persona retention policy |
| `sanctions_screenings` | Supabase | 7 años | Manual founder review |
| `ofac_blocklist` rows | Supabase | Indefinida | Nunca (audit trail) |
| `wallet_link_nonces` | Supabase | 5 minutos | Auto-expiry + cron cleanup |

## Account deletion (GDPR/CCPA-style)

User puede solicitar eliminación vía email a `privacy@cauacorp` (Phase 2 setup). Process:
1. Soft delete: `user_profiles.deleted_at = now()` (no hard delete inmediato).
2. Persona inquiry deletion API call.
3. Wallet address conserva en `sanctions_screenings` (legal hold) pero unlinkeada de `user_id`.
4. NFTs en wallet del usuario quedan on-chain (no podemos borrarlos — la blockchain es publica).
5. Hard delete a los 5 años post-soft-delete.

Comunicado al usuario: "Tu identidad se elimina, pero tus NFTs siguen siendo tuyos en la wallet. La cadena pública es inmutable."

## Edge cases

- **Usuario verifica con país no-blocked, luego viaja a país blocked:** geo-block es per-request en Cloudflare, no per-account. Si conecta desde IP iraní → 451 al request, account no se invalida.
- **Wallet pasa screening verde, luego es flagged 6 meses después:** background re-screening cron (semanal) actualiza `sanctions_screenings`. Si re-screen rojo, `kyc_status='paused_review'` y se notifica.
- **Persona reporta "manual review pending" indefinido:** UI muestra "verification in review" sin timeline. Cron de cleanup marca como `failed` después de 30d sin update y notifica al usuario para re-iniciar.
- **Usuario quiere cambiar wallet:** desvincular requiere SIWE de la wallet actual + SIWE de la nueva (dual sign-off). Nueva wallet pasa screening fresh.

## Testing checklist (Phase 2 gate)

- [ ] Persona sandbox account configurado, webhook URL en `.env`
- [ ] Migration 028 corre clean en local + staging
- [ ] SIWE happy path: connect → sign → verify → wallet linked
- [ ] OFAC reject: usar `0x8589427373D6D84E98730D7795D8f6f8731FDA16` (known SDN ETH addr) → 403
- [ ] Geo-block: simular `CF-IPCountry: IR` → 451
- [ ] Persona webhook HMAC: replay con sig wrong → 401
- [ ] Replay nonce: re-submit same SIWE message → 401 (nonce consumed)
- [ ] Tier escalation: usuario Tier 1 intenta `adopt_crypto` (Tier 2) → modal upgrade
- [ ] Account deletion: soft delete → re-signup con misma email → fresh state
