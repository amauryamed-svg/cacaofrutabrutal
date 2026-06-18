# CDP Onramp — Deploy Checklist
Fecha: 2026-06-17 | Contexto: responder a CDP Support (caso abierto desde 2026-04-29)

## Objetivo
Desplegar `coinbase-onramp-session` con secrets reales y enviar evidencia de integración al equipo CDP.

---

## Paso 1 — Obtener CDP API keys

1. Ir a https://portal.cdp.coinbase.com
2. Seleccionar el proyecto (App ID: `69f4de157c4c8997912c20ac`)
3. Ir a **Settings → API Keys → + Create API key**
4. Nombre: `cacaofrutabrutal-onramp`
5. Permissions: marcar **Onramp** (si aparece como scope separado) o **All developer platform APIs**
6. Click **Create & download** → guarda el `.json`

El JSON tiene este formato (nuevas claves Ed25519, formato 2025+):
```json
{
  "name": "organizations/<org>/apiKeys/<uuid>",
  "id":   "<uuid>",
  "privateKey": "<base64-encoded-ed25519-seed>"
}
```

- `CDP_API_KEY_NAME` = el campo `id` (UUID)
- `CDP_API_KEY_SECRET` = el campo `privateKey` (base64 seed)

> Si el JSON tiene `-----BEGIN EC PRIVATE KEY-----` en `privateKey`, es legacy ECDSA.
> La Edge Function detecta el formato automáticamente.

---

## Paso 2 — Configurar secrets en Supabase

```bash
cd ~/Documents/Caua/repos/cacaofrutabrutal

npx supabase secrets set \
  CDP_API_KEY_NAME="<id-del-json>" \
  CDP_API_KEY_SECRET="<privateKey-del-json>"
```

Verificar:
```bash
npx supabase secrets list
# Debe mostrar CDP_API_KEY_NAME y CDP_API_KEY_SECRET
```

---

## Paso 3 — Deploy de la Edge Function

```bash
npx supabase functions deploy coinbase-onramp-session
```

Test smoke (reemplaza `<JWT>` con un token de usuario válido):
```bash
curl -X POST \
  https://kjygovuiphbxcdxeduco.supabase.co/functions/v1/coinbase-onramp-session \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -H "apikey: <ANON_KEY>" \
  -d '{"asset":"USDC","preset_usd":5}'
```

Respuesta esperada:
```json
{
  "ok": true,
  "session_token": "...",
  "onramp_url": "https://pay.coinbase.com/buy?sessionToken=..."
}
```

Si ves `"error": "cdp_api_key_not_configured"` → los secrets no se propagaron todavía (espera ~30s y reintenta).

---

## Paso 4 — Seed del test account en Supabase

1. Ir a https://supabase.com/dashboard/project/kjygovuiphbxcdxeduco
2. **Authentication → Users** → confirmar que `cauacdpreview@gmail.com` existe (si no, loguéate en la app con ese email primero)
3. **SQL Editor** → pegar y ejecutar `scripts/seed-cdp-reviewer.sql`
4. Verificar que el output muestra `kyc_tier=1` y el wallet address correcto

---

## Paso 5 — Grabar el Loom

Flujo mínimo que el equipo CDP necesita ver:

1. Login con `cauacdpreview@gmail.com` (Google OAuth)
2. Navegar a https://cacaofrutabrutal.com/app/web3
3. Click en **"BUY USDC WITH CARD · BASE SEPOLIA"**
4. DevTools → Network → mostrar el POST a `coinbase-onramp-session` → response `{ ok: true, session_token: "...", onramp_url: "..." }`
5. Confirmar que la URL del popup **NO tiene `addresses=` ni `walletAddress=`**
6. Failure gate: logout → click botón → `login_required`
7. (Opcional) cuenta sin KYC → `kyc_required`

---

## Paso 6 — Enviar respuesta a CDP Support

Abrir `docs/cdp-reply-jun17.md`, reemplazar `[PASTE LOOM URL HERE]` con la URL de Loom, y enviar via el Support Hub case.

---

## Estado al 2026-06-17

| Item | Estado |
|------|--------|
| Edge Function código | ✅ Completo |
| `config.toml` entry | ✅ Añadido (este commit) |
| CDP API keys | ⏳ Pendiente — generar en portal |
| Supabase secrets | ⏳ Pendiente — correr `secrets set` |
| Function deployed | ⏳ Pendiente — correr `functions deploy` |
| Test account seeded | ⏳ Pendiente — correr SQL seed |
| Loom grabado | ⏳ Pendiente — grabar |
| Reply enviado | ⏳ Pendiente — enviar |
