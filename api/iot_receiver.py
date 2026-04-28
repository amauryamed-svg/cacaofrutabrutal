"""Vercel serverless receiver for Ed25519-signed IoT readings.

Replaces the legacy shared-secret receiver. New flow:

  1. ESP32 builds canonical JSON `{device_id, tree_id, ts, temp_c, soil_moisture, sunlight_lux, nonce}`
  2. ESP32 signs with its Ed25519 private key
  3. POSTs `{payload, signature}` to this endpoint
  4. We look up device pubkey, verify signature, write to iot_readings_signed

CauaCore §8: every function ≤ 20 lines.
"""
import os
import json
from datetime import datetime, timezone
from supabase import create_client
from iot_verify import verify_ed25519, payload_hash, week_index


def _supabase():
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])


def _bad_request(msg: str, code: int = 400):
    return {"statusCode": code, "body": json.dumps({"error": msg})}


def _lookup_active_device(sb, device_id: str):
    """Returns the active device row or None."""
    r = sb.table("iot_devices").select("device_id,pubkey_hex,tree_id,active") \
        .eq("device_id", device_id).eq("active", True).limit(1).execute()
    return r.data[0] if r.data else None


def _required_fields(payload: dict) -> bool:
    needed = ("device_id", "ts", "nonce")
    return all(k in payload for k in needed)


def _insert_reading(sb, payload: dict, sig_hex: str, tree_id: str | None):
    """Persist a verified reading. Idempotent on (device_id, reading_nonce)."""
    leaf = payload_hash(payload)
    recorded_at = datetime.fromtimestamp(int(payload["ts"]), tz=timezone.utc).isoformat()
    sb.table("iot_readings_signed").insert({
        "device_id":     payload["device_id"],
        "tree_id":       tree_id,
        "recorded_at":   recorded_at,
        "temp_c":        payload.get("temp_c"),
        "soil_moisture": payload.get("soil_moisture"),
        "sunlight_lux":  payload.get("sunlight_lux"),
        "reading_nonce": payload["nonce"],
        "signature_hex": sig_hex,
        "payload_hash":  bytes(leaf).hex(),
        "week_index":    week_index(int(payload["ts"])),
    }).execute()


def _touch_device_seen(sb, device_id: str):
    sb.table("iot_devices").update({"last_seen_at": datetime.utcnow().isoformat()}) \
        .eq("device_id", device_id).execute()


def handler(request):
    """Vercel serverless entrypoint. Returns 200 on verified insert, 4xx on errors."""
    if request.method != "POST":
        return _bad_request("method_not_allowed", 405)
    try:
        body = json.loads(request.body)
    except Exception:
        return _bad_request("invalid_json")

    payload = body.get("payload")
    sig_hex = body.get("signature")
    if not payload or not sig_hex or not _required_fields(payload):
        return _bad_request("missing_fields")

    sb = _supabase()
    device = _lookup_active_device(sb, payload["device_id"])
    if not device:
        return _bad_request("device_not_registered", 404)
    if not verify_ed25519(payload, device["pubkey_hex"], sig_hex):
        return _bad_request("bad_signature", 401)

    try:
        _insert_reading(sb, payload, sig_hex, device.get("tree_id"))
    except Exception as e:
        return _bad_request(f"insert_failed:{e}", 500)
    _touch_device_seen(sb, payload["device_id"])
    return {"statusCode": 200, "body": json.dumps({"ok": True})}
