# Software Requirements Specification (SRS)
## CacaoFrutaBrutal — v2.0 | 2026-04-18 | Status: Living Document

> ⚠️ **CORRECTION FROM SRS v1 (2026-04-13):** The previous SRS incorrectly referenced Next.js App Router, Server Components, and ISR. **This project uses React 19 + Vite + React Router DOM v7.** It is a pure client-side SPA with a static build deployed to Vercel. There are no Server Components, no App Router, no ISR, and no Next.js of any kind. All agents must treat this correction as authoritative.

---

## 1. Vision and Business Strategy

### 1.1 Mission
CacaoFrutaBrutal connects Colombian Cacao Criollo to the world in the most personal way possible — redefining cacao as more than chocolate. Every product, every feature, and every interaction is designed to turn the act of consuming cacao into a personal relationship with a Colombian farmer, a living tree, and a regenerative ecosystem.

### 1.2 The Colombian Cacao Narrative
Colombian Criollo Élite cacao is in the top 1% of world cacao production. It is a rare, fine-flavor variety grown in five distinct territories — Huila, Arauca, Cundinamarca, Meta, and Santander — by artisan Guardian farmers who have cultivated their land for generations. Fernando of Meta/Lejanías won Medalla de Oro 2024 at the Salón del Cacao y Chocolate in Bogotá.

The product line ranges from premium cacao-derived beverages to cutting-edge biotechnology outputs:
- **MucilageExtract™** — Lyophilized cacao mucilage, pending EU Novel Food Regulation 2015/2283
- **HydroSol™** — Steam-distilled cacao flower hydrosol, targeting EFSA Botanical List
- **TheobromaBrew™** — Cold-fermented cacao tonic, targeting EFSA Novel Food Authorization

### 1.3 Three-Layer Business Model

#### Layer 1: B2C Game (Adopt-a-Tree)
Users adopt a real Colombian cacao tree from one of 5 Guardians via a Tamagotchi-style digital twin (CauaGotchi). The game uses a habit-tracker framework — care for your tree through daily actions (watering, pruning, sunlight exposure) that translate into real regenerative impact. An 8-stage growth cycle over 5 days mirrors the full cacao lifecycle, from seed to maduración.

The nostalgia mechanic: caring for a digital tree taps into the childhood memory of nurturing a living thing. The game is not trivial — it connects to a real tree, a real farmer, real CO2 sequestration data, and real harvests.

#### Layer 2: B2B Marketplace
Three biotech processes are crowdfunded via lot investments from eco-investors and B2B buyers globally. Each process transforms the raw mucilage byproduct of cacao fermentation into novel ingredients for the EU food, cosmetics, and nutraceutical industries. Business buyers who fund lots receive production batches and traceability certificates.

The blog, pitch decks, supply chain content, and technology pages serve this layer — they increase perceived value for enterprise buyers and justify premium pricing for B2B ingredient supply (IaaS model).

#### Layer 3: Token Bridge
Beans and mazorcas earned through care actions (Layer 1) are redeemable for cacao derivatives in the Marketplace (Layer 2). This creates a loyalty flywheel: daily engagement in the game creates purchasing power for premium products. The more you care for your tree, the more cacao you get.

**The flywheel:** Care → Tokens → Products → Discover → Care more.

### 1.4 Revenue Model
| Stream | Unit Economics | Phase |
|--------|---------------|-------|
| Subscription (Círculo Sumapaz) | $45/month | P2 |
| Lot investments | $150–$250/lot, role-discounted | Active |
| Marketplace preorders | $6–$85/unit | P1 |
| B2B ingredient sales (IaaS) | Batch pricing per kg | Q3 2026 |
| Auctions | Variable (multiplier system) | P1 |

### 1.5 Growth Targets
- Q1 2026: 100 pre-orders, BFFood VIII submission
- Q2 2026: 600L Sunrise Shot batch, CAUA Labs opens, 5 active Guardians in DB
- Q3 2026: Whole Foods Austin pitch, CAUA Inc registration, organic certification track
- Q4 2026: $750K–$1.5M seed round
- 2027: $500K revenue, 8–10 Guardians, EU distribution
- 2028–29: $1M+ revenue, IP licenses, 5 countries

---

## 2. Technology Stack

