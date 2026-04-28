# CauaCorp Legal Posture — Web3

> Versión 1.0 · 2026-04-27 · Este documento es **análisis interno**, NO opinión legal externa. Una opinion letter formal de counsel especializado en US/Texas crypto law se contratará pre-Phase 7 (audit gate).

## Disclaimer

Este documento es una self-assessment para guiar decisiones de diseño. **No constituye asesoría legal.** CauaCorp procurará counsel externo licenciado (Texas Bar + EEUU federal) antes de:
- Abrir liquidez DEX para `$CACAO` (Phase 7).
- Cualquier evento de fundraising vía cripto que involucre US persons (parking lot Series A).
- Marketing público targeted a US residents (Phase 5+).

## Análisis de utility-token: $CACAO

### Test de Howey aplicado

Howey test (SEC v. W.J. Howey Co., 1946): un instrumento es security si involucra:
1. **Inversión de dinero** ✅/❌
2. **En empresa común** ✅
3. **Con expectativa de ganancia** ✅/❌
4. **Derivada principalmente del esfuerzo de otros** ✅/❌

CauaCorp aplicación a `$CACAO`:

| Prong | Análisis CauaCorp | Veredicto |
|---|---|---|
| (1) Inversión de dinero | $CACAO se gana **exclusivamente** vía gameplay (burn de mazorcas que se ganan vía care actions). No se vende, no hay presale, no hay ICO. **Reg D 506(c) no aplica porque no hay oferta.** | **NO inversión** ✅ defensible |
| (2) Empresa común | CauaCorp opera el protocolo. Hay empresa común. | **SÍ** (esperado) |
| (3) Expectativa de ganancia | Tras Phase 7, holders pueden swap $CACAO ↔ USDC en Uniswap. Existe expectativa de ganancia secundaria. | **PARCIAL — riesgo principal** |
| (4) Esfuerzo de otros | Valor de $CACAO depende de: (a) éxito del protocolo (esfuerzo CauaCorp), (b) acción del holder (gameplay individual). El **earn-only structure** mueve significativamente hacia "esfuerzo del holder mismo". | **Mitigado** ✅ |

### Conclusión interna

`$CACAO` puede ser argumentable como utility-token si:
- ✅ **Distribución 100% earned**, sin venta primaria. (Charter I.3 enforcement.)
- ✅ **Cap supply 21M** sin allocation founders/insiders fuera de gameplay.
- ✅ **Liquidez DEX seed timelocked 12 meses** (señal anti-rug, no fundraising).
- ✅ **Utility real:** redeemable por discounts en Marketplace + governance ligero post-Phase 7 (votación sobre Charter amendments).
- ⚠️ **Riesgo residual:** SEC ha clasificado como securities tokens con earn-only structures (e.g., HYDRO, REP). Cada caso es fact-specific. Counsel review pre-Phase 7 mandatorio.

### Mitigaciones de diseño

1. **Sin marketing financiero.** Materials nunca dicen "invest", "yield", "return", "appreciation". Sí dicen "earn", "redeem", "utility", "governance".
2. **Sin presale ni airdrop a insiders.** Charter I.3 enforcement.
3. **No staking que prometa rewards.** $CACAO no se "stakea" para earn más $CACAO. Solo se quema/redime.
4. **Disclosure pre-pool en `LEGAL.md`:** publicar el análisis de Howey aplicado y los argumentos pro-utility en este archivo y en Mirror.xyz post pre-Phase 7.
5. **Geographic restrictions:** US residents pueden interactuar con NFTs y gameplay; redemption de mazorcas → $CACAO requiere KYC Tier 1; trading $CACAO en Uniswap es responsabilidad del usuario (CauaCorp no opera el DEX).

## NFT árbol — análisis

NFTs ERC-721 generalmente NO se consideran securities cuando:
- ✅ Cada token es único (no fungible).
- ✅ Compra primaria = compra de un good/service identificable (un árbol específico con coords reales).
- ✅ Mercado secundario es opcional, no es la propuesta principal.
- ✅ No promesa de retorno financiero.

CauaCorp NFT árbol cumple los 4 criterios. Marketing dice "adopt your tree", no "invest in cacao yield". El gameplay añade utility (skin in the game) que refuerza la naturaleza utility/collectible vs investment.

**Riesgo bajo** para NFT árbol primario. Riesgo medio si el secondary market se vuelve principalmente especulativo — pero CauaCorp no opera el secondary; OpenSea/Zora sí.

## Texas Money Services Act

**Status:** CauaCorp NO está registrado como Money Services Business (MSB) bajo TX MSA ni FinCEN.

