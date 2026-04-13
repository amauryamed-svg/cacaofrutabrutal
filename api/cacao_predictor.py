import os
import json
import httpx
from datetime import datetime, timedelta
from supabase import create_client

# ── Guardian data (mirrors constants.ts GUARDIANS order 0-4) ──────────
GUARDIAN_DATA = {
    0: {
        "name": "Lucho", "town": "Hobo", "region": "Huila",
        "lat": "2.5746", "lon": "-75.4503",
        "varieties": ["Híbrido Acriollado"],
        "flavor_profile": "Chocolate oscuro · Frutos secos · Complejidad media",
        "polyphenol_score": 72,
    },
    1: {
        "name": "Marta", "town": "Arauca", "region": "Arauca",
        "lat": "7.0881", "lon": "-70.7594",
        "varieties": ["Criollo Élite"],
        "flavor_profile": "Floral · Miel · Frutas tropicales · Fine-flavor premium",
        "polyphenol_score": 95,
    },
    2: {
        "name": "Rafael", "town": "Arbeláez", "region": "Cundinamarca",
        "lat": "4.2694", "lon": "-74.4144",
        "varieties": ["Criollo Élite"],
        "flavor_profile": "Polifenoles altos · Frutal fresco · Acidez elegante",
        "polyphenol_score": 91,
    },
    3: {
        "name": "Fernando", "town": "Guamal", "region": "Meta",
        "lat": "3.8868", "lon": "-73.7683",
        "varieties": ["Criollo Élite"],
        "flavor_profile": "Frutal · Vinoso · Ciruela · Fine-flavor piedemonte",
        "polyphenol_score": 88,
    },
    4: {
        "name": "Ricardo", "town": "Landázuri", "region": "Santander",
        "lat": "6.2185", "lon": "-73.8116",
        "varieties": ["Trinitario"],
        "flavor_profile": "Chocolatoso robusto · Acidez controlada · Notas a frutos rojos",
        "polyphenol_score": 78,
    },
}

STAGE_ORDER = ["Semilla", "Plántula", "Árbol Joven", "Árbol Adulto", "Cosecha"]

# CO2 acumulado por etapa (kg) — cacao adulto absorbe ~12 kg CO₂/año
STAGE_CO2 = {
    "Semilla": 0.0, "Plántula": 0.3,
    "Árbol Joven": 3.5, "Árbol Adulto": 11.0, "Cosecha": 18.5,
}

# Fine-flavor score mejora con buenas condiciones climáticas
OPTIMAL_TEMP_MIN, OPTIMAL_TEMP_MAX = 22.0, 27.0
OPTIMAL_RAIN_MM_WEEK = 20.0


def get_supabase():
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


def fetch_climate(lat: str, lon: str) -> dict:
    """Fetch 7-day forecast from Open-Meteo (free, no key required)."""
    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum"
        "&forecast_days=7&timezone=America%2FBogota"
    )
    r = httpx.get(url, timeout=10)
    r.raise_for_status()
    d = r.json().get("daily", {})
    t_max = d.get("temperature_2m_max", [25])
    t_min = d.get("temperature_2m_min", [18])
    rains = d.get("precipitation_sum", [3])
    return {
        "avg_temp_c": round((sum(t_max) / len(t_max) + sum(t_min) / len(t_min)) / 2, 1),
        "max_temp_c": round(max(t_max), 1),
        "total_rain_mm": round(sum(rains), 1),
        "fetched_at": datetime.utcnow().isoformat(),
    }


def calc_fine_flavor_score(climate: dict, guardian_id: int) -> int:
    """Score 0-100 representing fine-flavor development conditions."""
    g = GUARDIAN_DATA[guardian_id]
    base = g["polyphenol_score"]
    temp_ok = OPTIMAL_TEMP_MIN <= climate["avg_temp_c"] <= OPTIMAL_TEMP_MAX
    rain_ok = climate["total_rain_mm"] >= OPTIMAL_RAIN_MM_WEEK
    bonus = (5 if temp_ok else -10) + (5 if rain_ok else -8)
    return max(0, min(100, base + bonus))


def predict_harvest(tree: dict, climate: dict) -> datetime:
    """Estimate days to harvest based on stage and climate stress."""
    idx = STAGE_ORDER.index(tree["stage"])
    base_days = [180, 140, 100, 45, 0][idx]
    temp_stress = max(0, abs(climate["avg_temp_c"] - 24.5) - 1) * 3
    rain_stress = max(0, OPTIMAL_RAIN_MM_WEEK - climate["total_rain_mm"]) * 0.8
    days = int(base_days + temp_stress + rain_stress)
    return datetime.utcnow() + timedelta(days=max(days, base_days))


def next_stage(current: str, climate: dict) -> str:
    """Advance to next growth stage if climate is favorable."""
    idx = STAGE_ORDER.index(current)
    if idx >= len(STAGE_ORDER) - 1:
        return current
    temp_ok = OPTIMAL_TEMP_MIN <= climate["avg_temp_c"] <= OPTIMAL_TEMP_MAX
    rain_ok = climate["total_rain_mm"] >= OPTIMAL_RAIN_MM_WEEK * 0.6
    return STAGE_ORDER[idx + 1] if (temp_ok and rain_ok) else current


def build_update_message(tree: dict, climate: dict, new_stage: str, flavor: int) -> str:
    """Generate a contextual update message in Spanish."""
    g = GUARDIAN_DATA[tree["guardian_id"]]
    temp = climate["avg_temp_c"]
    rain = climate["total_rain_mm"]
    stage_changed = new_stage != tree["stage"]
    if stage_changed:
        return (
            f"{g['name']} reporta: tu árbol avanzó a {new_stage} en {g['town']}. "
            f"{temp}°C y {rain}mm esta semana. Fine-flavor: {flavor}/100."
        )
    return (
        f"{g['name']} desde {g['town']}: {temp}°C · {rain}mm lluvia · "
        f"Perfil fine-flavor {flavor}/100 — {g['flavor_profile']}."
    )


def process_tree(sb, tree: dict) -> None:
    """Fetch climate, compute all metrics, write update row, patch tree."""
    g_id = tree["guardian_id"]
    g = GUARDIAN_DATA[g_id]
    climate = fetch_climate(g["lat"], g["lon"])
    new_stage = next_stage(tree["stage"], climate)
    harvest_dt = predict_harvest(tree, climate)
    co2 = STAGE_CO2[new_stage]
    flavor = calc_fine_flavor_score(climate, g_id)
    msg = build_update_message(tree, climate, new_stage, flavor)

    sb.table("tree_updates").insert({
        "tree_id": tree["id"],
        "update_type": "stage_change" if new_stage != tree["stage"] else "climate",
        "message": msg,
        "climate_data": {**climate, "fine_flavor_score": flavor, "polyphenol_base": g["polyphenol_score"]},
    }).execute()

    sb.table("cacao_trees").update({
        "stage": new_stage,
        "co2_kg": co2,
        "predicted_harvest_at": harvest_dt.isoformat(),
        "last_update_at": datetime.utcnow().isoformat(),
    }).eq("id", tree["id"]).execute()


def handler(request):
    """Vercel serverless entrypoint. Authenticated via CACAO_CRON_SECRET header."""
    secret = os.environ.get("CACAO_CRON_SECRET", "")
    if request.headers.get("x-cron-secret", "") != secret:
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
                results.append({"id": tree["id"], "ok": False, "error": str(e)})
        success = sum(1 for r in results if r["ok"])
        return {
            "statusCode": 200,
            "body": json.dumps({"processed": len(results), "success": success, "results": results}),
        }
    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