### 2.1 Frontend (React 19 + Vite SPA)
- **Framework:** React 19 with functional components and hooks
- **Build tool:** Vite 8 (outputs static build to `dist/`)
- **Language:** TypeScript 6 (strict mode)
- **Routing:** React Router DOM v7 — client-side SPA routing via `BrowserRouter`
- **Styling:** TailwindCSS v4 (utilities) + inline style objects referencing `BRAND` constants (primary for colors)
- **Animation:** Framer Motion (CauaGotchi only) + CSS keyframes in `App.css`
- **Deploy:** Vercel static deployment with SPA rewrites (`"source": "/(.*)" → "/index.html"`)

**What this is NOT:**
- Not Next.js (no App Router, no Server Components, no ISR, no `use server`)
- Not SSR/SSG (pure client-side rendering)
- Not Feature-Sliced Design (FSD) — uses `src/pages/` + `src/components/{domain}/` structure

### 2.2 Backend (Supabase)
- **Database:** PostgreSQL via Supabase (hosted)
- **Auth:** Supabase Auth (Google OAuth only)
- **Edge Functions:** Deno (TypeScript) at `supabase/functions/`
- **Realtime:** Supabase Realtime (to be enabled for `token_events` + `cacao_trees`)
- **Storage:** Supabase Storage (planned for tree photos + blog covers)
- **RLS:** Enabled on all user-data tables. Cacheable form: `(select auth.uid())`.

### 2.3 ML Microservice (Python)
- **Framework:** FastAPI
- **Libraries:** scikit-learn (GradientBoosting), pandas, numpy, joblib, supabase-py
- **Deployment:** Vercel Python serverless (`api/` directory)
- **Auth:** `X-ML-Secret` header with `CACAO_ML_SECRET` env var
- **Privacy:** SHA-256 pseudonymization before model inference
- **Constraint:** Every Python function ≤ 20 lines (CauaCore §8)

### 2.4 Payments
| Provider | Currency | Method | Secret location |
|----------|----------|--------|----------------|
| Stripe | USD, EUR | Checkout Sessions | Edge Function |
| MercadoPago | COP | Preferences + redirect | Edge Function |
| Coinbase Commerce | USDC | Charges (planned) | Edge Function |

### 2.5 Integrations
- **HubSpot:** Lead forms, contact properties (ritual_streak, orders, region), page tracking
- **Resend:** Transactional emails (order confirmation, catacion notification)
- **Open-Meteo:** Climate data for 5 Guardian coordinates (planned P2)
- **Vercel Speed Insights:** Already installed (`@vercel/speed-insights`)

### 2.6 Multi-Agent Orchestration (Octogent)
This project uses Octogent — a multi-agent orchestration framework — to coordinate development across 8 scoped domains. Each domain has a tentacle at `.octogent/tentacles/<id>/` containing CONTEXT.md, todo.md, and NOTES.md. All agents must read the relevant tentacle CONTEXT.md before beginning any task.

Tentacles: `cacao-gotchi`, `b2b-marketplace`, `token-economy`, `blog-cms`, `supabase-backend`, `ml-pipeline`, `design-system`, `infra-devops`.

---

## 3. Feature Specifications

### 3.1 CauaGotchi Digital Twin — B2C Game Layer
**Status:** Partially implemented. UI renders but care actions are not wired.

- Retro GameBoy-style display with pixel art emoji sprites per growth stage
- 8 growth stages: Siembra → Germinación → Plántula → Crecimiento → Desarrollo → Floración → Formación → Maduración
- 3 vital stats: Health (HP), Moisture (H₂O), Sunlight (SUN) — each 0–100%
- Care actions: Water (+20 moisture), Sunlight exposure (+25 sunlight), Nutrients (+25 health), Pruning (+20 sunlight +15 health), Molasses (+30 health, cures plague/fungus)
- Care cooldown: 3 hours between any care action
- Problem events: Plague (health < 30% + no care 6h), Fungus (moisture > 90%), Drought (moisture < 10%)
- CO2 sequestration tracking: +0.02 kg per care action, displayed on tree card
- Stage advancement: time-based via `getStageByDays()` — 5-day adoption window maps to 8 stages
- Token awards: adoption (+10 beans +3 mazorcas), care/update read (+0.5 beans), harvest (+5 beans +2 mazorcas)

**Critical P0 gap:** CauaGotchi in Dashboard receives hardcoded props (health=85, moisture=60, sunlight=90). Must be wired to live `cacao_trees` row data.

### 3.2 Tree Adoption
**Status:** Fully implemented.

