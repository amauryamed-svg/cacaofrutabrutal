# NOTES — cacao-gotchi

## Architectural Decisions

**[2026-04-18] guardian_id is an integer index, not a UUID FK**
`guardian_id` is stored as `int` (0–4) and mapped to the `GUARDIANS` array in `src/utils/constants.ts`. This is intentional — Guardians are static seed data, not a DB-managed table. Do not create a `guardians` table or change `guardian_id` to a UUID without a migration and GUARDIANS array update.

**[2026-04-18] Stage advancement is time-based, not action-count-based**
The `getStageByDays(daysSinceAdoption)` function in `growthSystem.ts` maps fractional days (0–5) to growth stages via `dayThreshold`. Stage is NOT gated by number of care actions. This design keeps the game accessible even for less-engaged users while still rewarding daily play.

**[2026-04-18] Python ML microservice bypasses RLS via service_role key**
The ML service writes to `tree_updates` using `SUPABASE_SERVICE_ROLE_KEY`. This bypasses RLS intentionally — the ML service is a trusted system actor, not a user. Never expose this pattern in frontend code.

**[2026-04-18] CauaGotchi uses Framer Motion — use sparingly**
Framer Motion is imported specifically for the CauaGotchi sprite breathing pulse animation. Every other animation in the app should use CSS keyframes (defined in `src/App.css`). Adding more Framer Motion usage increases bundle size significantly.

**[2026-04-18] Care interval is 3 hours by design**
3 hours was chosen to encourage 2–3 daily app opens without being oppressive. Do not reduce this below 1 hour — it would make the care loop feel like spam. Do not increase above 6 hours — engagement data shows habit formation breaks above 6h intervals.

## Known Risks

- `CauaGotchi` component in `Dashboard.tsx` currently receives static props. Any merge that adds care actions without first fixing the hardcoded props will create a misleading UI.
- The `ml_predictions_log` table does not yet exist in the DB (pending migration 011 in supabase-backend tentacle). The ML service will fail silently on log writes until this migration runs.
- `TreeDetail.tsx` has the UI shell but no Supabase mutations wired. A user can see the game but cannot actually care for the tree.

## 2026-05-08 — Phase 1.1 IA Reorganization (deferred)

User scope decision (sprint approved 2026-05-08): this sprint = adoption polish + new `adoption-ux-designer` agent. The full IA reorg (NavBar refactor + gating Mercado/Impacto/Fund behind wallet on-ramp with "Upgrade" badge) is deferred to Phase 1.1.

**When Phase 1.1 executes, touch:**
- `src/components/layout/NavBar.tsx:259-290` — `TABS` array. Promote ÁRBOL + LAB to top-level. Move MERCADO + WEB3 + FUND under an "UPGRADE" group with a lock chip.
- Create `src/components/layout/UpgradeBadge.tsx` — "🔒 Disponible al conectar wallet on-ramp" chip + tooltip + click → modal explaining the upgrade.
- Gating logic: detect `wallet_address` in `user_profiles` → unlock UPGRADE tabs. Use existing `useAuth` context.
- `src/pages/Impacto.tsx`, `Marketplace.tsx`, `Fund.tsx` — add a one-time welcome banner shown only when accessed via the upgrade unlock event.

**Trigger to execute Phase 1.1:** when the adoption funnel pulido tenga ≥2 semanas de tracción y queramos elevar el frame de "SaaS upgrade Web3".

**Do NOT touch before Phase 1.1:**
- App routes — keep all current pages reachable by direct URL so deep-links from email / Camino B / investor landing don't break.
- Primary navigation hierarchy — the audit identified the current TABS as adequate for Phase 1.

## 2026-05-08 — Golden Ticket Freemium mode (currently active)

The current adoption price (`TREE_ADOPTION_PRICE_USD = $5 USD`) is shown but **not charged** during the Golden Ticket campaign. Adoption is the 4th hito of Camino B (4 hitos → 1 of 30 free Cacao Ceremony slots).

**Implications for any UX/UI work on `/adoptar`:**
- Price is shown as struck-through anchor of value, not as a charge.
- CTA copy: "Adopta gratis · Golden Ticket activo".
- The freemium flag must be a dynamic config (Supabase `app_config` table row or env var read at runtime), never a hardcoded boolean — so the campaign can end without redeploy.
- Done-state must call `ingest-goldenticket` with `event_type: 'adopt_complete'` and the `cohort` URL param.
- Payment surface bypassed entirely when freemium is active.

**When the freemium campaign ends:** flip the config flag → price reverts → payment surface re-appears. No code change needed if implementation respects the dynamic flag.

**Implementation landed 2026-05-08:**
- Flag: `import.meta.env.VITE_GOLDEN_TICKET_FREEMIUM === 'true'` at top of `src/pages/Adoptar.tsx`.
- Set in Vercel: Project → Settings → Environment Variables → `VITE_GOLDEN_TICKET_FREEMIUM=true` (Production + Preview). Local dev: add to `.env.local`.
- Hitos array `GOLDEN_TICKET_HITOS` declared inline with 4 entries (adoptar/cuidar/cosechar/forjar) per `MiLaboratorio.tsx:402` canonical reference.
- UX surfaces: hero ribbon (clickable → modal), confirm-modal eyebrow swap, price tachado + GRATIS chip, CTA copy swap, bottom-disclaimer swap, done-state hito-1-completed chip, full-screen explainer modal.

**Deferred from this sprint (separate ticket):**
- `ingest-goldenticket` telemetry from app domain. Blocker: CORS allow-list at `supabase/functions/ingest-goldenticket/index.ts:43-47` only permits `cauacolombia.co` + `*.myshopify.com`. Also `EVENT_TYPES` set at `index.ts:73-81` does not include `'adopt_complete'`. To enable: add app domain (`cacaofrutabrutal.com` + Vercel preview pattern) to allow-list, add `'adopt_complete'` to EVENT_TYPES, redeploy. Then call from done-state in `Adoptar.tsx` with `cohort` from URL params.
