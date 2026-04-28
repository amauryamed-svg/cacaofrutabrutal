# CauaCorp AML/CFT Compliance Program

> Versión 1.0 · 2026-04-27 · Subordinado a [`docs/CHARTER.md`](CHARTER.md) principio I.6.

CauaCorp opera un protocolo agroforestal con representación on-chain (NFTs árbol, token utility `$CACAO`). Aunque no somos un Money Service Business (MSB) registrado —los rails fiat los provee Coinbase Commerce/Onramp, que sí lo son— operamos como **merchant** que recibe valor cripto, y como **emisor de utility tokens**. Esta combinación nos sujeta a la triple expectativa de:

1. **Bank Secrecy Act / FinCEN** — registros adecuados de transacciones, suspicious activity awareness.
2. **OFAC Sanctions** — screening obligatorio de wallets, países y personas.
3. **Texas Money Services Act** — Texas Department of Banking expectations para intermediación de valor (mitigado por usar Coinbase como rail MSB-licensed).

Esta política aplica **a todos los participantes** del protocolo, incluyendo founders, Guardianes, y cualquier wallet que interactúe con los contratos CauaCorp.

## Risk assessment

| Vector | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Wallet OFAC-sanctioned compra NFT | Baja | Crítico (sanción FinCEN) | Pre-write Chainalysis Address Screening + OFAC SDN cron |
| Usuario en jurisdicción sancionada (Iran, NK, Cuba, Syria, Crimea, Donetsk, Luhansk) | Baja | Crítico | Geo-block via Cloudflare CF-IPCountry + país en KYC |
| Layering via NFT árbol (compra-venta secuencial para ofuscar origen) | Media | Alto | Velocity rules: máx 3 trades/wallet/semana en Phase 7 monitorear; flag manual |
| Smurfing de adopciones (múltiples wallets bajo un humano) | Media | Medio | KYC 1-persona-1-cuenta vía Persona biometric; flag wallets que comparten device fingerprint |
| Compra masiva con BTC ilícito via Onramp | Baja | Alto | Coinbase Onramp ya hace su propio KYC/AML; redundancia con Chainalysis a la wallet receptora |
| Founder o insider muere con private keys | Media | Alto (operacional) | Multisig 2-of-2 mínimo en `PAUSER_ROLE`, backup encrypted en cold storage |
| Vulnerabilidad de contrato → drain | Baja | Crítico | OZ Pausable global, audit Phase 7, bug bounty Immunefi |

## Sanctions screening (OFAC + Chainalysis)

### OFAC SDN list ingestion