- 5 Guardian farmer profiles selectable via swipeable card carousel (`SwipeableTreeCard.tsx`)
- Each Guardian: name, region, town, variety, territory story, market uses, pods description
- Adoption creates a row in `cacao_trees` table and triggers token award
- `useCocoaTrees` hook fetches user's trees from Supabase

### 3.3 Daily Ritual — Habit Tracker
**Status:** Fully implemented.

- 22 custom cacao-themed tarot cards (La Semilla, El Cacaotier, La Guardiana, etc.)
- 4 elemental groups: Tierra / Fuego / Agua / Aire
- Daily draw: +0.5 beans per draw. Streak bonuses: 7-day (+3.5b +1m), 30-day (+15b +5m)
- Share action: +1 bean, calls HubSpot tracking
- Streak display in NavBar, ritual history in `user_rituals` table
- i18n: full ES/EN via `LangContext`

**Gap:** Streak_7 and streak_30 milestone awards not triggered in code.

### 3.4 B2B Crowdfunding — Lot Investments
**Status:** Mostly implemented. Coinbase + webhook token award pending.

- 3 fundable technologies (MucilageExtract™, HydroSol™, TheobromaBrew™)
- Lot-based investment: $150–$250/lot with role-based discounts (investor 50%, nativo 25%, creyente 15%)
- Multi-currency checkout: Stripe (USD/EUR), MercadoPago (COP), Coinbase Commerce (USDC — planned)
- Real-time funding progress via `technologies.lots_funded / lots_total`
- Supply chain narrative: Guardians → MucilageExtract → HydroSol/TheobromaBrew → EU IaaS buyers
- EU regulatory targets documented per technology

### 3.5 Marketplace — Products
**Status:** UI implemented. Token redemption and individual checkout not wired.

- 8 products: preorder, auction (with countdown timer), subscription types
- Multiplier system: loyalty (prev lots) + referral bonuses, capped at 3×
- Auction bids tracked in `bids` table with `multiplier` field
- Token redemption for product discounts: **not yet implemented** (P1)

### 3.6 Token Economy — Dual-Token System
**Status:** Earning implemented. Redemption not implemented.

- Beans (fractional, high-frequency) + Mazorcas (integer, milestone-based)
- 12 earning event types, rates in `TOKEN_RATES` constant
- All mutations via `award-tokens` Edge Function (single source of truth)
- `beans_lifetime` tracks cumulative earnings for tier calculation (never decremented)
- `token_events` immutable ledger for audit trail
- Redemption path (beans → discounts, mazorcas → gated access): **not yet implemented** (P1)

### 3.7 Blog / CMS
**Status:** UI implemented. No content in DB. Token awards not wired. Markdown not rendered.

- Public read (no auth), authored by farmer/founder roles
- Tag-filtered grid, hero section, individual post pages
- Token rewards: +0.2 beans (read, once/day), +1 bean (share)
- Cross-sell CTAs: `linked_tech` deep-link to Fund page, `linked_product_ids` product cards
- **Critical P0 gap:** No blog posts seeded. DB returns empty array.

### 3.8 Admin CRM
**Status:** Fully implemented.

- 5 management tabs: Users, Investments, Orders, Emails, Trees
- User panel: edit role, region, lead_score (1–5 mazorcas), name
- Investment overview: technology + lot count + currency + payment provider
- Email log viewer: tracking of transactional email success/failure
- Access guard: `amauryamed@gmail.com` + `amaury@cauaculture.co` OR `caua_role = 'founder'`

---

## 4. Data Model

### Core Tables

**`user_profiles`** — Aggregate user row (single fetch per session)
```
user_id uuid PK FK → auth.users
email text
full_name text
avatar_url text
locale text (es|en)
region text (EU|US|CO|OTHER)
caua_role text (investor|founder|creyente|nativo|farmer)
hubspot_contact_id text
referral_code text UNIQUE
referral_count int
completed_orders int
ritual_streak int
beans_balance numeric
mazorcas_balance int
beans_lifetime numeric (never decremented)
lead_score int (1-5)
last_seen_at timestamptz
created_at timestamptz
```

**`cacao_trees`** — Adopted trees (owned by users)
```
id uuid PK
user_id uuid FK
guardian_id int (0-4, index into GUARDIANS array)
guardian_name text
region text
variety text
stage text
adopted_at timestamptz
predicted_harvest_at timestamptz
co2_kg numeric
health int (0-100)
moisture int (0-100)
sunlight int (0-100)
last_update_at timestamptz
```

