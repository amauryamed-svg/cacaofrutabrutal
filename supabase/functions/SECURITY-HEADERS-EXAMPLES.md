# Security Headers en Edge Functions - Ejemplos

## Patrón 1: Wrapper Simple (Recomendado)

```typescript
// supabase/functions/award-tokens/index.ts
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { withSecurityHeaders } from '../security-headers-middleware.ts'

const handler = async (req: Request) => {
  // Tu lógica aquí
  return new Response(JSON.stringify({ success: true }))
}

// ✓ Agrega security headers automáticamente
serve(withSecurityHeaders(handler))
```

---

## Patrón 2: Manual con CORS + Security Headers

```typescript
// supabase/functions/send-order-email/index.ts
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { getCorsHeaders, handleCorsPreFlight } from '../cors-config.ts'
import { getSecurityHeaders } from '../security-headers-middleware.ts'

serve(async (req) => {
  const origin = req.headers.get('origin') || ''
  
  // Maneja preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(origin)
    })
  }

  try {
    const body = await req.json()
    
    // Tu lógica aquí
    const result = { success: true }

    // Combina CORS + Security headers
    const headers = new Headers({
      ...getCorsHeaders(origin),
      ...getSecurityHeaders(),
      'Content-Type': 'application/json'
    })

    return new Response(JSON.stringify(result), {
      status: 200,
      headers
    })
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      {
        status: 500,
        headers: {
          ...getCorsHeaders(origin),
          ...getSecurityHeaders()
        }
      }
    )
  }
})
```

---

## Patrón 3: Aplicar a Todos los Edge Functions

### Opción A: Actualizar cada función individualmente

```typescript
// supabase/functions/create-stripe-checkout/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { getCorsHeaders, handleCorsPreFlight } from '../cors-config.ts'
import { getSecurityHeaders } from '../security-headers-middleware.ts'

serve(async (req) => {
  const origin = req.headers.get('origin') || ''

  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight(origin)
  }

  try {
    // ... tu lógica de Stripe ...
    
    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: {
          ...getCorsHeaders(origin),
          ...getSecurityHeaders(),
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      {
        status: 500,
        headers: {
          ...getCorsHeaders(origin),
          ...getSecurityHeaders()
        }
      }
    )
  }
})
```

### Opción B: Super Handler Helper

```typescript
// supabase/functions/super-handler.ts
import { getCorsHeaders } from './cors-config.ts'
import { getSecurityHeaders } from './security-headers-middleware.ts'

export async function superHandler(
  handler: (req: Request) => Promise<Response>,
  req: Request
) {
  const origin = req.headers.get('origin') || ''

  // Maneja preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { ...getCorsHeaders(origin), ...getSecurityHeaders() }
    })
  }

  try {
    const response = await handler(req)
    const headers = new Headers(response.headers)

    // Agrega CORS + Security headers a la respuesta
    Object.entries({
      ...getCorsHeaders(origin),
      ...getSecurityHeaders()
    }).forEach(([k, v]) => {
      if (!headers.has(k)) headers.set(k, v)
    })

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    })
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      {
        status: 500,
        headers: {
          ...getCorsHeaders(origin),
          ...getSecurityHeaders(),
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

// Uso:
// import { superHandler } from '../super-handler.ts'
// serve((req) => superHandler(handler, req))
```

---

## Edge Functions que Necesitan Update

### 1. ✓ create-stripe-checkout
- Status: Tiene CORS, necesita Security Headers
- Acción: Agregar `getSecurityHeaders()`

### 2. ✓ create-mp-preference
- Status: Tiene CORS, necesita Security Headers
- Acción: Agregar `getSecurityHeaders()`

### 3. ✓ stripe-webhook
- Status: Tiene validación de firma
- Acción: Agregar headers en respuesta

### 4. ✓ award-tokens
- Status: Nuevo, todavía sin headers
- Acción: Usar `withSecurityHeaders(handler)`

### 5. ✓ send-order-email
- Status: Nuevo, necesita CORS + Security Headers
- Acción: Usar `superHandler`

---

## Testing de Edge Functions

```bash
# Test local (Si tienes Supabase CLI)
supabase functions serve

# En otra terminal:
curl -X OPTIONS http://localhost:54321/functions/v1/award-tokens \
  -H "Origin: https://cacaofrutabrutal.com"

# Deberías ver:
# HTTP/1.1 204 No Content
# x-frame-options: SAMEORIGIN
# content-security-policy: ...
# strict-transport-security: ...
```

---

## Verifica en Supabase Dashboard

1. Supabase → Project → Functions
2. Click en una función (ej: award-tokens)
3. Invoke → Check response headers

Deberías ver los security headers en la respuesta.

---

## CSP Update para Supabase

Si tu CSP es muy restrictivo, agrega Supabase:

```typescript
// En security-headers-middleware.ts:
'connect-src': "'self' https://api.cacaofrutabrutal.com https://*.supabase.co",
```

---

## Summary

- **Patrón 1 (withSecurityHeaders):** Más simple, para funciones sin CORS
- **Patrón 2 (Manual):** Para funciones con CORS + Security Headers
- **Patrón 3 (superHandler):** Para centralizar todo en un solo lugar

**Recomendación:** Usa Patrón 1 para nuevas funciones, Patrón 2 para actualizar existentes.
