# cacao_node — ESP32 firmware

Phase 6 of the CauaCorp Web3 transformation. Owned by tentacle [`web3`](../../.octogent/tentacles/web3/CONTEXT.md).

## What it does

Reads temperature + soil moisture + sunlight from a Guardián-owned cacao tree, signs the reading with the device's Ed25519 private key (libsodium-arduino), and POSTs it to the Caúa IoT receiver. Verified readings flow into `iot_readings_signed` and roll up into a weekly Merkle root posted on Base via [`IoTAttestation.sol`](../../contracts/src/IoTAttestation.sol).

## Bill of materials (~$50/Guardián)

| Component | Pin | Approx USD |
|---|---|---|
| ESP32 dev module | — | $8–15 |
| DHT22 temp + humidity | 4 | $5 |
| Capacitive soil moisture v2 | 34 (analog) | $4 |
| LDR or BH1750 sunlight | 35 (analog) | $3 |
| LiPo + 2G/LTE cell hat (or WiFi) | — | $20–25 |
| Project box, wiring | — | $5 |

## Build & flash

```bash
# PlatformIO (recommended)
cd firmware/cacao_node
pio lib install "DHT sensor library" "ArduinoJson"
# libsodium-arduino: install via Library Manager or git submodule
pio run -e esp32dev -t upload --build-flag=-DWIFI_SSID=\"...\" \
                                 --build-flag=-DWIFI_PASSWORD=\"...\" \
                                 --build-flag=-DDEVICE_ID=\"esp32-lucho-01\"
```

## Provisioning a new device

1. Flash with a unique `DEVICE_ID` per device.
2. On first boot, the firmware generates an Ed25519 keypair and prints the pubkey to serial.
3. Founder dashboard: insert into `iot_devices` (admin tool) with the printed pubkey + device_id + Guardián id + tree_id.
4. Restart the device — it will sign and POST its first reading.

## Security model

- **Private key never leaves the device.** Stored in NVS (`Preferences`), generated at first boot.
- **Receiver verifies signatures, not shared secrets.** Compromise of the public receiver URL does not let an attacker forge readings.
- **Replay protection:** each reading carries a per-reading nonce; the DB has a `(device_id, reading_nonce)` unique constraint.
- **Key rotation:** `iot_devices.rotated_from` lets us flip a compromised device to `active=false` and register a replacement without losing history.

## Canonical JSON contract

The firmware MUST produce the same canonical JSON the verifier expects. Keys sorted alphabetically, no whitespace, UTF-8:

```json
{"device_id":"esp32-lucho-01","nonce":"a1b2…","soil_moisture":68.20,"sunlight_lux":18342,"temp_c":24.50,"ts":1714239120}
```

Drift between firmware and verifier = signature failure. If you change fields, update both [`api/iot_verify.py`](../../api/iot_verify.py) and the `buildCanonicalJson` function here in lockstep.
