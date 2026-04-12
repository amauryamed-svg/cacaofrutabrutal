# Security Headers Guide - CAUA

## Overview

Configuración completa de security headers para CAUA en Vite + Vercel + Supabase Edge Functions.

---

## 1. Headers Explicados (Una oración cada uno)

| Header | Qué hace | Valor |
|--------|----------|-------|
| **X-Frame-Options** | Previene que otros sitios metan tu app en un iframe falso (clickjacking) | `SAMEORIGIN` |
| **Content-Security-Policy** | Controla qué recursos (scripts, imágenes, estilos) pueden cargar en tu página | `default-src 'self'` + granular |
| **X-Content-Type-Options** | Dice al navegador "no adivines el tipo de archivo", solo usa lo que el servidor diga | `nosniff` |
| **Strict-Transport-Security** | Fuerza HTTPS siempre, durante 1 año, incluso subdominios | `max-age=31536000; includeSubDomains` |
| **Referrer-Policy** | Controla qué información del sitio anterior se envía cuando navegas a otro lugar | `strict-origin-when-cross-origin` |
| **Permissions-Policy** | Deshabilita acceso a cámara, micrófono, ubicación, pagos a menos que los necesites | `geolocation=(), microphone=(), camera=()` |
| **X-XSS-Protection** | Activar protección anti-XSS del navegador (defensa extra) | `1; mode=block` |

---

## 2. Configuración por Ambiente

### 🔧 Desarrollo Local (Vite)

El archivo `vite.config.security-headers.ts` ya incluye:
- `unsafe-inline` para scripts/estilos (necesario para Vite HMR)
- localhost:* en connect-src (para conexiones locales)

```bash
npm run dev
# Los headers se aplican automáticamente
```

### 🚀 Producción (Vercel)

El archivo `vercel.json` contiene:
- Headers más restrictivos (sin unsafe-inline)
- Stripe, MercadoPago, Resend en whitelist
- Cache control por rutas

```bash
git push
# Deploy automático a Vercel con headers
```

---

## 3. Content-Security-Policy Detallado

Tu CSP actual permite:

```
default-src 'self'
  ↳ Por defecto, solo recursos de tu dominio

script-src 'self'
  ↳ Scripts SOLO de tu dominio, nada de inline ni eval

img-src 'self' https: data:
  ↳ Imágenes de tu dominio, HTTPS, o data URLs

style-src 'self' 'unsafe-inline'
  ↳ Estilos de tu dominio + inline (necesario para Vite)

font-src 'self' https://fonts.googleapis.com ...
  ↳ Fuentes de tu dominio + Google Fonts

connect-src 'self' https://api.cacaofrutabrutal.com ...
  ↳ Conexiones AJAX/fetch/WebSocket a:
     - Tu propio dominio
     - Tu API (api.cacaofrutabrutal.com)
     - Stripe API
     - MercadoPago API
     - Resend API

object-src 'none'
  ↳ Bloquea <object>, <embed>, <applet>

base-uri 'self'
  ↳ <base> solo puede apuntar a tu dominio

form-action 'self'
  ↳ Formularios solo pueden enviar a tu dominio
```

---

## 4. Servicios Externos Permitidos

Ya configurados en CSP:

✅ **Stripe:** `https://api.stripe.com`
✅ **MercadoPago:** `https://api.mercadopago.com`
✅ **Resend:** `https://api.resend.com`
✅ **Google Fonts:** `https://fonts.googleapis.com`, `https://fonts.gstatic.com`

### Si necesitas agregar más:

```json
// En vercel.json, modifica el Content-Security-Policy:
"connect-src 'self' 
  https://api.cacaofrutabrutal.com 
  https://api.stripe.com 
  https://api.mercadopago.com 
  https://api.resend.com
  https://analytics.google.com    ← Nuevo: Google Analytics
  https://sentry.io               ← Nuevo: Sentry error tracking
"
```

### Google Analytics específicamente:

```json
"script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com"
```

---

## 5. Verificar Headers en Producción

### Opción 1: Chrome DevTools

```
1. Abre tu sitio: https://cacaofrutabrutal.com
2. DevTools (F12) → Network tab
3. Haz click en la request principal (el HTML)
4. Response Headers → busca:
   ✓ X-Frame-Options: SAMEORIGIN
   ✓ Content-Security-Policy: ...
   ✓ Strict-Transport-Security: ...
```

### Opción 2: cURL Terminal

```bash
# Desde tu terminal
curl -i https://cacaofrutabrutal.com

# Busca en Response headers:
HTTP/1.1 200 OK
x-frame-options: SAMEORIGIN
content-security-policy: default-src 'self'; ...
x-content-type-options: nosniff
strict-transport-security: max-age=31536000; includeSubDomains
referrer-policy: strict-origin-when-cross-origin
permissions-policy: geolocation=(), microphone=(), camera=()
```

### Opción 3: Herramienta Online

```
https://securityheaders.com/
→ Paste tu URL: https://cacaofrutabrutal.com
→ Te muestra qué headers faltan (score A-F)
```

### Opción 4: Browser Console

