# CauaCorp Web3 Charter — The Cacao Covenant

> Versión 1.0 · 2026-04-27 · Ratificable on-chain (Base mainnet) en el lanzamiento del Phase 7.

CauaCorp construye en Web3 porque la cadena de valor del cacao colombiano lleva 200 años extrayendo riqueza de los Guardianes de la tierra y entregándola a intermediarios opacos. Las finanzas descentralizadas, los NFTs y los ledgers públicos son las primeras herramientas en la historia que permiten a un cultivador en Huila demostrar la procedencia de su árbol, recibir el pago directo de un comprador en Austin, y conservar parte de la valorización del activo digital que representa su trabajo.

Esta carta es el contrato moral que precede al contrato de código. Todo lo que sigue —contratos inteligentes, ERC-20, ERC-721, oráculos IoT— está subordinado a estos principios. Si un deliverable técnico contradice esta carta, el deliverable cede.

## I — Principios irrenunciables

1. **Soberanía del Guardián.** El humano que cultiva la tierra es el origen del valor. Toda revenue split por adopción de árbol asigna ≥60% al Guardián vinculado al árbol, antes de cualquier otra distribución, y se paga en el mismo bloque que la transacción de adopción. No hay "tesorería primero".

2. **Propiedad real, no metáfora.** "Adoptar un árbol" significa recibir un NFT ERC-721 transferible cuya metadata referencia coordenadas GPS reales, una variedad genética verificada, y un Guardián identificable. No vendemos abstracciones poéticas; vendemos un certificado on-chain con un árbol físico detrás.

3. **Distribución 100% earned.** El token `$CACAO` no se vende. No hay presale, ICO, IDO, ni airdrop a insiders. Cada `$CACAO` en circulación viene del burn de mazorcas ganadas vía gameplay, atestación IoT, o cuidado verificado de un árbol. Los founders reciben `$CACAO` por la misma vía que cualquier usuario.

4. **No-rug por diseño.** La liquidez seed que CauaCorp aporte a Uniswap v3 al cierre de Phase 7 estará bloqueada por timelock 12 meses on-chain, con el contrato verificado en BaseScan y el tx-hash referenciado públicamente en este repositorio. Si CauaCorp quiere retirar liquidez, debe esperar el timelock o no hacerlo.

5. **Transparencia radical.** El estado del tesoro, los wallets de los founders, las direcciones de los Guardianes, los splits de cada adopción y las atestaciones IoT son públicos on-chain. El código de los contratos es open source bajo MIT. Las decisiones que afectan a los Guardianes se publican en `docs/CHARTER.md` con changelog firmado.

6. **Respeto al cumplimiento, no al teatro.** KYC, AML/CFT, geo-blocking de jurisdicciones sancionadas, y screening OFAC se aplican a TODOS los participantes, incluyendo founders, antes del primer mint. La descentralización no es excusa para facilitar lavado de activos ni financiación del terrorismo. Si un usuario aparece en SDN o si una wallet es flagged por Chainalysis, se rechaza el mint o el redemption sin excepciones.

7. **Datos del cultivador son del cultivador.** La telemetría IoT que captura un sensor en la finca de un Guardián se firma con la llave Ed25519 de su dispositivo. El Guardián puede revocar la llave en cualquier momento. Las predicciones ML se calculan sobre `anon_token` (SHA-256 del par `user_id+tree_id+PRIVACY_SALT`); ningún log de ML retiene PII.

8. **Cero custodia de claves de usuario.** CauaCorp no posee, no respalda, ni puede recuperar la llave privada de ningún usuario. Coinbase Smart Wallet (passkey) y RainbowKit son opciones de UX, no de custodia. Si un usuario pierde su wallet, perdió sus activos. Lo decimos antes del onboarding y lo repetimos después.

## II — Sostenibilidad y propósito

CauaCorp existe para que el cacao colombiano fino-de-aroma deje de ser una commodity invisible. La medida de éxito no es el market cap de `$CACAO` ni el floor price de los NFT. Las métricas internas son:

- **Ingreso anual promedio del Guardián vinculado al protocolo** (objetivo: 3× el ingreso pre-protocolo en 36 meses).
- **% de árboles adoptados con atestación IoT activa** (objetivo: 80% en 24 meses).
- **% de revenue de adopción/secundario que llega al Guardián originario** (objetivo: 60% mínimo, 70% promedio).
- **Hectáreas regeneradas vs hectáreas deforestadas en zonas vinculadas** (objetivo: regeneración neta positiva).

Si el protocolo crece pero estas métricas no, la carta se ha violado y debe reformarse antes que continuar.

## III — Compromiso con Austin TX y la diáspora cripto

La elección de Austin como punto de entrada al ecosistema Web3 global no es marketing — es geografía estratégica. Austin tiene la mayor concentración de cripto-builders éticos en EEUU, una cultura de regenerative finance (ReFi), y una proximidad cultural a Latinoamérica que permite mover valor sin fricciones de identidad. CauaCorp se compromete a:

- Hacer su primer launch público (Phase 7) presencialmente en Austin con la comunidad ReFi local.
- Aceptar feedback público de la comunidad Austin sobre los splits, la tokenómica, y la carta antes del seed LP.
- Mantener documentación, ToS, y sitio `/web3` en inglés-primero, español-equivalente, sin tratar al cryptobro como turista lingüístico.

## IV — Mecanismo de enmienda

Esta carta puede modificarse, pero solo con:

1. PR público al repo con la diff propuesta.
2. Período mínimo de 14 días para feedback de Guardianes y holders de `$CACAO`.
3. Sign-off explícito de CTO + CEO + al menos 1 Guardián.
4. Anuncio del cambio firmado on-chain por la wallet del tesoro.

Cambios que afectan los principios I.1 (soberanía Guardián), I.3 (distribución 100% earned), o I.4 (no-rug) requieren además quórum on-chain de holders que representen ≥30% del `$CACAO` circulante post-Phase 7.

## V — Firmantes fundadores

- **CTO:** Amaury Amed — wallet `0x7Ca1624e534ebE18F46BBA56229981134945464e`
- **CEO:** David Montoya — wallet `0x7E9E25cFfc8BC68Fb9E1f4708e761C68a37a846A`
- **Guardianes (Phase 7):** Lucho (Huila), Marta (Arauca), Rafael (Cundinamarca), Fernando (Meta), Ricardo (Santander) — wallets a generar via Smart Wallet onboarding.

La firma on-chain de esta carta —vía un EIP-712 typed-data signing posteado en una transacción a Base con el SHA-256 de este archivo en la calldata— ocurre como último deliverable del Phase 7 antes del seed LP.

> *"El cacao es la moneda original de los pueblos que lo cultivaron. Esta carta promete devolvérselos."*
