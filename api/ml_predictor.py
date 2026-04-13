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

# Initialize the FastAPI app
app = FastAPI(
    title="Cacao Fruta Brutal - ML Predictor",
    description="Machine Learning Microservice for the Digital Twin",
    version="1.0.0"
)

# API Key security for endpoint
api_key_header = APIKeyHeader(name="X-ML-Secret", auto_error=True)

def get_api_key(api_key: str = Security(api_key_header)):
    secret = os.environ.get("CACAO_ML_SECRET", "dev-secret-key")
    if api_key != secret:
        raise HTTPException(status_code=403, detail="Could not validate credentials")
    return api_key

def get_supabase() -> Client:
    # Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    return create_client(url, key)

# --- ML Model Setup (Simulated Training for MVP) ---
# In a production environment, this model would be trained offline 
# and loaded via joblib.load('model.pkl').
print("Training MVP Prediction Model...")
np.random.seed(42)
X_train = pd.DataFrame({
    'temp_c': np.random.uniform(20, 35, 1000),
    'soil_moisture': np.random.uniform(20, 80, 1000),
    'sunlight_lux': np.random.uniform(5000, 50000, 1000)
})
# Target formula: ideal conditions (Temp ~26, Moisture ~60) yield higher "health_score"
y_train = 100 - (abs(X_train['temp_c'] - 26) * 3) - (abs(X_train['soil_moisture'] - 60) * 0.5)

model = GradientBoostingRegressor(n_estimators=50, max_depth=3)
model.fit(X_train, y_train)
print("Model Ready.")
# --------------------------------------------------

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

@app.post("/predict/health", response_model=PredictResponse)
async def predict_tree_health(req: PredictRequest, api_key: str = Depends(get_api_key)):
    """
    Predicts the future health score of the cacao tree using Scikit-Learn.
    Applies privacy filter to anonymize the user_id before processing.
    """
    # 1. Privacy Filter: Tokenize/Pseudonymize user identity
    salt = os.environ.get("SALT", "caua_salt_v1")
    anon_token = hashlib.sha256(f"{req.user_id}{req.tree_id}{salt}".encode()).hexdigest()
    
    # 2. Extract Features
    features = pd.DataFrame([{
        'temp_c': req.temp_c,
        'soil_moisture': req.soil_moisture,
        'sunlight_lux': req.sunlight_lux
    }])
    
    # 3. Model Prediction
    prediction = model.predict(features)[0]
    predicted_health = max(0.0, min(100.0, float(prediction)))
    
    # 4. Generate Output Logic (Alert if health drops below 50)
    stress_alert = predicted_health < 50.0
    
    # 5. Connect to Supabase to log the anonymized telemetry for retraining
    try:
        sb = get_supabase()
        if sb.supabase_url and sb.supabase_key:
            sb.table("ml_predictions_log").insert({
                "anon_token": anon_token,
                "tree_id": req.tree_id,
                "temp_c": req.temp_c,
                "soil_moisture": req.soil_moisture,
                "predicted_health": predicted_health,
                "stress_alert": stress_alert,
                "created_at": datetime.utcnow().isoformat()
            }).execute()
    except Exception as e:
        # We don't fail the prediction if the DB log fails, but we print for monitoring
        print(f"DB Logging failed: {e}")

    return PredictResponse(
        anon_token=anon_token[:16], # Return truncated token
        predicted_health=round(predicted_health, 2),
        stress_alert=stress_alert,
        timestamp=datetime.utcnow().isoformat()
    )

# --- Vercel Serverless Handler ---
# Vercel looks for the `app` object in this file to handle connections implicitly
# No uvicorn setup needed at the bottom if served by Vercel serverless functions.
