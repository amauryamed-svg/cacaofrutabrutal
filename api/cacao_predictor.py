import os
import json
import httpx
from datetime import datetime, timedelta
from supabase import create_client

# ── Constants ─────────────────────────────────────────────────────────
GUARDIAN_COORDS = {
    0: ("2.5359", "-75.5277"),   # Huila
    1: ("7.0900", "-70.7620"),   # Arauca
    2: ("4.2694", "-74.4144"),   # Arbeláez / Cundinamarca
    3: ("4.1534", "-73.6375"),   # Meta
    4: ("6.5544", "-73.1350"),   # Santander
}

STAGE_CO2 = {
    "Semilla": 0.1,
    "Plántula": 0.8,
    "Árbol Joven": 4.2,
    "Árbol Adulto": 12.0,
    "Cosecha": 18.5,
}

STAGE_ORDER = ["Semilla", "Plántula", "Árbol Joven", "Árbol Adulto", "Cosecha"]


def get_supabase():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    return create_client(url, key)


def fetch_climate(lat: str, lon: str) -> dict:
    """Fetch current + 7-day forecast from Open-Meteo."""
    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        f"&daily=temperature_2m_max,precipitation_sum"
        f"&forecast_days=7&timezone=America%2FBogota"
    )
    r = httpx.get(url, timeout=10)
    r.raise_for_status()
    d = r.json().get("daily", {})
    temps = d.get("temperature_2m_max", [25])
    rains = d.get("precipitation_sum", [2])
    return {
        "avg_temp_c": round(sum(temps) / len(temps), 1),
        "total_rain_mm": round(sum(rains), 1),
        "forecast_days": 7,
        "fetched_at": datetime.utcnow().isoformat(),
    }


def predict_harvest(tree: dict, climate: dict) -> datetime:
    """Estimate days to harvest based on stage + climate stress."""
    stage = tree["stage"]
    idx = STAGE_ORDER.index(stage)
    base_days = [180, 150, 120, 60, 0][idx]
    temp_stress = abs(climate["avg_temp_c"] - 25) * 2
    rain_stress = max(0, 3 - climate["total_rain_mm"] / 7) * 5
    days = max(base_days + int(temp_stress + rain_stress), base_days)
    return datetime.utcnow() + timedelta(days=days)


def next_stage(current_stage: str, climate: dict) -> str:
    """Advance stage if climate conditions are favorable."""
    idx = STAGE_ORDER.index(current_stage)
    if idx >= len(STAGE_ORDER) - 1:
        return current_stage
    favorable = (22 <= climate["avg_temp_c"] <= 28) and (climate["total_rain_mm"] > 10)
    return STAGE_ORDER[idx + 1] if favorable else current_stage


def build_update_message(tree: dict, climate: dict, new_stage: str) -> str:
    """Generate a human-readable update message in Spanish."""
    stage_changed = new_stage != tree["stage"]
    temp = climate["avg_temp_c"]
    rain = climate["total_rain_mm"]
    if stage_changed:
        return f"Tu árbol avanzó a {new_stage}. {temp}°C y {rain}mm de lluvia esta semana."
    return f"Condiciones esta semana: {temp}°C · {rain}mm lluvia. Tu árbol sigue en {new_stage}."


def process_tree(sb, tree: dict) -> None:
    """Fetch climate, compute predictions, write update row, patch tree row."""
    lat, lon = GUARDIAN_COORDS[tree["guardian_id"]]
    climate = fetch_climate(lat, lon)
    new_stage = next_stage(tree["stage"], climate)
    harvest_dt = predict_harvest(tree, climate)
    co2 = STAGE_CO2[new_stage]
    msg = build_update_message(tree, climate, new_stage)

    sb.table("tree_updates").insert(
        {
            "tree_id": tree["id"],
            "update_type": "stage_change" if new_stage != tree["stage"] else "climate",
            "message": msg,
            "climate_data": climate,
        }
    ).execute()

    sb.table("cacao_trees").update(
        {
            "stage": new_stage,
            "co2_kg": co2,
            "predicted_harvest_at": harvest_dt.isoformat(),
            "last_update_at": datetime.utcnow().isoformat(),
        }
    ).eq("id", tree["id"]).execute()


def handler(request):
    """Vercel serverless entrypoint. Authenticated via CACAO_CRON_SECRET header."""
    secret = os.environ.get("CACAO_CRON_SECRET", "")
    auth_header = request.headers.get("x-cron-secret", "")
    if auth_header != secret:
        return {"statusCode": 401, "body": json.dumps({"error": "Unauthorized"})}

    try:
        sb = get_supabase()
        trees = sb.table("cacao_trees").select("*").neq("stage", "Cosecha").execute()
        results = []
        for tree in trees.data or []:
            try:
                process_tree(sb, tree)
                results.append({"id": tree["id"], "ok": True})
            except Exception as e:
                print(f"Error processing tree {tree['id']}: {e}")
                results.append({"id": tree["id"], "ok": False, "error": str(e)})
        return {
            "statusCode": 200,
            "body": json.dumps(
                {"processed": len(results), "success": sum(1 for r in results if r["ok"]), "results": results}
            ),
        }
    except Exception as e:
        print(f"Fatal error: {e}")
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
