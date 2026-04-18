# todo — ml-pipeline

## P0 — Launch Blockers

- [ ] [P0] Refactor `predict_tree_health` in `api/ml_predictor.py` into ≤20-line sub-functions: `privacy_filter`, `extract_features`, `run_model`, `log_prediction` — current function is ~30 lines, violating CauaCore §8

## P1 — Q2 Meaningful Experience

- [ ] [P1] Add `harvest_prediction` endpoint (`/api/harvest_predictor`): given current `stage` + `days_since_adoption` → return estimated days until `maduracion` stage
- [ ] [P1] Add joblib model persistence: `train_model()` writes `api/model.pkl`; `load_model()` reads it on startup — eliminates cold-start retraining
- [ ] [P1] Add `PRIVACY_SALT` env var: used in `privacy_filter()` SHA-256 hash — document in `.env.example`
- [ ] [P1] Implement basic auth check in all endpoints: verify `X-ML-Secret` header matches `CACAO_ML_SECRET` env var, return 401 if not

## P2 — Q3–Q4 Scale

- [ ] [P2] Add `climate_update` endpoint: call Open-Meteo API for 5 Guardian coordinates, write a `tree_updates` row per Guardian tree with current climate data
- [ ] [P2] Implement `iot_receiver.py` endpoints: accept sensor readings (temp_c, soil_moisture, sunlight_lux) from field devices with device_id auth
- [ ] [P2] Replace synthetic training data with real field data from Guardian IoT sensors (when available)
- [ ] [P2] Add Prometheus `/metrics` endpoint: expose prediction count, error count, avg response time
- [ ] [P2] Write unit tests for `privacy_filter`: verify output is SHA-256 hex string and input user_id/tree_id never appear in output
- [ ] [P2] Set up `pytest` with GitHub Actions CI: run `pytest api/` on every push to main
