# Product Requirements Document (PRD)
## CacaoFrutaBrutal — v1.1 | 2026-05-06

> **v1.1 changelog:** §7 rewritten — the Web3 layer pivot landed 2026-04-28 (5 contracts on Base Sepolia, Coinbase Onramp sandbox, Smart Wallet onboarding). §3 feature matrix and §6 roadmap extended with Web3 phases. v1.0 §7 ("Why Not Blockchain?") is obsolete and preserved only as Appendix A for historical reference.

---

## 1. Product Vision and Mission

### Mission
**We make the world fall in love with Colombian cacao by turning every act of care into a personal connection between a tree, a farmer, and a consumer.**

### Vision (5-year)
CacaoFrutaBrutal becomes the globally recognized platform for traceable, biotech-powered cacao derivatives — a community of 100,000+ users who grow, care, and invest in the Colombian cacao ecosystem, with products distributed across 5 countries and 8–10 Guardian farmers building sustainable livelihoods.

### Why This Product Exists
The world sees cacao as an input to chocolate. CacaoFrutaBrutal reframes it:
- Cacao is a living ecosystem, not a commodity
- Every cacao product has a specific tree, a specific farmer, a specific territory
- Technology — from fermentation to lyophilization to biotechnology — is not opposed to tradition; it amplifies it
- The most powerful distribution channel is a person who genuinely cares about the origin of what they consume

### Unique Value Propositions

| Layer | For whom | Value proposition |
|-------|----------|------------------|
| B2C game (CauaGotchi) | Colombian consumer, eco-minded global user | "Your care for a digital tree makes a real tree grow better" |
| B2B crowdfunding | Eco-investor, EU food industry buyer | "Invest in a specific bioprocess and receive traceable EU-ready ingredients" |
| Token bridge | Both | "The more you care, the more cacao you get" |

---

## 2. User Personas

### Persona 1: The Eco-Investor (US / EU)

**Profile**
- Age: 28–45 | Income: $60K+ | Location: San Francisco, Amsterdam, Berlin, Barcelona
- Education: college+ | Works in: tech, finance, sustainability, food industry
- Values: supply chain transparency, ESG alignment, impact investing, emerging markets

**Motivations**
- Wants financial returns that align with environmental values
- Curious about Colombian terroir and novel food ingredients
- Attracted to "traceability story" — can share the origin of what they invest in
- Comfortable with crowdfunding and direct-to-consumer investment models

**Behaviors**
- Reads impact reports and Substack food newsletters
- Follows DTC brands like Oatly, Hu Chocolate, Tony's Chocolonely
- Invests via Kickstarter, Republic, direct crowdfund campaigns
- Willing to pay 2–3× premium for provenance and quality

**Jobs to be done**
> "Show me exactly where my money goes, what it produces, and what I get in return."

**Pain points**
- Greenwashing — hard to verify claims about impact
- Lack of emerging-market investment vehicles accessible to non-accredited investors
- Opaque supply chains in the food industry

**Entry points:** `/fund` (lot investments), `/dashboard` (impact metrics), `/blog` (origin stories)

**Token behavior:** Earns mazorcas on lot investments, redeems for premium batch samples

---

### Persona 2: The Colombian Consumer

**Profile**
- Age: 20–35 | Location: Bogotá, Medellín, Cali, Barranquilla
- Digital native, Gen Z / elder millennial
- Cultural pride in Colombian products | Nostalgic for childhood games

**Motivations**
- Wants to reconnect with Colombian nature and agricultural heritage
- Nostalgic for Tamagotchi / early mobile games (Pixel Coños, Snake)
- Interested in functional drinks and wellness rituals
- Motivated by gamification, streaks, and earning rewards

**Behaviors**
- Spends 3–6 hours/day on TikTok, Instagram, WhatsApp
- Shares food and culture content natively
- Part of WhatsApp study/community groups
- Buys functional drinks (Pony Malta, Hit, Milo alternatives)
- Follows Colombian micro-influencers on food and culture

**Jobs to be done**
> "Give me a daily ritual that connects me to Colombian nature — and makes me look good sharing it."

**Pain points**
- Generic chocolate products with no story
- No local functional drink culture that feels premium
- No game that makes you feel like a responsible adult

**Entry points:** `/ritual` (daily tarot habit), `/adoptar` (tree adoption), `/marketplace` (social tonic), TikTok → Landing

**Token behavior:** Highest frequency earner (daily rituals + tree care), redeems beans for SUNRISE Social Tonic and subscriptions

