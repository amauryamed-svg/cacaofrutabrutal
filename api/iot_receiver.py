import os
import json
import random
from datetime import datetime
from supabase import create_client

def get_supabase():
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )

def handler(request):
    """
    Vercel serverless function to receive IoT simulated data.
    In a real scenario, an ESP32 or similar device sends a POST request here
    with temperature, humidity, and soil moisture levels for a specific tree/plot.
    """
    if request.method != "POST":
        return {"statusCode": 405, "body": "Method Not Allowed"}
        
    secret = os.environ.get("CACAO_IOT_SECRET", "")
    if request.headers.get("x-iot-secret", "") != secret:
        return {"statusCode": 401, "body": json.dumps({"error": "Unauthorized"})}

    try:
        data = json.loads(request.body)
        tree_id = data.get("tree_id")
        if not tree_id:
             return {"statusCode": 400, "body": json.dumps({"error": "Missing tree_id"})}
             
        # Mocked readings if not provided completely
        temp_c = data.get("temp_c", round(random.uniform(22.0, 31.0), 1))
        soil_moisture = data.get("soil_moisture", round(random.uniform(30.0, 80.0), 1))
        sunlight = data.get("sunlight_lux", random.randint(1000, 50000))
        
        sb = get_supabase()
        
        # Insert IoT reading log
        sb.table("iot_readings").insert({
            "tree_id": tree_id,
            "temp_c": temp_c,
            "soil_moisture": soil_moisture,
            "sunlight_lux": sunlight,
            "recorded_at": datetime.utcnow().isoformat()
        }).execute()
        
        # Compute Tamagotchi stats based on IoT data
        # Ex: Low moisture reduces "happiness" / "health", good sunlight increases it.
        # This will be picked up by the Caua-gotchi UI
        health_delta = 0
        if soil_moisture < 40: health_delta -= 5
        elif soil_moisture > 60: health_delta += 2
        
        if temp_c > 29: health_delta -= 3
        elif 24 <= temp_c <= 28: health_delta += 4

        # In a real app we would update the tree's current health state here
        # sb.table("cacao_trees").update({"health": health_delta...})
        
        return {
            "statusCode": 200,
            "body": json.dumps({
                "status": "success",
                "recorded": {
                    "tree_id": tree_id,
                    "temp_c": temp_c,
                    "soil_moisture": soil_moisture,
                    "sunlight_lux": sunlight,
                    "health_delta": health_delta
                }
            })
        }
    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