**Razón defendible:** CauaCorp no transmite dinero entre partes terceras. El flujo es:
1. **Adopción cripto:** usuario paga ETH/USDC/cbBTC → CauaCorp recibe (CauaCorp es el comerciante). Contract `TreeAdoption.sol` hace el split atómico (60% Guardián, 30% tesorería, 10% protocol). El usuario no transmite a un tercero a través de CauaCorp; el contrato es la transferencia atómica.
2. **Onramp fiat:** usuario paga tarjeta a Coinbase Onramp → Coinbase (MSB-licensed) entrega cripto al usuario. CauaCorp NO toca el flow fiat.
3. **Coinbase Commerce:** USDC del usuario → Coinbase → wallet CauaCorp. Coinbase es el rail.

**Conclusión interna:** CauaCorp opera como **merchant accepting crypto**, no como transmitter. Misma posición de un café en Austin que acepta BTC.

**Riesgos:**
- ⚠️ Si TreeAdoption.sol "intermedia" entre comprador y Guardián (Guardián recibe 60% del comprador), TX podría argumentar que somos un MSB intermediando entre dos terceros. Mitigación: Guardián **es trabajador/contractor de CauaCorp** (revenue share), no parte tercera. Documentar relación contractor en agreements con cada Guardián. La transacción no es User → Guardián con CauaCorp como rail; es User → CauaCorp, y CauaCorp paga al Guardián downstream.

**Counsel review pre-Phase 5** (cuando Adopt-with-crypto ships) recomendado para validar argumento.

## Reg D / Reg S analysis (parking lot Series A)

CauaCorp puede en el futuro hacer fundraising tokenizado para Series A (parking lot, NO en MVP). Si ese día llega:
- **Reg D 506(c):** general solicitation permitido si todos los buyers son verified accredited investors. Compatible con KYC Tier 3 + accreditation cert.
- **Reg S:** offshore offering, US persons excluded. Compatible con geo-block + KYC country = non-US.
- **Howey aplicado a equity-tokens será claro security** — no hay argumento utility para una Series A token. Tendría que ser registered/exempt.

**No tomar acción sobre esto hasta tener counsel.** Charter I.3 (no presale) actualmente lo prohíbe.

## ToS — Terms of Service (placeholder)

Documento `docs/TOS.md` se redactará en Phase 2 con las siguientes secciones (skeleton):
1. Acceptance of terms
2. Eligibility (18+, geo-restrictions, KYC requirement por tier)
3. Account creation y wallet linking
4. NFT árbol — natureza de propiedad y limitations
5. $CACAO token — naturaleza utility, no investment claim
6. Gameplay rules y enforcement
7. IP rights (CauaCorp branding, user-generated content)
8. Smart contract risks (immutability, bugs, gas)
9. Disclaimers (no financial advice, "as-is", no warranty)
10. Limitation of liability
11. Indemnification
12. Dispute resolution (arbitration TX, JAMS)
13. Changes to terms
14. Contact

Contract counsel para draft full antes de Phase 5 (primera adopción cripto pública).

## Privacy Policy — placeholder

Documento `docs/PRIVACY.md` se redactará en Phase 2. Skeleton:
1. Data we collect (KYC docs via Persona, wallet addresses, IP, gameplay logs)
2. How we use it
3. Sharing (Persona, Chainalysis, OFAC ingestion, Coinbase rails)
4. Storage (Supabase US-East, Persona US, Pinata global IPFS)
5. Retention (per `KYC.md`)
6. Rights (access, deletion, correction) — soft delete + 5y hard delete
7. Cookies / tracking
8. Children (no servicio para menores 18)
9. International transfers (LATAM users → US storage)
10. Contact / DPO

GDPR + CCPA + CPRA compliance baseline. Contract counsel para draft full antes de Phase 5.

## Disclosures pre-Phase 7 (LP seed)

Antes de seedlear LP en Uniswap v3, publicar en este archivo y en Mirror.xyz:

1. **Distribución $CACAO al momento del pool seed:**
   - Total minted vía gameplay durante Phases 4–6: TBD (filled in pre-launch)
   - Treasury holdings (CauaCorp wallet): X% (justificado por seed LP)
   - Founders holdings (earned only via gameplay personal): Y%
   - Holder distribution (top 10, top 100): publicar para transparencia
