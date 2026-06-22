# Tentacle: supabase-backend

## Domain
All DB schema, migrations, RLS policies, Edge Functions, triggers, and backend security.

## What This Domain Owns
- `/supabase/migrations/` — 10 migration files (001–010)
- `/supabase/functions/` — 6 Edge Functions + 2 shared middleware files
- `/supabase/functions/cors-config.ts` — CORS middleware
- `/supabase/functions/security-headers-middleware.ts` — Security headers
- `/docs/BACKEND_RLS_AUDIT.md` — RLS security audit log

## Migration Files (in order)

| File | Contents |
|------|----------|
| `001_initial_schema.sql` | products, user_profiles, bids, orders, user_rituals, user_referrals, cookie_consents + RLS |
| `002_crowdfunding.sql` | technologies, mvps, lot_investments, caua_role enum |
| `003_blog.sql` | blog_posts, email_log, notifications |
| `004_user_profiles_rls.sql` | Additional RLS policies + email index on user_profiles |
| `005_cacao_trees.sql` | cacao_trees, tree_updates |
| `006_rls_optimization.sql` | Btree indexes on RLS-filtered columns, cacheable auth.uid() patterns |
| `007_cacao_trees_complete.sql` | Extended cacao_trees schema (health, moisture, sunlight columns) |
| `008_catacion_leads.sql` | catacion_leads table (tasting event lead capture) |
| `009_cotizaciones_b2b.sql` | cotizaciones_b2b table (B2B quote requests, email-based RLS) |
| `010_blog_tokens_crm.sql` | token_events table, blog enhancements, CRM columns on user_profiles |

## Edge Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `award-tokens` | Frontend POST | Mint tokens for any earning event — single source of truth |
| `create-stripe-checkout` | Frontend POST | Create Stripe Checkout Session and return session URL |
| `create-mp-preference` | Frontend POST | Create MercadoPago Preference and return redirect URL |
| `stripe-webhook` | Stripe POST | Handle `checkout.session.completed` → update order status |
| `send-order-email` | Internal call | Send transactional confirmation email via Resend |
| `notify-catacion-lead` | Frontend POST | Notify team when tasting event lead is submitted |

## Key DB Triggers

| Trigger | Table | What it does |
|---------|-------|-------------|
| `handle_new_user()` | `auth.users` INSERT | Auto-creates `user_profiles` row with defaults |
| `on_order_completed()` | `orders` UPDATE | Increments `user_profiles.completed_orders` |
| `update_technology_funding()` | `lot_investments` INSERT | Increments `technologies.lots_funded + raised_usd_cents` |

## RLS Design Rules

**Non-negotiable RLS patterns (migration 006 optimizations):**

1. Wrap `auth.uid()` in a subselect for caching:
   ```sql
   -- CORRECT (cached):
   WHERE user_id = (SELECT auth.uid())
   -- WRONG (evaluated per row):
   WHERE user_id = auth.uid()
   ```

2. Btree indexes on all RLS-filtered columns (not just PKs):
   ```sql
   CREATE INDEX ON cacao_trees (user_id);
   CREATE INDEX ON token_events (user_id);
   CREATE INDEX ON lot_investments (user_id);
   ```

3. Frontend always filters explicitly (don't rely on RLS for filtering):
   ```ts
   supabase.from('cacao_trees').select('*').eq('user_id', userId)
   ```

4. `security definer` functions for complex multi-table RLS joins:
   ```sql
   CREATE FUNCTION get_user_tree_ids(uid uuid) RETURNS uuid[]
   SECURITY DEFINER LANGUAGE sql AS $$
     SELECT ARRAY(SELECT id FROM cacao_trees WHERE user_id = uid)
   $$;
   ```

## Environment Variables

| Variable | Where used | Never in |
|----------|-----------|---------|
| `VITE_SUPABASE_URL` | Frontend (src/) | — |
| `VITE_SUPABASE_ANON_KEY` | Frontend (src/) | — |
| `SUPABASE_URL` | Edge Functions + Python | — |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions + Python | src/ |
| `STRIPE_SECRET_KEY` | Edge Functions | src/ |
| `STRIPE_WEBHOOK_SECRET` | stripe-webhook Edge Fn | — |
| `MERCADOPAGO_ACCESS_TOKEN` | Edge Functions | src/ |
| `CACAO_ML_SECRET` | api/ Python (caller) | src/ |
| `JWT_SECRET` | award-tokens Edge Fn | — |
| `RESEND_API_KEY` | send-order-email | src/ |
| `HUBSPOT_API_KEY` | Edge Functions | src/ |

## Auth Model

- Provider: Google OAuth only (no email/password)
- Session: Supabase Auth JWT, stored in Supabase session (never localStorage)
- User profile: auto-created on first login via `handle_new_user()` trigger
- Single profile fetch per session, cached in `AuthContext.tsx`
- Super-admins: `amauryamed@gmail.com` + `amaury@cauacolombia.co` (hardcoded) OR `caua_role = 'founder'`

## Pending Migrations

| Number | What it does | Status |
|--------|-------------|--------|
| `011_ml_predictions_log.sql` | `ml_predictions_log` table for ML service audit logs | NOT YET CREATED |
| `012_realtime_enable.sql` | Enable Supabase Realtime for `token_events` + `cacao_trees` | NOT YET CREATED |

## Security Architecture

- CORS: configured in `cors-config.ts`, applied to all Edge Functions
- Security headers: `cors-config.ts` headers + Vite config security headers for frontend
- RLS: all user-data tables have RLS enabled. No table is publicly writable.
- Stripe webhook: signature verification via `stripe.webhooks.constructEvent` (must be tested)
- ML service: authenticated via `X-ML-Secret` header (separate from Supabase auth)