- **Source:** [OFAC SDN.csv](https://www.treasury.gov/ofac/downloads/sdn.csv) + [SDN crypto addresses](https://www.treasury.gov/ofac/downloads/sdnlist.txt)
- **Frequency:** pull cada 6h via `pg_cron` en Supabase
- **Storage:** tabla `ofac_blocklist` con columnas `(address text PRIMARY KEY, list_type text, added_at timestamptz, source_url text)`
- **Retention:** sin TTL — direcciones removidas del SDN se marcan `removed_at` pero no se borran (audit trail)

### Chainalysis Address Screening (free tier)

- API: `POST https://public.chainalysis.com/api/v1/address/{address}` con header `X-API-Key`
- Llamada en **cada** Edge Function que escribe `wallet_address` o ejecuta mint/redeem (`siwe-link-wallet`, `mint-tree-nft`, `sign-mazorca-burn`, `TreeAdoption.sol` pre-call check)
- Response `identifications[]` no vacío → BLOQUEO automático
- Logged en tabla `sanctions_screenings(user_id, wallet_address, provider, verdict, payload jsonb, created_at)`
- Free tier limit: ~50 calls/día — caching agresivo (24h TTL por dirección verde)

### Decisión y enforcement

```
┌────────────┐  green  ┌────────────┐
│ Pre-write  │────────►│ Proceed    │
│ Screening  │         └────────────┘
└──────┬─────┘
       │ red/flagged
       ▼
┌────────────┐
│ BLOCK +    │
│ log SAR    │ (manual review queue)
└────────────┘
```

- **Hit OFAC:** rechazo automático, response `403 sanctioned_address`, log `sanctions_screenings` con `verdict='blocked_ofac'`.
- **Hit Chainalysis high-risk:** rechazo automático, log `verdict='blocked_chainalysis'`.
- **Hit Chainalysis medium-risk:** flag para revisión manual (CTO+CEO), no autobloqueo, log `verdict='flagged_for_review'`.

## Geo-blocking

### Bloqueo de jurisdicciones

Lista basada en OFAC comprehensive sanctions + FATF blacklist:
- Iran, North Korea, Cuba, Syria, Crimea, Donetsk Oblast, Luhansk Oblast, Russia (post-2022 sectoral), Belarus (sectoral), Myanmar (sectoral).

Implementación:
1. **Edge layer (Cloudflare/Vercel):** header `CF-IPCountry` en cada request a `/web3/*`. Si en blocklist → return `451 Unavailable for Legal Reasons`.
2. **Persona KYC:** campo `country` capturado durante KYC. Si en blocklist → `kyc_status='blocked'`.
3. **Edge Function pre-write:** double-check `user_profiles.country` antes de mint/redeem.

Constante en `src/utils/constants.ts`:
```ts
export const GEO_BLOCKED_COUNTRIES = [
  'IR','KP','CU','SY','RU','BY','MM',
  'CRIMEA','DONETSK','LUHANSK'
] as const;
```

## KYC tiers

Detalle completo en [`docs/KYC.md`](KYC.md). Resumen:

| Tier | Límite acumulado | Verificación | Casos de uso |
|---|---|---|---|
| **0 — Anonymous** | $0 | Solo conexión wallet (SIWE) | Browse, ver NFTs |
| **1 — Basic** | $1,000 lifetime | Persona basic (gobierno ID) | Mint NFT árbol, redeem mazorcas |
| **2 — Enhanced** | $10,000 lifetime | Persona enhanced (ID + selfie + address) | Adoption con cripto, B2B sponsorship |
| **3 — Investor** | Sin límite | Tier 2 + accreditation (Reg D 506(c) si aplica) | Equity_5k+ via WalletCheckout |

Promotion entre tiers: usuario inicia flow Persona → webhook escribe `kyc_status='verified'` y `kyc_tier=N` → Edge Functions consultan tier antes de cada operación.

## Recordkeeping

### Transacciones registradas

Toda interacción on-chain CauaCorp queda en doble registro:
1. **On-chain:** event logs públicos (Transfer, Mint, RootPosted, Adopted).
2. **Off-chain:** tabla `token_events` (existente) + nuevas `mazorca_redemptions`, `tree_mints`, `adoption_charges`.

Retención mínima: **5 años** desde fecha de transacción (alineado con BSA expectations para MSBs y best-practice para non-MSBs).

### Datos KYC

Detalle en `docs/KYC.md`. Resumen retención:
- **Datos KYC verificados:** 5 años post-cierre de cuenta.
- **Documentos identidad raw:** 90 días en Persona (provider), referencia `kyc_provider_id` en Supabase indefinidamente.
- **Logs de screening:** 7 años (Chainalysis logs, OFAC matches).

## Suspicious Activity awareness

CauaCorp **no es FinCEN-registered MSB** y por tanto no tiene obligación formal de SAR (Suspicious Activity Report). Sin embargo, mantenemos un proceso interno de flagging:

### Triggers

1. Wallet con score Chainalysis high-risk transactando con CauaCorp.
2. Velocity anómala (>3 mints/usuario/24h, ya capped en relayer).
3. Patrón de adopciones múltiples desde IPs similares con KYC distintos (smurfing).
4. Onramp grande (>$10k single tx) seguido de retiro inmediato a wallet no-CauaCorp.
5. Reportes externos (Twitter/Discord/email) marcando una wallet como bad actor.

### Acciones

- **Flag interno:** entry en `compliance_flags` table, notify compliance@cauacorp (CTO+CEO email).
- **Pause user account:** `user_profiles.kyc_status='paused_review'`, blocks future mints/redeems.
- **Pause contract si systemic:** `Pausable` global switch via multisig.
- **Voluntary disclosure:** si flag amerita, contactar Coinbase Compliance (rail MSB) y/o law enforcement vía counsel.

## Auditabilidad y transparencia

- **Public dashboards (Phase 7):** dashboards on-chain accesibles desde `/web3/transparency` mostrando wallets de tesorería, splits acumulados a Guardianes, supply $CACAO circulante, LP timelock status.
- **Annual compliance review:** cada año en aniversario de Charter, CTO+CEO publican summary de screenings, flags, y SAR-equivalent voluntary disclosures.
- **Charter audit:** cumplimiento del Charter monitoreado por terceros independientes en Phase 8+ (post-Series A si aplica).

## Multisig & key management

- **PAUSER_ROLE:** multisig Safe (Gnosis Safe en Base) 2-of-2 (CTO+CEO) en Phases 1–6, upgrade a 3-of-5 con 3 Guardianes en Phase 7.
- **MINTER_ROLE en CacaoToken:** únicamente `MazorcaRedemption.sol` (no humano puede mintear directo).
- **Oracle keys** (Edge Function relayer + IoT root poster): rotación anual, backup en cold storage encrypted (Yubikey HSM o equivalente). Nunca en repo, nunca en `.env` commits.

## Incident response

Severity matrix:
- **SEV-1** (drain de contratos, leak de oracle key, exploit activo): pause via multisig <1h, post-mortem público en 7d.
- **SEV-2** (vulnerabilidad detectada pre-explotación, KYC provider down): notify users, pause flow afectado, fix <24h.
- **SEV-3** (bug funcional sin riesgo de fondos): fix sprint normal.

Bug bounty Immunefi (Phase 7) cubre disclosures responsables. Pool inicial $5k, escalable según severity.

## Referencias regulatorias

- [FinCEN BSA E-Filing](https://bsaefiling.fincen.treas.gov)
- [OFAC Sanctions List Search](https://sanctionssearch.ofac.treas.gov)
- [OFAC Crypto Compliance FAQs](https://ofac.treasury.gov/faqs/topic/1626)
- [Texas Money Services Act](https://www.dob.texas.gov/money-services-businesses)
- [Chainalysis Address Screening API](https://docs.chainalysis.com/api/screening)
- [Persona KYC Documentation](https://docs.withpersona.com)
- [Coinbase Commerce Compliance](https://commerce.coinbase.com/legal)

## Cambios al programa

Cualquier cambio a esta política requiere:
1. PR con diff
2. Sign-off CTO+CEO
3. Update de `created_at` y version bump al inicio del archivo
4. Notify users vía email y on-site banner si afecta UX (e.g., nuevo país blocked)
