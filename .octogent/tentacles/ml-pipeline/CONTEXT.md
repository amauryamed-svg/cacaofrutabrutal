# Tentacle: ml-pipeline

## Domain
Python ML microservice — tree health prediction, IoT data ingestion, climate integration, digital twin intelligence.

## What This Domain Owns
- `/api/ml_predictor.py` — FastAPI app with health prediction endpoint
- `/api/iot_receiver.py` — IoT sensor data ingestion endpoint
- `/api/cacao_predictor.py` — Alternative predictor variant
- `/api/requirements.txt` — Python dependencies

## Deployment
The `api/` directory is treated as a Vercel serverless function root. FastAPI app objects are consumed by Vercel's Python runtime. Each `.py` file in `api/` is a serverless handler. Alternative deployments: Railway or Render for persistent processes (recommended for production due to cold start latency).

## ML Model

**Algorithm:** GradientBoostingRegressor (sklearn)

**Training data (synthetic — Phase 1):**
- `temp_c`: 20–35°C (ideal ~26°C for Colombian lowland Criollo)
- `soil_moisture`: 20–80% (ideal ~60%)
- `sunlight_lux`: 5,000–50,000 lux (ideal ~25,000)

**Feature → Health mapping logic:**
- `temp_factor`: gaussian around 26°C (±5°C degrades health)
- `moisture_factor`: gaussian around 60% (too dry = worse than too wet)
- `sunlight_factor`: linear above 10,000 lux, plateau at 30,000 lux
- `predicted_health` = mean(temp_factor, moisture_factor, sunlight_factor) × 100

**Stress alert:** `stress_alert = predicted_health < 50`

## Privacy Architecture

Before any data reaches the model:
1. Concatenate `user_id + tree_id + PRIVACY_SALT` (env var)
2. SHA-256 hash → `anon_token`
3. Only `anon_token` is logged to `ml_predictions_log` (never raw user_id or tree_id)

This ensures no PII leaks through the ML audit log.

## API Specification

### POST `/api/ml_predictor`

**Auth:** `X-ML-Secret: {CACAO_ML_SECRET}` header required

**Request:**
```json
{
  "user_id": "uuid",
  "tree_id": "uuid",
  "temp_c": 26.5,
  "soil_moisture": 58.0,
  "sunlight_lux": 22000
}
```

**Response:**
```json
{
  "anon_token": "sha256hex",
  "predicted_health": 87.3,
  "stress_alert": false,
  "timestamp": "2026-04-18T12:00:00Z"
}
```

**Side effect:** Writes to `ml_predictions_log` table via Supabase service_role key.

## CRITICAL CONSTRAINT (CauaCore §8)
Every Python function must be ≤ 20 lines. The current `predict_tree_health` function in `ml_predictor.py` is approximately 30 lines — this is a **violation**. It must be refactored into sub-functions before any new code is added:

```python
# Required refactoring structure:
def privacy_filter(user_id: str, tree_id: str) -> str: ...   # ≤20 lines
def extract_features(request: PredictRequest) -> list: ...   # ≤20 lines
def run_model(features: list) -> float: ...                  # ≤20 lines
def log_prediction(anon_token: str, health: float) -> None: ... # ≤20 lines
```

## Planned Endpoints

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/ml_predictor` | POST | Health prediction from sensor data | Implemented (needs refactor) |
| `/api/iot_receiver` | POST | Receive IoT sensor data from field devices | Stubbed |
| `/api/harvest_predictor` | POST | Days until harvest from stage + growth rate | Not implemented |
| `/api/climate_update` | POST | Receive Open-Meteo weather data, write tree_updates | Not implemented |

## Open-Meteo Integration (P2)

5 Guardian coordinates for climate data:
| Guardian | Region | Lat | Lon |
|----------|--------|-----|-----|
| Lucho | Huila/Acevedo | 1.80 | -75.98 |
| Marta | Arauca/Saravena | 6.95 | -71.86 |
| Rafael | Cundinamarca/La Palma | 5.40 | -74.37 |
| Fernando | Meta/Lejanías | 3.52 | -74.00 |
| Ricardo | Santander/San Vicente | 6.90 | -73.68 |

API: `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,soil_moisture_0_to_1cm,shortwave_radiation`

## Model Persistence (P1)

Current: model is retrained on each cold start (synthetic data). Fix:
```python
def train_model() -> None:
    model = GradientBoostingRegressor(...)
    model.fit(X, y)
    joblib.dump(model, 'api/model.pkl')

def load_model() -> GradientBoostingRegressor:
    return joblib.load('api/model.pkl')
```
`model.pkl` should be committed to the repo (small file ~50KB for synthetic model).

## DB Connection
The ML service uses `supabase-py` with `SUPABASE_SERVICE_ROLE_KEY` to write to `ml_predictions_log`. This bypasses RLS intentionally — the service is a trusted system actor.