**`tree_updates`** — Climate + prediction data (written by ML service)
```
id uuid PK
tree_id uuid FK → cacao_trees
climate jsonb
stage_change text
harvest_prediction date
co2_update numeric
created_at timestamptz
```

**`technologies`** — 3 seeded biotech investment opportunities
```
id uuid PK
slug text UNIQUE
name text
tagline text
category text
lot_price_usd_cents int
lot_price_cop int
lots_total int
lots_funded int (auto-incremented by trigger)
raised_usd_cents int (auto-incremented by trigger)
goal_usd_cents int
process_steps jsonb
eu_approval_target text
```

**`lot_investments`** — User investment records
```
id uuid PK
user_id uuid FK
technology_id uuid FK
order_id uuid FK
lots_count int
amount_usd_cents int
amount_cop int
currency text
caua_role text
created_at timestamptz
```

**`token_events`** — Immutable token ledger
```
id uuid PK
user_id uuid FK
event_type text (12 event types)
beans numeric
mazorcas int
ref_id uuid (optional — tree/order/post reference)
created_at timestamptz
```

**`blog_posts`** — Content posts
```
id uuid PK
slug text UNIQUE
title text, subtitle text
author_name text, author_role text (founder|farmer|nativo)
body_md text (Markdown)
cover_emoji text
tags text[]
linked_tech text (optional — technology slug)
linked_product_ids uuid[] (optional — marketplace products)
published boolean
published_at timestamptz
reading_time_min int
```

**Other tables:** `products`, `orders`, `bids`, `mvps`, `user_rituals`, `user_referrals`, `cookie_consents`, `email_log`, `catacion_leads`, `cotizaciones_b2b`, `ml_predictions_log` (pending migration 011)

### RLS Policy Patterns
```sql
-- Standard user-isolation policy (cacheable form):
CREATE POLICY "users_own_data" ON cacao_trees
  FOR ALL USING (user_id = (SELECT auth.uid()));

-- Required btree indexes on all RLS-filtered columns:
CREATE INDEX ON cacao_trees (user_id);
CREATE INDEX ON token_events (user_id);
CREATE INDEX ON lot_investments (user_id);
```

---

## 5. Security Requirements

### Non-Negotiable Rules (CauaCore §8)
1. Backgrounds: hex values only — never CSS custom properties (`var(--xxx)`)
2. Python functions: max 20 lines each
3. Never pastel gradients — brutalist luxury only
4. Never localStorage — use Supabase Auth + React context
5. Never commit `.env` files — use `.env.local` (gitignored)
6. Stripe secret key: Edge Functions only, never in `src/`
7. Supabase service_role key: Edge Functions + Python ML only, never in `src/`

### Backend Security
- RLS enabled on all tables. No table publicly writable.
- JWT verification in `award-tokens` Edge Function via `JWT_SECRET`
- Stripe webhook: signature verification via `stripe.webhooks.constructEvent`
- CORS: configured via `cors-config.ts`, applied to all Edge Functions
- Security headers: CSP, X-Frame-Options, X-Content-Type-Options (via `_headers` + vite config)
- Pre-commit hook: blocks `console.log` in `src/` production code

### Privacy (ML Pipeline)
- User PII (user_id, tree_id) pseudonymized via SHA-256 hash + salt before model inference
- Only `anon_token` stored in `ml_predictions_log`
- `PRIVACY_SALT` environment variable required for ML service

### GDPR/CCPA
- `cookie_consents` table tracks user consent
- `CookieBanner` component captures consent before analytics load
- Google OAuth only — no password storage

---

## 6. API Reference

### Edge Functions (Supabase Deno)

**`POST /functions/v1/award-tokens`**
- Auth: Supabase JWT (user session)
- Body: `{ event_type: string, ref_id?: string }`
- Response: `{ success: boolean, new_beans_balance: number, new_mazorcas_balance: number }`
- Side effects: inserts `token_events` row, updates `user_profiles` balances atomically

**`POST /functions/v1/create-stripe-checkout`**
- Auth: Supabase JWT
- Body: `{ technology_id: string, lots_count: number, role: string, currency: 'usd'|'eur' }`
- Response: `{ sessionId: string, url: string }`
- Secret: `STRIPE_SECRET_KEY` (Edge Function env only)