```javascript
// En la consola de https://cacaofrutabrutal.com:
fetch(window.location.href)
  .then(r => {
    console.log('Security Headers:')
    console.log('X-Frame-Options:', r.headers.get('x-frame-options'))
    console.log('CSP:', r.headers.get('content-security-policy'))
    console.log('HSTS:', r.headers.get('strict-transport-security'))
  })
```

---

## 6. Edge Functions + Security Headers

Para aplicar headers a tus edge functions:

```typescript
// supabase/functions/create-stripe-checkout/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { addSecurityHeaders } from '../security-headers-middleware.ts'

const handler = async (req: Request) => {
  // Tu lógica...
  return new Response(JSON.stringify({ url: 'https://...' }))
}

// ✓ Agrega security headers automáticamente
serve(async (req) => {
  const response = await handler(req)
  return addSecurityHeaders(response)
})
```

---

## 7. CSP Violations - Debugging

Si ves errores de CSP en la consola:

```
"Refused to load the script 'https://example.com/script.js' 
 because it violates the following Content Security Policy directive"
```

### Solución:

1. **Identifica la URL bloqueada:** `https://example.com/script.js`
2. **Agrega a CSP** (en vercel.json):
   ```json
   "script-src 'self' https://example.com"
   ```
3. **Redeploy** y limpia caché

### Ejemplo real - Stripe SDK:

```javascript
// ❌ Genera error CSP si no está permitido:
<script src="https://js.stripe.com/v3/"></script>

// ✓ Solución - agregar a CSP:
"script-src 'self' https://js.stripe.com"
```

---

## 8. Testing de Seguridad

### Test 1: Verificar X-Frame-Options

```html
<!-- En otro sitio, intenta meter tu app en iframe -->
<iframe src="https://cacaofrutabrutal.com"></iframe>

<!-- Resultado esperado en console: -->
<!-- "Refused to display 'https://cacaofrutabrutal.com/' 
     in a frame because it set 'X-Frame-Options' to 'SAMEORIGIN'" -->
<!-- ✓ Correcto - clickjacking prevenido -->
```

### Test 2: Verificar CSP

```javascript
// En console de https://cacaofrutabrutal.com:

// ❌ Intenta cargar script bloqueado:
const img = new Image()
img.src = 'https://atacante.com/image.jpg'
// Error: CSP bloquea connect-src a otro dominio

// ✓ Carga permitida:
const img2 = new Image()
img2.src = 'https://cacaofrutabrutal.com/logo.png'
// ✓ Funciona
```

### Test 3: Verificar HSTS

```bash
# Accede via HTTP (no HTTPS)
curl -i http://cacaofrutabrutal.com

# Resultado esperado:
# HTTP/1.1 307 Temporary Redirect
# Location: https://cacaofrutabrutal.com
# Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## 9. Checklist de Deployment

- [ ] `vercel.json` con security headers
- [ ] `security-headers-middleware.ts` en edge functions
- [ ] `vite.config.security-headers.ts` para desarrollo
- [ ] `vite.config.ts` actualizado
- [ ] Verificar headers con `securityheaders.com`
- [ ] Stripe/MercadoPago/Resend en CSP whitelist
- [ ] Sin `unsafe-eval` en script-src
- [ ] HSTS con max-age mínimo 1 año
- [ ] Test de clickjacking (X-Frame-Options)
- [ ] Test de CSP violations

---

## 10. Headers por Ruta (Vercel)

Tu configuración tiene headers específicos por ruta:

```json
// Rutas de autenticación - sin cache
"/api/auth/*" → Cache-Control: no-store, must-revalidate

// Rutas de API - cache 1 hora
"/api/*" → Cache-Control: public, s-maxage=3600

// Assets estáticos - cache 1 año (inmutable)
"/static/*" → Cache-Control: public, max-age=31536000, immutable
```

---

## 11. Troubleshooting

### "CSP blocks image load"
```
Causa: Imagen de dominio no permitido
Solución: Agregar dominio a img-src en CSP
```

### "Script not executing"
```
Causa: Script bloqueado por script-src
Solución: Agregar dominio a script-src O cambiar a async/defer
```

### "HSTS preload errors"
```
Causa: Dominio no en HSTS preload list
Solución: Visita https://hstspreload.org y agrega tu dominio
```

### "Subdomain not using HTTPS"
```
Causa: HSTS no incluye subdomains
Solución: Usar "max-age=31536000; includeSubDomains; preload"
```

---

## 12. Puntuación Final Esperada

Con esta configuración, deberías obtener en `securityheaders.com`:

```
X-Frame-Options              ✓ A
X-Content-Type-Options       ✓ A
X-XSS-Protection            ✓ A
Content-Security-Policy     ✓ A
Referrer-Policy             ✓ A
Strict-Transport-Security   ✓ A
Permissions-Policy          ✓ A
Expected-CT                 ⚠ C (opcional)

Overall Score: A (95/100+)
```

---

## 13. Next Steps

1. Verifica headers con `curl -i https://cacaofrutabrutal.com`
2. Si ves CSP errors, agrega a whitelist en vercel.json
3. Redeploy y limpia caché del navegador
4. Usa securityheaders.com para validar

**¿Necesitas un header adicional?** Pregunta y actualizo la configuración.
