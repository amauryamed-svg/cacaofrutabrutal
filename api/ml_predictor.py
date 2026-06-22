import os
import hashlib
import numpy as np
import pandas as pd
from datetime import datetime
from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
from sklearn.ensemble import GradientBoostingRegressor
from supabase import create_client, Client

app = FastAPI(
    title="Cacao Fruta Brutal - ML Predictor",
    description="Machine Learning Microservice for the Digital Twin",
    version="1.0.0"
)

api_key_header = APIKeyHeader(name="X-ML-Secret", auto_error=True)

def get_api_key(api_key: str = Security(api_key_header)):
    secret = os.environ.get("CACAO_ML_SECRET", "dev-secret-key")
    if api_key != secret:
        raise HTTPException(status_code=403, detail="Could not validate credentials")
    return api_key

def get_supabase() -> Client:
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    return create_client(url, key)

# Train once at startup. Replace with joblib.load('model.pkl') when real data available.
print("Training MVP Prediction Model...")
np.random.seed(42)
_X = pd.DataFrame({
    'temp_c':         np.random.uniform(20, 35, 1000),
    'soil_moisture':  np.random.uniform(20, 80, 1000),
    'sunlight_lux':   np.random.uniform(5000, 50000, 1000),
})
_y = 100 - (abs(_X['temp_c'] - 26) * 3) - (abs(_X['soil_moisture'] - 60) * 0.5)
model = GradientBoostingRegressor(n_estimators=50, max_depth=3)
model.fit(_X, _y)
print("Model ready.")


class PredictRequest(BaseModel):
    user_id: str
    tree_id: str
    temp_c: float
    soil_moisture: float
    sunlight_lux: float

class PredictResponse(BaseModel):
    anon_token: str
    predicted_health: float
    stress_alert: bool
    timestamp: str


def privacy_filter(user_id: str, tree_id: str) -> str:
    """SHA-256 pseudonymise — no PII leaves this function."""
    salt = os.environ.get("PRIVACY_SALT", "caua_salt_v1")
    return hashlib.sha256(f"{user_id}{tree_id}{salt}".encode()).hexdigest()


def extract_features(req: PredictRequest) -> pd.DataFrame:
    """Build a single-row feature DataFrame from the request."""
    return pd.DataFrame([{
        'temp_c':        req.temp_c,
        'soil_moisture': req.soil_moisture,
        'sunlight_lux':  req.sunlight_lux,
    }])


def run_model(features: pd.DataFrame) -> tuple[float, bool]:
    """Run the trained model; clamp output to [0, 100]."""
    raw = float(model.predict(features)[0])
    health = max(0.0, min(100.0, raw))
    return round(health, 2), health < 50.0


def log_prediction(sb: Client, anon_token: str, req: PredictRequest,
                   health: float, alert: bool) -> None:
    """Insert anonymised row into ml_predictions_log; silent on failure."""
    try:
        if not (sb.supabase_url and sb.supabase_key):
            return
        sb.table("ml_predictions_log").insert({
            "anon_token":       anon_token,
            "tree_id":          req.tree_id,
            "temp_c":           req.temp_c,
            "soil_moisture":    req.soil_moisture,
            "sunlight_lux":     req.sunlight_lux,
            "predicted_health": health,
            "stress_alert":     alert,
            "created_at":       datetime.utcnow().isoformat(),
        }).execute()
    except Exception as e:
        print(f"DB log failed: {e}")


@app.post("/predict/health", response_model=PredictResponse)
async def predict_tree_health(req: PredictRequest, api_key: str = Depends(get_api_key)):
    anon_token = privacy_filter(req.user_id, req.tree_id)
    features   = extract_features(req)
    health, alert = run_model(features)
    log_prediction(get_supabase(), anon_token, req, health, alert)
    return PredictResponse(
        anon_token=anon_token[:16],
        predicted_health=health,
        stress_alert=alert,
        timestamp=datetime.utcnow().isoformat(),
    )