**`POST /functions/v1/create-mp-preference`**
- Auth: Supabase JWT
- Body: `{ technology_id: string, lots_count: number, role: string }`
- Response: `{ preferenceId: string, redirectUrl: string }`
- Secret: `MERCADOPAGO_ACCESS_TOKEN` (Edge Function env only)

**`POST /functions/v1/stripe-webhook`**
- Auth: Stripe webhook signature (`STRIPE_WEBHOOK_SECRET`)
- Handles: `checkout.session.completed` → updates order status → awards tokens

**`POST /functions/v1/send-order-email`**
- Auth: Internal (service_role)
- Body: `{ order_id: string, user_email: string, technology_name: string }`
- Uses Resend API (`RESEND_API_KEY`)

**`POST /functions/v1/notify-catacion-lead`**
- Body: `{ name: string, email: string, region: string, date: string }`
- Notifies team of tasting event lead, syncs to HubSpot

### ML Microservice (FastAPI / Vercel Python)

**`POST /api/ml_predictor`**
- Auth: `X-ML-Secret: {CACAO_ML_SECRET}` header
- Body: `{ user_id: string, tree_id: string, temp_c: float, soil_moisture: float, sunlight_lux: float }`
- Response: `{ anon_token: string, predicted_health: float, stress_alert: boolean, timestamp: string }`
- Side effect: writes to `ml_predictions_log` (when migration 011 is applied)

---

## 7. Acceptance Tests

All tests use Given / When / Then format.

**AC-01 — Tree Adoption Flow**
Given an authenticated user with no trees.
When they navigate to `/adoptar`, select Guardian "Lucho/Huila", and confirm adoption.
Then a `cacao_trees` row is created with `guardian_id=0`, `stage='siembra'`, and `user_id=currentUser.id`.
And `award-tokens` fires with `{ event_type: 'tree_adoption', beans: 10, mazorcas: 3 }`.
And the user's `beans_balance` increases by 10 and `mazorcas_balance` by 3.

**AC-02 — Tree Care Cooldown**
Given a user who last cared for their tree 1 hour ago.
When they attempt a care action (Water/Sunlight/Nutrients).
Then the care action is blocked and a countdown shows "X hours Y minutes until next care".
When 3+ hours have passed since last care.
Then the care action buttons are enabled and clicking updates `cacao_trees.last_update_at`.

**AC-03 — Ritual Streak Milestone**
Given a user with `ritual_streak = 6` who draws their 7th consecutive daily card.
When the draw is confirmed.
Then `ritual_streak` increments to 7.
And `award-tokens` fires with `{ event_type: 'streak_7', beans: 3.5, mazorcas: 1 }` in addition to the standard `ritual_draw` award.

**AC-04 — Lot Investment Flow**
Given an authenticated user with `caua_role = 'investor'`.
When they navigate to `/fund`, select MucilageExtract™, choose 2 lots, select Stripe/USD payment.
Then `create-stripe-checkout` is called with `{ technology_id, lots_count: 2, role: 'investor', currency: 'usd' }`.
And `lot_price` applies 50% investor discount ($250 → $125/lot).
And the user is redirected to Stripe Checkout.
After Stripe webhook fires `checkout.session.completed`:
And `lot_investments` row is created.
And `technologies.lots_funded` increments by 2.
And `award-tokens` fires with `{ event_type: 'lot_per_lot', beans: 5, mazorcas: 2 }` × 2.

**AC-05 — Blog Public Read**
Given an unauthenticated visitor.
When they navigate to `/blog`.
Then blog posts with `published=true` are displayed.
And no authentication redirect occurs.
When they navigate to `/blog/{slug}` for a published post.
Then the post body is rendered as formatted HTML (not raw Markdown).

**AC-06 — Token Redemption (when implemented)**
Given a user with `beans_balance = 25`.
When they add a product to cart and apply 20 beans at checkout.
Then `beans_balance` decrements by 20 to 5.
And a `redeem-tokens` event is recorded in `token_events`.
And the checkout subtotal reflects the discount.

**AC-07 — Admin CRM Access**
Given a user with email `amauryamed@gmail.com`.
When they navigate to `/admin/crm`.
Then the admin dashboard is displayed with 5 tabs.
Given a user NOT in the admin list and `caua_role !== 'founder'`.
When they navigate to `/admin/crm`.
Then they are redirected to `/dashboard`.

