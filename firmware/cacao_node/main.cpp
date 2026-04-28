/*
 * Caúa cacao_node — ESP32 firmware skeleton
 * --------------------------------------------------------
 * Reads DHT22 (temp + humidity proxy) and analog soil moisture, then signs
 * a canonical JSON payload with the device's Ed25519 private key and POSTs
 * to the Caúa IoT receiver Edge Function.
 *
 * Hardware (~$50/Guardián):
 *   - ESP32 dev module (8-30 USD)
 *   - DHT22 (4-7 USD)             pin: 4
 *   - Capacitive soil moisture v2 pin: 34 (analog)
 *   - LDR or BH1750 sunlight sensor pin: 35 (analog) or I2C
 *   - LiPo + cell hat or WiFi gateway (~25 USD)
 *
 * Crypto: libsodium-arduino (port of NaCl). Provides crypto_sign_detached.
 * The device's 32-byte secret key is provisioned at flash time and stored in
 * NVS (Preferences). The matching pubkey is registered in iot_devices via
 * the founder dashboard — never written by the firmware itself.
 *
 * Canonical JSON convention (must exactly match api/iot_verify.py):
 *   keys sorted, no whitespace, UTF-8.
 *   Required fields: device_id, ts, nonce.
 *   Optional fields: temp_c, soil_moisture, sunlight_lux, tree_id.
 *
 * Author: CauaCorp · Phase 6 · 2026-04-27
 */

#include <Arduino.h>
#include <Preferences.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ArduinoJson.h>
#include <sodium.h>

// ── Config (override at flash time via NVS or build flags) ────────────
#ifndef WIFI_SSID
#define WIFI_SSID "CHANGE_ME"
#endif
#ifndef WIFI_PASSWORD
#define WIFI_PASSWORD "CHANGE_ME"
#endif
#ifndef RECEIVER_URL
#define RECEIVER_URL "https://kjygovuiphbxcdxeduco.functions.supabase.co/iot-receiver"
#endif
#ifndef DEVICE_ID
#define DEVICE_ID "esp32-unset"
#endif
#ifndef SAMPLE_INTERVAL_SECONDS
#define SAMPLE_INTERVAL_SECONDS 1800   // 30 minutes
#endif

#define DHT_PIN 4
#define DHT_TYPE DHT22
#define SOIL_PIN 34
#define LDR_PIN  35

DHT dht(DHT_PIN, DHT_TYPE);
Preferences prefs;
unsigned char secretKey[crypto_sign_SECRETKEYBYTES]; // 64 bytes
unsigned char publicKey[crypto_sign_PUBLICKEYBYTES]; // 32 bytes

// ── Util: load Ed25519 secret key from NVS or generate (first boot) ────
static void loadOrGenerateKeypair() {
  prefs.begin("caua_iot", false);
  size_t skSize = prefs.getBytesLength("sk");
  if (skSize == crypto_sign_SECRETKEYBYTES) {
    prefs.getBytes("sk", secretKey, crypto_sign_SECRETKEYBYTES);
    prefs.getBytes("pk", publicKey, crypto_sign_PUBLICKEYBYTES);
  } else {
    crypto_sign_keypair(publicKey, secretKey);
    prefs.putBytes("sk", secretKey, crypto_sign_SECRETKEYBYTES);
    prefs.putBytes("pk", publicKey, crypto_sign_PUBLICKEYBYTES);
  }
  prefs.end();
}

// ── Util: build canonical JSON exactly matching iot_verify.py ──────────
static void buildCanonicalJson(char* out, size_t outLen,
                               unsigned long ts, const char* nonce,
                               float tempC, float soilPct, long sunLux) {
  // Keys sorted alphabetically, no whitespace.
  // device_id, nonce, soil_moisture, sunlight_lux, temp_c, ts
  snprintf(out, outLen,
    "{\"device_id\":\"%s\",\"nonce\":\"%s\",\"soil_moisture\":%.2f,"
    "\"sunlight_lux\":%ld,\"temp_c\":%.2f,\"ts\":%lu}",
    DEVICE_ID, nonce, soilPct, sunLux, tempC, ts);
}

// ── Util: hex-encode bytes for transmission ────────────────────────────
static void toHex(char* out, const unsigned char* bytes, size_t n) {
  static const char hex[] = "0123456789abcdef";
  for (size_t i = 0; i < n; i++) {
    out[i * 2]     = hex[bytes[i] >> 4];
    out[i * 2 + 1] = hex[bytes[i] & 0x0f];
  }
  out[n * 2] = '\0';
}

// ── Util: random 16-byte nonce → hex (32 chars) ────────────────────────
static void randomNonce(char* out) {
  unsigned char buf[16];
  randombytes_buf(buf, sizeof(buf));
  toHex(out, buf, sizeof(buf));
}

// ── Util: WiFi connect with timeout ────────────────────────────────────
static bool wifiConnect() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) delay(250);
  return WiFi.status() == WL_CONNECTED;
}

// ── Util: read all sensors ─────────────────────────────────────────────
static void readSensors(float& tempC, float& soilPct, long& sunLux) {
  tempC   = dht.readTemperature();
  if (isnan(tempC)) tempC = 0.0f;
  int soilRaw = analogRead(SOIL_PIN);                     // 0..4095
  soilPct = 100.0f * (1.0f - (soilRaw / 4095.0f));        // wet=high pct
  long ldr = analogRead(LDR_PIN);
  sunLux = (ldr * 50000L) / 4095L;                        // crude scale
}

// ── Sign + POST one reading ────────────────────────────────────────────
static int sendOneReading() {
  unsigned long ts = (unsigned long)(millis() / 1000) + 1700000000UL; // wall-clock approx; replace w/ NTP
  char nonce[33];
  randomNonce(nonce);
  float tempC = 0.0f, soilPct = 0.0f;
  long sunLux = 0;
  readSensors(tempC, soilPct, sunLux);

  char payload[256];
  buildCanonicalJson(payload, sizeof(payload), ts, nonce, tempC, soilPct, sunLux);

  unsigned char sig[crypto_sign_BYTES];
  crypto_sign_detached(sig, NULL, (unsigned char*)payload, strlen(payload), secretKey);
  char sigHex[crypto_sign_BYTES * 2 + 1];
  toHex(sigHex, sig, crypto_sign_BYTES);

  char body[640];
  snprintf(body, sizeof(body),
    "{\"payload\":%s,\"signature\":\"%s\"}", payload, sigHex);

  HTTPClient http;
  http.begin(RECEIVER_URL);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST((uint8_t*)body, strlen(body));
  http.end();
  return code;
}

void setup() {
  Serial.begin(115200);
  if (sodium_init() < 0) { Serial.println("libsodium init failed"); while (true) delay(1000); }
  loadOrGenerateKeypair();
  char pkHex[crypto_sign_PUBLICKEYBYTES * 2 + 1];
  toHex(pkHex, publicKey, crypto_sign_PUBLICKEYBYTES);
  Serial.printf("device_id=%s pubkey=%s\n", DEVICE_ID, pkHex);
  dht.begin();
  pinMode(SOIL_PIN, INPUT);
  pinMode(LDR_PIN, INPUT);
}

void loop() {
  if (!wifiConnect()) { delay(60000); return; }
  int code = sendOneReading();
  Serial.printf("send code=%d\n", code);
  WiFi.disconnect(true);
  delay(SAMPLE_INTERVAL_SECONDS * 1000UL);
}
