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