**AC-08 — ML Health Prediction**
Given a request with `{ temp_c: 35, soil_moisture: 10, sunlight_lux: 3000 }` (extreme stress conditions).
When `POST /api/ml_predictor` is called with valid `X-ML-Secret`.
Then `predicted_health < 50`.
And `stress_alert = true`.
And the response contains `anon_token` (not raw user_id or tree_id).

**AC-09 — Stripe Webhook Order Confirmation**
Given a completed Stripe checkout session.
When the `checkout.session.completed` webhook fires.
Then the corresponding `orders` row updates `status = 'completed'`.
And `send-order-email` is invoked.
And `award-tokens` is called with the appropriate lot event.

**AC-10 — Authentication Gate**
Given an unauthenticated visitor.
When they navigate to `/adoptar`, `/dashboard`, `/marketplace`, `/ritual`, or `/fund`.
Then they are redirected to `/auth` via the `AuthGate` wrapper component.
When they navigate to `/`, `/blog`, `/blog/:slug`.
Then no redirect occurs — these routes are publicly accessible.

---

## 7. UI/UX Experience Standards — Immersive Bar

> **Authoritative source:** [`docs/context/ui-ux-bar.md`](../context/ui-ux-bar.md) (HOT tier, always loaded)
>
> Every new page and every refactor must meet the Immersive Experience Bar. Covers: performance budgets (LCP ≤ 2.0s desktop / 2.5s mobile, CLS ≤ 0.05, 60fps desktop / 30fps mobile floor), asset pipeline (GLB ≤ 3MB Draco+KTX2, HDRI ≤ 1.5MB, video ≤ 6MB keyframe-per-frame for scroll scrubbing), motion fidelity (motion.dev for vanilla pages, Framer Motion restricted to CauaGotchi, `prefers-reduced-motion` hard kill switch), 3D policy (IntersectionObserver pause, LOD above 20k tris, HDRI IBL mandatory), accessibility (WCAG 2.1 AA, 44pt touch targets, 4.5:1 contrast), and design coherence (hex + rgba literals, grain overlay permanent).

### AC-11 — Scroll-scrubbed video fidelity
Given a hero section with scroll-scrubbed video.
When scrolling through the section.
Then `video.currentTime` tracks `window.scrollYProgress` within ±1 frame at 60fps sustained.
When `prefers-reduced-motion: reduce` is set.
Then the `<video>` element is replaced by the poster `<img>` with zero console errors.

### AC-12 — Rail pin integrity
Given a pinned horizontal rail (`#stages-rail`) with 4 stages over 400vh.
When the user scrolls into the section.
Then the viewport remains sticky until all 4 stages advance; CLS delta < 0.01.
When viewport < 600px.
Then stages remain readable without horizontal overflow.

### AC-13 — Reduced-motion fallback
Given `prefers-reduced-motion: reduce` is set.
When the page loads.
Then the WebGL canvas is hidden (`display: none`); the `<video>` hero is replaced by `<img>` poster; the pin rail collapses to vertical stack.
Zero console warnings, zero partial states.

### AC-14 — Asset budget enforcement
Given a PR that adds assets to `public/assets/3d/`.
When CI runs.
Then pages fail the build if total transfer > 12 MB desktop / 8 MB mobile per `docs/context/ui-ux-bar.md §1`.

---

## 8. Octogent Orchestration Model

This project uses Octogent to coordinate 8 development domains. The full scaffold is at `.octogent/`.

### Agent Protocol
Before beginning any task:
1. Identify which tentacle domain your task belongs to (use routing table in CLAUDE.md)
2. Read `.octogent/tentacles/<tentacle-id>/CONTEXT.md`
3. Check `.octogent/tentacles/<tentacle-id>/todo.md` for open items
4. After completing work, check off completed items in `todo.md`
5. Add architectural decisions to `NOTES.md` with date and rationale

### Tentacle Domains
| Tentacle | Domain |
|----------|--------|
| `cacao-gotchi` | Tree adoption, CauaGotchi game, care actions, growth lifecycle |
| `b2b-marketplace` | Crowdfunding, lot investments, multi-currency payments |
| `token-economy` | Beans/mazorcas earning, balance, redemption |
| `blog-cms` | Blog posts, Markdown rendering, content strategy |
| `supabase-backend` | DB schema, RLS, Edge Functions, triggers |
| `ml-pipeline` | Python health prediction, IoT ingestion, climate data |
| `design-system` | BRAND palette, typography, UI components |
| `infra-devops` | CI/CD, deployment, tests, health monitoring |
