# NOTES — ml-pipeline

## Architectural Decisions

**[2026-04-18] CRITICAL: Every Python function must be ≤ 20 lines (CauaCore §8)**
This is a non-negotiable project constraint. The current `predict_tree_health` function violates it at ~30 lines. Before adding any new Python code to the `api/` directory, refactor existing functions to comply. This constraint exists to maintain readability and testability in the ML service.

**[2026-04-18] Synthetic training data is appropriate for Phase 1**
The GradientBoosting model is trained on synthetic data derived from agronomic parameters of Colombian lowland Criollo cacao (ideal: 26°C, 60% moisture, 25K lux). Real IoT sensor data from Guardian farms is Phase 2. The synthetic model is sufficient for demo, investor presentations, and early user onboarding.

**[2026-04-18] ML service uses service_role key for DB writes — by design**
The Python ML microservice writes to `ml_predictions_log` and `tree_updates` using `SUPABASE_SERVICE_ROLE_KEY`. This bypasses RLS and is intentional — the ML service is a trusted system process, not a user-facing actor. It must never use the anon key (which would be blocked by RLS).

**[2026-04-18] CACAO_ML_SECRET is a separate secret from SUPABASE_SERVICE_ROLE_KEY**
The `X-ML-Secret` header auth for the ML API uses `CACAO_ML_SECRET` — a dedicated secret for the ML service API. This is separate from the Supabase service role key. Both must be set in Vercel environment variables (or Railway/Render if using persistent deployment). Never use the same value for both.

**[2026-04-18] SHA-256 pseudonymization before model inference**
User PII (user_id, tree_id) is pseudonymized via SHA-256 hash with a salt before any data enters the model or the log. Only `anon_token` is stored in `ml_predictions_log`. This satisfies basic GDPR pseudonymization requirements for ML pipeline data.

**[2026-04-18] Deployment: Vercel serverless vs. persistent process**
Currently deployed as Vercel serverless (cold start ~1–3s on first request). For production with IoT integrations requiring persistent connections, migrate to Railway or Render for a persistent FastAPI process. The cold start latency is acceptable for Phase 1 on-demand predictions.

## Known Risks

- `predict_tree_health` violates the 20-line rule. Any new feature added before fixing this compounds the violation.
- `ml_predictions_log` table does not exist in the DB (pending migration 011). Log writes fail silently.
- The model is retrained from scratch on every cold start (no `model.pkl` persistence). If the synthetic data generation changes, predictions will be inconsistent across instances.
- No auth check exists on the ML endpoints yet. Without `X-ML-Secret` validation, the endpoints are accessible to anyone who discovers the Vercel URL.