---

### Persona 3: The B2B Buyer

**Profile**
- Age: 35–55 | Role: Procurement manager, R&D director, category buyer
- Industry: EU food/beverage, cosmetics, nutraceuticals, pharmaceuticals
- Location: Germany, Netherlands, France, Spain, UK

**Motivations**
- Sourcing novel food ingredients with EU Novel Food pathway
- Differentiated supply chain story for premium product lines
- Compliance with EFSA regulations and sustainability reporting (Scope 3 emissions)
- Willing to pre-fund production for guaranteed supply and cost lock-in

**Behaviors**
- Attends Food Ingredients Europe (FiE), Vitafoods, Biofach
- Reads EFSA regulation updates, Novel Food Commission decisions
- Works on 2–3 year ingredient sourcing and NPD cycles
- Requests COA (Certificate of Analysis), traceability docs, regulatory dossiers

**Jobs to be done**
> "Find traceable, certified novel ingredients with a compelling origin story for my premium product line — and get me the documentation to justify my sourcing decision to regulatory and marketing."

**Pain points**
- Commodity cacao has no differentiation story for premium consumers
- EU Novel Food approval process is complex and slow without a partner who has started it
- No standard traceability documentation from South American small-scale producers

**Entry points:** `/fund` (technology pages), `/blog` (origin stories + process explanations), B2B quote form (`/cotizacion`)

**Token behavior:** Does not participate in token economy — prefers invoice/PDF/COA documentation

---

### Persona 4: The Guardian Farmer

**Profile**
- Age: 35–65 | Location: rural Colombian territories (Huila, Arauca, Cundinamarca, Meta, Santander)
- Primary device: WhatsApp on Android | Limited internet access
- Growing Criollo Élite and Trinitario cacao for 10–30 years

**Motivations**
- Sell specialty cacao at a fair premium directly to a market that values it
- Recognition for quality work — certificates, awards, digital presence
- Stable income independent of commodity price volatility
- Connection to international buyers who understand fine-flavor cacao

**Behaviors**
- Communicates via WhatsApp voice notes and videos
- Trusts long-term relationships over contracts
- Proud of regional terroir (Huila ≠ Arauca ≠ Meta — different flavor profiles)
- Limited experience with e-commerce or investment platforms

**Jobs to be done**
> "Sell my cacao at a fair premium price to people who actually value the work I put in."

**Pain points**
- Intermediary extraction of 60–80% of value in commodity supply chain
- Price volatility tied to ICE commodity market
- Invisible on the internet — buyers cannot verify claims about quality

**Entry points:** Admin/farmer dashboard (`canVend=true` role), supply chain pages, blog authorship, WhatsApp-first onboarding

**Token behavior:** Receives COP payments for mucilage supply (byproduct of their fermentation). Limited direct token interaction. Blog posts authored by Guardians earn blog_share tokens.

---

## 3. Feature Matrix

### P0 — Launch Blockers (must ship Q1 2026)

| Feature | Domain | Current status | Owner tentacle |
|---------|--------|---------------|---------------|
| Tree adoption flow (end-to-end) | cacao-gotchi | ✅ Implemented | cacao-gotchi |
| CauaGotchi with live DB data | cacao-gotchi | ❌ Hardcoded props | cacao-gotchi |
| Daily ritual + token awards (draw) | token-economy | ✅ Implemented | token-economy |
| Fund page + Stripe/MP checkout | b2b-marketplace | ✅ Implemented | b2b-marketplace |
| Marketplace product grid | b2b-marketplace | ✅ Implemented | b2b-marketplace |
| Auth + Google OAuth + user profiles | supabase-backend | ✅ Implemented | supabase-backend |
| Admin CRM (5 tabs) | supabase-backend | ✅ Implemented | supabase-backend |
| Blog UI with static content | blog-cms | ✅ Static fallback | blog-cms |
| Blog posts seeded in DB | blog-cms | ❌ Empty DB | blog-cms |
| Migration 011 (ml_predictions_log) | supabase-backend | ❌ Not created | supabase-backend |
| ML function line-count compliance | ml-pipeline | ❌ ~30 lines | ml-pipeline |

### P0.5 — Web3 Pivot (landed 2026-04-28, polish Q2 2026)

