# NOTES — supabase-backend

## Architectural Decisions

**[2026-04-18] SUPABASE_SERVICE_ROLE_KEY used in Edge Functions and Python ML only**
The service_role key bypasses RLS — it is a privileged key. It is intentionally used in Edge Functions (for atomic operations that must span user boundaries) and in the Python ML microservice (for trusted system writes to `tree_updates` and `ml_predictions_log`). It must never appear in `src/`. If you see it in frontend code, that is a P0 security incident.

**[2026-04-18] Single user profile fetch per session**
`user_profiles` is fetched once on login in `AuthContext.tsx` and cached in React context. It is not refetched on every page navigation. This design keeps DB reads low at scale (target: 100K users). The tradeoff is that profile changes (e.g., role upgrade by admin) require a page reload to reflect. This is acceptable for Phase 1.

**[2026-04-18] RLS is the security layer, not the filtering layer**
All Supabase queries in the frontend must include an explicit `.eq('user_id', userId)` filter even when RLS would handle it. RLS is a security backstop only. This pattern avoids RLS policy bugs causing data leaks and makes query intent explicit.

**[2026-04-18] handle_new_user() trigger creates profile on every new auth signup**
The trigger in migration 001 fires AFTER INSERT on `auth.users` and creates a `user_profiles` row with defaults (`beans_balance: 0`, `mazorcas_balance: 0`, `caua_role: 'creyente'`). Do not create profiles manually from the frontend — always let the trigger handle it.

**[2026-04-18] Stripe webhook signature verification is untested in production**
The `stripe-webhook` Edge Function uses `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET`. This has been implemented but not verified end-to-end with a live Stripe webhook delivery. This must be tested before announcing production readiness.

## Known Risks

- Migration `011_ml_predictions_log.sql` does not exist. The Python ML microservice will fail silently on prediction log writes.
- Realtime is not enabled for `token_events` or `cacao_trees`. Live balance updates and live tree state require a migration before they can work.
- The Coinbase Commerce webhook handler does not exist. Any USDC payment will not be confirmed in the DB.
- pg_cron is not yet configured. Tree stage advancement is manual (no automatic daily update).
