---
tags: [warm, security, cors, headers]
---
# Seguridad — Headers + CORS

> Referencias completas: [[../archive/CORS-SECURITY-GUIDE.md]] · [[../archive/SECURITY-HEADERS-GUIDE.md]]

## Headers de Seguridad

Configurados en `vercel.json` (fuente de verdad). Ya aplicados en producción.

| Header | Valor | Propósito |
|--------|-------|-----------|
| `X-Frame-Options` | `SAMEORIGIN` | Previene clickjacking |
| `X-Content-Type-Options` | `nosniff` | Previene MIME sniffing |
| `X-XSS-Protection` | `1; mode=block` | XSS filter legacy |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Privacy |
| `HSTS` | `max-age=31536000; includeSubDomains; preload` | HTTPS forzado |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=(), payment=()` | Feature lockdown |

## CSP — Orígenes Permitidos

```
script-src:  'self' + https://js.hs-scripts.com
img-src:     'self' + https: + data:
style-src:   'self' + 'unsafe-inline' + fonts.googleapis.com
font-src:    fonts.googleapis.com + fonts.gstatic.com
connect-src: 'self'
             + kjygovuiphbxcdxeduco.supabase.co
             + api.cacaofrutabrutal.com
             + api.stripe.com
             + api.mercadopago.com
             + api.resend.com
             + api.open-meteo.com
             + js.hs-scripts.com
object-src:  'none'
```

## CORS en Edge Functions

Usar el helper centralizado (ya implementado):
```typescript
import { corsHeaders } from '../cors-config.ts'
// Responde OPTIONS con: corsHeaders
// Incluye en toda respuesta: { headers: corsHeaders }
```

Orígenes permitidos en producción: `https://cacaofrutabrutal.com`, `https://www.cacaofrutabrutal.com`
En desarrollo agregar: `http://localhost:3000`

## Cache por Ruta (vercel.json)

| Ruta | Cache |
|------|-------|
| `/catacion/*` | `no-cache, must-revalidate` |
| `/api/auth/*` | `no-store` |
| `/api/*` | `public, s-maxage=3600` |
| `/static/*` | `immutable, max-age=31536000` |