| Feature | Domain | Current status | Owner tentacle |
|---------|--------|---------------|---------------|
| 5 contracts deployed to Base Sepolia (NFT/Token/Redemption/Adoption/IoT) | web3 | ✅ Done 2026-04-28 | web3 |
| `/web3/onboarding` 4-step flow (connect → switch → SIWE → KYC) | web3 | ✅ Implemented | web3 |
| Persona KYC webhook (3 tiers) | web3 | ✅ Edge Function ACTIVE | web3 |
| Chainalysis + OFAC screening pre-write | web3 | ✅ Wired in `siwe-link-wallet` | web3 |
| Coinbase CDP Onramp (sandbox, USD 5 preset) | web3 | ✅ Functional E2E, awaiting prod cap lift | web3 |
| Mazorca burn → $CACAO mint flow | web3 | ✅ E2E on testnet (1000:1) | web3 |
| Tree adoption with USDC/ETH/cbBTC + 60/30/10 split | web3 | ✅ Contract live; admin config pending | web3 |
| IoT Ed25519-signed readings + weekly Merkle root | web3 | ⚠️ Contract live; firmware integration in progress | web3 |
| Adoption price unified to USD 5 (CDP-aligned) | b2b-marketplace | ⚠️ Web3 path = USD 5; legacy `/adoptar` card still shows USD 3 | b2b-marketplace |

### P1 — Q2 2026: Meaningful Experience

| Feature | Domain | Why it matters |
|---------|--------|---------------|
| Tree care action buttons (Water/Sunlight/Nutrients/Prune/Molasses) | cacao-gotchi | Core game loop is broken without this |
| 3h care cooldown enforcement | cacao-gotchi | Prevents care spam, preserves habit loop |
| Stripe webhook → token award on lot purchase | b2b-marketplace | Closes the B2B→token bridge |
| Coinbase Commerce checkout (USDC) | b2b-marketplace | Enables crypto-native investors |
| Token redemption at checkout (beans → discount) | token-economy | Missing half of the token flywheel |
| streak_7 + streak_30 awards wired | token-economy | Streak rewards are defined but never fire |
| Blog Markdown renderer (body_md → HTML) | blog-cms | Raw Markdown renders as text currently |
| blog_read token award wired in BlogPost.tsx | blog-cms | Token incentive for reading is missing |
| blog_share token award in BlogPost.tsx | blog-cms | Share incentive is missing from blog |
| Realtime enable migration (012) | supabase-backend | Live balance + tree updates require this |
| Rate-limit blog_read in award-tokens | supabase-backend | Anti-abuse for high-frequency event |
| Harvest prediction endpoint (/api/harvest_predictor) | ml-pipeline | Closes tree growth story for users |
| Model persistence (model.pkl via joblib) | ml-pipeline | Eliminates cold-start retraining |
| CauaTokenChip component | design-system | Eliminates token display duplication |
| CauaProgressBar component | design-system | Eliminates progress bar duplication |

### P2 — Q3–Q4 2026: Scale

| Feature | Domain |
|---------|--------|
| Social share cards for stage transitions (TikTok format) | cacao-gotchi |
| Wire ML predictor → live tree health display | cacao-gotchi |
| Lot-tier bulk pricing (5/10/25 lots) | b2b-marketplace |
| `/cotizacion` B2B quote page with PDF | b2b-marketplace |
| EU certification status badges per tech | b2b-marketplace |
| Token tier system (Bronze/Silver/Gold) | token-economy |
| TokenLedger component (full history) | token-economy |
| Author profile pages (/author/[slug]) | blog-cms |
| OG meta tags per blog post | blog-cms |
| EN/ES blog content (body_md_en column) | blog-cms |
| pg_cron job for daily stage advancement | supabase-backend |
| Supabase Storage (tree photos + blog covers) | supabase-backend |
| Open-Meteo climate integration (5 Guardian coords) | ml-pipeline |
| Playwright E2E adoption + ritual tests | infra-devops |
| GitHub Actions CI workflow | infra-devops |
| CauaModal shared component | design-system |
| CauaBadge role indicator component | design-system |

---

## 4. User Stories

### CauaGotchi Game

- As a Colombian consumer, I want to adopt a specific cacao tree from a Guardian farmer so I feel a personal bond with the origin of my cacao.
- As a Colombian consumer, I want to see my tree's health bars change based on my daily care actions so I feel the tangible impact of my engagement.
- As a Colombian consumer, I want to receive an alert when my tree needs care after 3 hours so I build a daily habit around tending to nature.
- As a Colombian consumer, I want to see my tree visually change its sprite as it grows through 8 stages so the game feels alive and progressive.
- As a Colombian consumer, I want to know how much CO2 my tree has absorbed so I can feel good about my environmental impact.