2. **LP timelock proof:** dirección de [`LPTimelock.sol`](../contracts/src/LPTimelock.sol) deployada con `releaseAt = launch + 12 months`; tx-hash de transferencia del LP NFT desde NPM al timelock; verificable on-chain via `LPTimelock.tokenId()`. Runbook completo en [`docs/SEED_LP.md`](SEED_LP.md).
3. **Initial price discovery:** rationale del precio inicial (basado en utility implied = beans/mazorca discount tiers en Marketplace).
4. **Counsel opinion letter:** referencia (no full text) a opinion letter de TX bar attorney specializing in crypto, fechada pre-pool.
5. **Charter on-chain signature:** SHA-256 del archivo `docs/CHARTER.md` registrado on-chain via [`CharterRegistry.sol`](../contracts/src/CharterRegistry.sol); CTO + CEO firmas verificables via `CharterRegistry.getSignature(hash, signer)`. Script: [`scripts/sign_charter_onchain.ts`](../scripts/sign_charter_onchain.ts).
6. **Audit:** Code4rena/Sherlock contest report linked. See [`docs/AUDIT.md`](AUDIT.md) for scope + remediation status.
7. **Bug bounty:** Immunefi pool live ($5k initial). See [`docs/SECURITY.md`](SECURITY.md).

Sin estas 7 disclosures completas, **el pool seed NO se ejecuta.**

## Smart contract risks (disclosure pre-mint)

Toda UI que invoke un contrato CauaCorp muestra disclosure inline:

> **Smart contract risk:** Esta acción se ejecuta en la blockchain Base. Las transacciones son irreversibles. Smart contracts pueden contener bugs no detectados. CauaCorp ha implementado [Foundry tests / audit Phase 7] pero no garantiza ausencia total de vulnerabilidades. Procede solo si comprendes los riesgos.

Texto adaptable por idioma. Confirmación checkbox required pre-mint en Phase 7+.

## Founder wallet disclosure

Charter principio I.5 (Transparencia radical). Wallets founders publicadas en este archivo y en Etherscan/BaseScan:

- **CTO (Amaury Amed):** `0x7Ca1624e534ebE18F46BBA56229981134945464e` (Ethereum mainnet, custodian: Bitso)
- **CEO (David Montoya):** `0x7E9E25cFfc8BC68Fb9E1f4708e761C68a37a846A` (Ethereum mainnet, custodian: Coinbase)

**Nota:** estas wallets son las actuales en `src/utils/constants.ts` para investor charges. Wallets de founders en Base (post-Phase 1) serán Smart Wallets nuevas, divulgadas pre-Phase 4 en este archivo y on-chain via Charter signing event.

`$CACAO` que founders ganen vía gameplay personal (their own trees) cuenta como holdings públicos divulgables. Cualquier transferencia inter-wallet de founders se publica en NOTES de tentacle web3 con razón.

## Auditoría legal recurrente

- **Pre-Phase 5 (adopción cripto pública):** counsel review TX MSA argumento + ToS/Privacy draft.
- **Pre-Phase 7 (LP seed):** counsel opinion letter sobre $CACAO utility classification + disclosures completos.
- **Anual post-launch:** charter review + regulatory landscape scan (SEC, FinCEN, OFAC, TX DOB updates).

## Referencias regulatorias y precedentes

### Marcos regulatorios
- [SEC Framework for "Investment Contract" Analysis of Digital Assets (2019)](https://www.sec.gov/files/dlt-framework.pdf)
- [FinCEN Guidance FIN-2019-G001 — virtual currencies](https://www.fincen.gov/sites/default/files/2019-05/FinCEN%20Guidance%20CVC%20FINAL%20508.pdf)
- [Texas Department of Banking — Money Services FAQs](https://www.dob.texas.gov/money-services-businesses/faqs)
- [OFAC SDN List + Crypto Compliance Guidance](https://ofac.treasury.gov/recent-actions/20211015)

### Precedentes relevantes
- **SEC v. Telegram (2020):** TON tokens classified as securities — relevant: pre-launch sale pattern (NOT applicable to $CACAO).
- **SEC v. LBRY (2022):** LBC tokens classified as securities pese a utility claims — relevant: counsel argued utility-only, court rejected. Lesson: utility framing alone insufficient if marketing/distribution suggest investment.
- **SEC v. Ripple (2023, ongoing):** programmatic sales on exchanges classified differently than direct institutional sales — relevant: secondary market activity matters.
- **No-action letters:** Pocketful of Quarters (2019), TKJ (2019) — utility tokens with restricted use cases received no-action — relevant: structure $CACAO redemption as use-only, not transferable for cash equivalence.

## Cambios a este documento

Subordinado a Charter mecanismo de enmienda (sección IV). Cambios con impact regulatorio requieren counsel review.
