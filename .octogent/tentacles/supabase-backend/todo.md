# todo — supabase-backend

## P0 — Launch Blockers

- [ ] [P0] Create migration `011_ml_predictions_log.sql`: table with columns (id, anon_token, tree_id, temp_c, soil_moisture, sunlight_lux, predicted_health, stress_alert, created_at) — RLS: service_role INSERT only, founder role SELECT

## P1 — Q2 Meaningful Experience

- [ ] [P1] Create migration `012_realtime_enable.sql`: enable Supabase Realtime publication for `token_events` and `cacao_trees` tables
- [ ] [P1] Add rate-limiting logic in `award-tokens` Edge Function: for `blog_read` event type, check `email_log` for existing row with same user_id + ref_id + today's date before awarding
- [ ] [P1] Add `notify-tree-care` Edge Function: checks trees where `last_update_at > NOW() - 3h` and sends push notification (or email) to the tree owner
- [ ] [P1] Test `stripe-webhook` signature verification end-to-end: verify `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET` — confirm it handles both test and live mode secrets
- [ ] [P1] Add `award-tokens` call inside `stripe-webhook`: after order status → `completed`, invoke award-tokens with `lot_per_lot` event × `lots_count`

## P2 — Q3–Q4 Scale

- [ ] [P2] Add Supabase pg_cron job: daily at 06:00 UTC, advance `cacao_trees.stage` for all trees where `getStageByDays(NOW() - adopted_at)` !== current stage
- [ ] [P2] Implement Supabase Storage buckets: `tree-photos` (user uploads) + `blog-covers` (admin uploads) — both with public read, authenticated write
- [ ] [P2] Create `.env.example` in project root listing all required env variable names with no values and a comment explaining each
- [ ] [P2] Audit all Edge Functions for consistent CORS header application (all must import and apply `cors-config.ts`)
- [ ] [P2] Add `catacion_leads` → HubSpot contact sync: when a lead is submitted via `notify-catacion-lead`, create or update a HubSpot contact with `lead_source: catacion`
- [ ] [P2] RLS audit on new migrations (011, 012): confirm all policies use `(SELECT auth.uid())` cacheable form