### Ritual & Token Earning

- As a Colombian consumer, I want to draw a daily tarot card themed to cacao ecology so I have a meaningful morning ritual that connects me to the product.
- As a Colombian consumer, I want to see my ritual streak so I feel motivated to maintain my daily habit.
- As an eco-investor, I want to earn mazorcas for my lot investment so I receive loyalty rewards proportional to my financial commitment.
- As a user with a 7-day streak, I want to automatically receive a bonus token award so I feel recognized for consistency.

### B2B Crowdfunding

- As an eco-investor, I want to browse the three biotech technologies and see their EU regulatory pathway so I can evaluate the investment from a market access perspective.
- As an eco-investor, I want to purchase lots in MucilageExtract™ with USD via Stripe so I can invest easily from the US or EU without currency complexity.
- As a B2B buyer, I want to download a technical data sheet for TheobromaBrew™ so I can evaluate it for my NPD pipeline at my EU beverage company.
- As an eco-investor, I want to see a real-time funding progress bar so I know how close a production lot is to fully funded.

### Token Redemption

- As a Colombian consumer with 20 beans, I want to redeem 10 beans for $1 off at Marketplace checkout so my daily care translates to real purchasing power.
- As a power user with 200 mazorcas, I want to unlock early access to the next limited batch release so I feel recognized for long-term commitment.

### Blog

- As a Guardian farmer, I want to publish a blog post about my harvest season so international buyers can connect with my story and trust my product quality.
- As an eco-investor, I want to read a technical article about the MucilageExtract™ fermentation process so I understand the innovation I'm investing in.
- As a blog reader, I want to earn 0.2 beans for reading an article so I have a small incentive to engage with educational content.

### Admin

- As a founder, I want to view all registered users with their lead scores so I can prioritize outreach to high-intent investors.
- As a founder, I want to update a user's CauaRole to 'investor' so I can grant them the appropriate product access and discounts after an offline conversation.
- As a founder, I want to see all lot investments in a table with technology, currency, and payment provider so I can track our crowdfunding progress across payment methods.

---

## 5. Success Metrics — OKRs and KPIs

### 2026 Objectives and Key Results

**O1: Establish B2C game engagement as a daily habit driver**
- KR1: 100 tree adoptions by end of Q1 2026
- KR2: 30-day ritual streak maintained by ≥20% of registered users
- KR3: Average care actions per tree per day ≥ 2 (once migration 012 + care buttons ship)

**O2: Validate B2B crowdfunding model**
- KR1: MucilageExtract™ 150 lots funded by end of Q2 2026 (69 already achieved)
- KR2: First paid B2B pilot (Whole Foods Austin or EU ingredient buyer) by Q3 2026
- KR3: $100K+ total raised across all three technologies by Q2 2026

**O3: Build the token economy flywheel**
- KR1: Token redemption rate ≥ 15% of users with `beans_balance > 20` (after redemption ships)
- KR2: Average beans earned per active user per week ≥ 5
- KR3: Zero token award failures (100% Edge Function success rate for `award-tokens`)

**O4: Seed round readiness**
- KR1: $750K–$1.5M seed round closed Q4 2026
- KR2: 3+ Guardian farmers with active digital twin integrations and IoT sensor data
- KR3: Verifiable $500K revenue pipeline documented for 2027

### Weekly KPI Dashboard

| KPI | Target | Source |
|-----|--------|--------|
| MAU (Monthly Active Users) | 500 by Q2 | `user_profiles.last_seen_at` |
| DAU/MAU ratio | ≥ 25% | `user_rituals.last_draw_date` |
| Lots funded per week | 10+ | `lot_investments` insert rate |
| Ritual draw count per day | ≥ 1.5/user/day | `user_rituals` |
| Average beans balance | ≥ 15 | `user_profiles.beans_balance` |
| Token redemption rate | ≥ 15% (after ship) | `token_events.event_type = 'redeem'` |
| Stripe checkout completion | ≥ 75% | Stripe Dashboard |
| Tree adoption rate | ≥ 30% of registered users | `cacao_trees` / `user_profiles` count |
| Blog post reads | ≥ 200/week | `email_log.event_type = 'blog_read'` |

---

## 6. Product Roadmap

### Q1 2026 — MVP + Validation (Current)
**Goal:** 100 pre-orders, BFFood VIII submission, MVP live

