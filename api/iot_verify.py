"""Ed25519 signature verification + canonical-JSON hashing for IoT readings.

CauaCore §8: every function ≤ 20 lines. No business logic — just primitives.
Used by `api/iot_receiver.py` at insert time and by `api/iot_merkle.py` to
reproduce leaf hashes for the weekly attestation root.
"""
import hashlib
import json
from typing import Any, Dict
from nacl.signing import VerifyKey
from nacl.exceptions import BadSignatureError


def canonical_json(payload: Dict[str, Any]) -> bytes:
    """Stable JSON encoding: sorted keys, no whitespace, UTF-8 bytes.

    The same encoding is reproduced on the device (firmware/cacao_node/main.cpp)
    and in the Edge Function that computes the Merkle leaves. Drift = sig fail.
    """
    return json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")


def payload_hash(payload: Dict[str, Any]) -> bytes:
    """SHA-256 of the canonical JSON. This is the Merkle leaf."""
    return hashlib.sha256(canonical_json(payload)).digest()


def verify_ed25519(payload: Dict[str, Any], pubkey_hex: str, sig_hex: str) -> bool:
    """Return True iff `sig_hex` is a valid Ed25519 signature over canonical_json(payload)."""
    try:
        vk = VerifyKey(bytes.fromhex(pubkey_hex))
        vk.verify(canonical_json(payload), bytes.fromhex(sig_hex))
        return True
    except (BadSignatureError, ValueError):
        return False


def week_index(unix_ts: int) -> int:
    """Stable epoch-week index: floor(ts / 604800). Matches Postgres compute_week_index."""
    return int(unix_ts) // 604800