Deliverables:
- All P0 items live (see Feature Matrix)
- CauaGotchi wired to live DB data
- Blog seeded with 5 Guardian stories
- Migration 011 applied (ml_predictions_log)
- Python ML function compliance (≤20 lines)

### Q2 2026 — Production + Engagement
**Goal:** 600L Sunrise Shot first batch, CAUA Labs opens, 5 active Guardians, token flywheel, Web3 polish

Deliverables:
- Care action buttons live in TreeDetail.tsx
- Token redemption at Marketplace checkout
- Stripe webhook → token award automation
- Coinbase Commerce checkout (USDC)
- streak_7 + streak_30 awards firing
- Blog Markdown renderer + token awards wired
- Realtime enabled (migration 012)
- Harvest prediction ML endpoint
- **Web3:** unify adoption price to USD 5 across `/adoptar` + `/web3`, finish CDP production cap lift (Loom + Support Hub reply), wire ERC-4906 emit on every care action, complete admin config calls on `TreeAdoption` (`setGuardianWallet`, `setAssetEnabled`, `setPrice`)
- **Audit prep:** provision read-only access for Universidad Distrital (GitHub Read + Vercel Viewer + Supabase Read-only + optional Postgres `auditor_unidistrital` role), with NDA

### Q3 2026 — Scale + B2B + Mainnet
**Goal:** Whole Foods Austin pitch, CAUA Inc registration, organic certification track, Base mainnet deploy

Deliverables:
- ML wired to real IoT sensor data (Guardian farms)
- Token tier system (Bronze/Silver/Gold)
- Lot-tier bulk pricing (5/10/25 lot bundles)
- B2B quote system (/cotizacion) with PDF
- Author profile pages (/author/[slug])
- OG meta tags for blog posts
- Playwright E2E test suite
- GitHub Actions CI workflow
- **Web3 mainnet:** external audit closed (Spearbit / Trail of Bits), Safe 2-of-2 multisig live, fresh wallets generated offline, redeploy 5 contracts to Base mainnet (chain 8453), flip `ACTIVE_CHAIN_ID`, post-deploy smoke test

### Q4 2026 — Seed Round
**Goal:** $750K–$1.5M raise, core team 3+, EU certifications

Deliverables:
- Full investor dashboard (lot status, production timeline, COA preview)
- EU certification status pages per technology
- Multi-language blog (EN/ES body_md_en)
- Supabase Storage for tree photos + blog covers
- 8–10 Guardian onboarding pipeline

### 2027+
- $500K revenue, EU distribution, IP licenses, 5 countries
- Mobile app (React Native) for Guardian farmer dashboard (WhatsApp-first onboarding)
- Governance token exploration (only if community voting becomes a product feature)

---

## 7. Token Economy Design Rationale

### Why Two Tokens?

**Beans** (high-frequency, fractional decimals):
- Earned in small amounts through daily engagement — ritual draws (+0.5), blog reads (+0.2), care actions (+0.5)
- High earning frequency drives daily app opens and habit formation
- Low individual value ensures earning feels rewarding without being exploitable

**Mazorcas** (milestone-based, whole integers):
- Earned only at significant moments — tree adoption (+3), lot investment (+2), 7-day streak (+1), referral (+3)
- Scarcity creates perceived value and motivates goal completion
- The rarity creates a "achievement unlocked" emotional response

The contrast between the two tokens creates a layered engagement model: beans for daily micro-habits, mazorcas for major life moments in the app.

### Earning Event Design Principles

1. **Every product layer has at least one earning event** — cacao-gotchi (care + adoption), ritual (draw + streak), blog (read + share), marketplace (purchase), B2B (lot investment), social (referral). This drives cross-surface engagement.

2. **Earning asymmetry is by design:**
   - Lot investment: +5 beans +2 mazorcas per lot
   - Ritual draw: +0.5 beans
   - Ratio: 10× more rewarding to invest than to draw once
   - This is intentional — financial commitment deserves more recognition than casual engagement

3. **Social actions earn beans, not mazorcas:**
   - Blog share (+1 bean), referral (+10 beans), social tonic purchase (+2 beans/USD)
   - Social earning drives viral growth without inflating the milestone token

### Redemption Design

**Beans → product discounts** (simple, immediate, tangible):
- 10 beans = $1 off at Marketplace checkout
- Redeemable on any product (not just the most expensive)
- Encourage first purchase from users who haven't bought yet

**Mazorcas → gated access** (exclusive, aspirational):
- Early batch access for new products
- Limited edition product unlocks
- Future: Guardian farm visit tickets, masterclass access

**Key principle: tokens are a loyalty bonus, not a paywall.** Every product must be purchasable at full price without tokens. Tokens reward loyal users — they don't exclude newcomers.

### Web3 Layer — live status (2026-05-06)

The "Why Not Blockchain?" rationale of v1.0 was correct **until** the project found a Web3-native audience for the impact-investment side and a regulatory path that does not classify the utility token as a financial instrument. The pivot landed on 2026-04-28 with five contracts deployed to Base Sepolia. The off-chain `beans` + `mazorcas` ledger described above is unchanged — the on-chain layer **complements** it, it does not replace it.

**What lives off-chain (unchanged):**
- `beans` — daily-engagement currency, Supabase `user_profiles.beans_balance` + `token_events` ledger
- `mazorcas` — milestone currency, same ledger
- All earning rules and redemption-for-product-discounts

**What lives on-chain (Charter §I.3 — distribution 100 % earned, no presale, no ICO):**

| Contract | Base Sepolia address | Role |
|---|---|---|
| `CacaoTreeNFT` (ERC-721) | `0xf5f2dE2237334680fC74cFD1dbCFaF5E5285ad23` | Adopted tree as NFT, ERC-4906 metadata updates per care action |
| `CacaoToken` ($CACAO, ERC-20, cap 21 M) | `0x8f5f9d696F8004b7d77c915c70569eec3234D7E1` | Utility token, mintable **only** by `MazorcaRedemption` |
| `MazorcaRedemption` | `0x9Aa80f33067316De88757ff8c21660f5672644e6` | EIP-712 signed mazorca burn → mint $CACAO at 1000:1, 30-day cooldown |
| `TreeAdoption` | `0x1c6724cdfe8906ae5a2042c431169b6987755711` | USDC/ETH/cbBTC escrow, 60/30/10 split (cooperative/treasury/protocol) |
| `IoTAttestation` | `0x0077649ed45ce82225b3a3d5a364a4f804007e53` | Weekly Merkle root of Ed25519-signed sensor readings from Guardian farms |

**The bridge is the burn:** the only path from off-chain mazorcas to on-chain $CACAO is the `MazorcaRedemption` burn. There is no other minter — gameplay is the only emission curve.

**Onboarding addition:** users now have a `/web3/onboarding` route — Connect Smart Wallet (passkey) → switch to Base → SIWE sign (triggers Chainalysis + OFAC screening) → KYC via Persona (Tier 1/2/3). All five gates fire **before** any on-chain write.

**Onramp:** Coinbase CDP sandbox is live. Adoption price aligned to USD 5 USDC to fit the sandbox per-tx cap (USD 5 × 25 tx). Production cap lift pending CDP support reply.

**Mainnet (chain 8453) is deliberately not deployed yet.** Gates: external audit (Spearbit / Trail of Bits), Safe 2-of-2 multisig migration of `DEFAULT_ADMIN_ROLE`, fresh wallets generated in HW/offline machines, 12-month timelock on any LP. See `docs/CHARTER.md` §I and `docs/WEB3.md` for the full spec.

**Why this does not contradict the v1.0 rationale:**
- Audience: the Web3 surface targets the **Cryptobro Austin TX / impact-investor** persona, not the Colombian Gen Z user. The Gen Z user keeps the off-chain beans/ritual flow as before.
- Regulatory: $CACAO is a utility token redeemable for protocol services, **not for cash**. Colombian Decree 1048/2021 and EU MiCA compatibility are addressed in `docs/COMPLIANCE.md`. Gameplay-only emission + KYC-gated mint avoids financial-instrument classification.
- Purpose: provenance attestation (IoT Merkle roots) and traceable adoption (NFT per tree) are now part of the value proposition for B2B buyers — see Persona 3 evolution in §2.

---

## Appendix A — v1.0 §7 historical rationale

Preserved for context. **No longer authoritative — superseded by §7 above.**

> Three reasons for not adding blockchain in v1.0: (1) audience not crypto-native, (2) regulatory complexity in Colombia/EU, (3) purpose served by a database ledger. Revisit only if community governance or cross-platform portability becomes strategic.

The pivot revisited (1) and (3) once the Eco-Investor persona showed clear crypto-native preference for impact provenance, and (2) once Charter §I.3 (100% earned, no presale) enabled a utility-token classification.
