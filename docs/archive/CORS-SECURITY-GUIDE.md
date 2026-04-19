# CORS Security Guide - CAUA

## Configuración CORS para tu stack

**Frontend:** React 18 + Vite en `https://cacaofrutabrutal.com`
**Backend:** Supabase Edge Functions

---

## 1. Dominios Permitidos

Actualiza `supabase/functions/cors-config.ts`:

```typescript
const ALLOWED_ORIGINS = [
  'http://localhost:3000',                // Desarrollo local
  'http://localhost:5173',                // Vite fallback
  'https://cacaofrutabrutal.com',         // Producción
  'https://www.cacaofrutabrutal.com',     // www
  'https://staging.cacaofrutabrutal.com', // Staging (opcional)
];
```

---

## 2. Usar CORS en Edge Functions

### Método 1: Manual en cada función

```typescript
// supabase/functions/create-stripe-checkout/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { getCorsHeaders, handleCorsPreFlight } from '../cors-config.ts'

serve(async (req) => {
  const origin = req.headers.get('origin') || ''

  // ✓ Maneja preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight(origin)
  }

  try {
    // ... tu lógica
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          ...getCorsHeaders(origin),
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      {
        status: 500,
        headers: getCorsHeaders(origin)
      }
    )
  }
})
```

### Método 2: Wrapper (Más limpio)

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { withCors } from '../cors-config.ts'

const handler = async (req: Request) => {
  // Tu lógica aquí, sin preocuparte por CORS
  return new Response(JSON.stringify({ success: true }))
}

serve(withCors(handler))
```

---

## 3. Frontend - Hacer Requests Seguros

### Sin Token (Public endpoints)

```typescript
// src/lib/api.ts
export async function fetchFromAPI(
  endpoint: string,
  options?: RequestInit
) {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  const response = await fetch(`${baseUrl}/functions/v1${endpoint}`, {
    ...options,
    credentials: 'include', // ✓ Envía cookies si existen
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`)
  }

  return response.json()
}

// Uso:
const checkout = await fetchFromAPI('/create-stripe-checkout', {
  method: 'POST',
  body: JSON.stringify({ technology_id: 'tech-1', lots_count: 1 })
})
```

### Con JWT Token (Protected endpoints)

```typescript
export async function fetchFromAPIWithAuth(
  endpoint: string,
  token: string,
  options?: RequestInit
) {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL

  const response = await fetch(`${baseUrl}/functions/v1${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // ✓ JWT Token
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`)
  }

  return response.json()
}

// Uso en componente:
const { user } = useAuth()
const session = await user?.getSession()

const result = await fetchFromAPIWithAuth(
  '/create-stripe-checkout',
  session?.access_token || '',
  {
    method: 'POST',
    body: JSON.stringify({ technology_id: 'tech-1' })
  }
)
```

---

## 4. Verificar CORS está Funcionando

### En DevTools (Chrome/Firefox)

```
1. Abre DevTools (F12)
2. Network tab
3. Haz una request al API (POST, PUT, DELETE)
4. Busca la request OPTIONS (preflight)

✓ CORRECTO:
┌─────────────────────────────────────────┐
│ Request:                                 │
│ OPTIONS /functions/v1/create-stripe-... │
│ Origin: https://cacaofrutabrutal.com   │
│                                         │
│ Response Headers:                       │
│ ✓ Access-Control-Allow-Origin:         │
│   https://cacaofrutabrutal.com         │
│ ✓ Access-Control-Allow-Methods:        │
│   GET, POST, PUT, DELETE, PATCH        │
│ ✓ Access-Control-Allow-Headers:        │
│   Content-Type, Authorization, ...     │
│ ✓ Access-Control-Allow-Credentials:    │
│   true                                 │
└─────────────────────────────────────────┘

❌ ERROR:
"Access to XMLHttpRequest at 'https://api.cacaofrutabrutal.com' 
 from origin 'https://miapp.com' has been blocked by CORS policy"
 
 → Significa: Tu dominio NO está en ALLOWED_ORIGINS
```

### Con cURL

```bash
# Simula un preflight request desde tu dominio
curl -i -X OPTIONS https://cacaofrutabrutal.com/functions/v1/create-stripe-checkout \
  -H "Origin: https://cacaofrutabrutal.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type, authorization"

# Respuesta esperada:
# HTTP/1.1 204 No Content
# Access-Control-Allow-Origin: https://cacaofrutabrutal.com ✓
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH ✓
```

### JavaScript Console Test

```javascript
// En la consola de tu browser en https://cacaofrutabrutal.com

fetch('https://cacaofrutabrutal.com/functions/v1/award-tokens', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer tu-token-aqui'
  },
  body: JSON.stringify({ event_type: 'ritual_draw' })
})
  .then(r => r.json())
  .then(d => console.log('✓ CORS OK:', d))
  .catch(e => console.error('❌ CORS Error:', e.message))
```

---

## 5. Escenarios de Seguridad

### ✓ PERMITIDO - Request desde dominio autorizado

```javascript
// En https://cacaofrutabrutal.com:
fetch('https://cacaofrutabrutal.com/functions/v1/create-stripe-checkout', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer token' }
})
// ✓ CORS headers incluyen:
// Access-Control-Allow-Origin: https://cacaofrutabrutal.com
// → Request permitida
```

### ❌ BLOQUEADO - Request desde dominio no autorizado

```javascript
// En https://atacante.com:
fetch('https://cacaofrutabrutal.com/functions/v1/create-stripe-checkout', {
  method: 'POST',
  body: JSON.stringify({ hack: true })
})
// ❌ Error: CORS policy blocked
// El servidor responde con:
// Access-Control-Allow-Origin: (vacío o distinto)
// El navegador RECHAZA la response
// JavaScript NO puede leer los datos
```

### ❌ BLOQUEADO - Wildcard origin

```typescript
// ✗ NUNCA hagas esto:
res.setHeader('Access-Control-Allow-Origin', '*')
// Cualquiera puede acceder desde cualquier lado
```

---

## 6. Problemas Comunes y Soluciones

### Problema: "CORS policy: No 'Access-Control-Allow-Origin' header"

```
Causa: Tu dominio NO está en ALLOWED_ORIGINS
Solución: Agrega tu dominio a cors-config.ts
```

### Problema: "CORS policy: Credentials mode is 'include' but..."

```
Causa: Usas credentials: true pero origin es * (wildcard)
Solución: NUNCA uses * si usas credentials
```

### Problema: "Preflight request failed"

```
Causa: No manejas OPTIONS requests
Solución: Agrega handleCorsPreFlight(origin) en tu edge function
```

### Problema: Funciona en localhost pero no en producción

```
Causa: ALLOWED_ORIGINS solo tiene localhost
Solución: Agrega tus dominios de producción (https://...)
```

---

## 7. Headers CORS Explicados

| Header | Propósito |
|--------|-----------|
| `Access-Control-Allow-Origin` | Qué dominios pueden acceder |
| `Access-Control-Allow-Methods` | Qué métodos HTTP (GET, POST, etc) |
| `Access-Control-Allow-Headers` | Qué headers pueden enviar |
| `Access-Control-Allow-Credentials` | Si se envían cookies/auth |
| `Access-Control-Max-Age` | Cachea preflight por X segundos |

---

## 8. Checklist de Deployment

- [ ] Actualizar `ALLOWED_ORIGINS` con tu dominio de producción
- [ ] Remover localhost de producción
- [ ] Usar HTTPS en todos los dominios
- [ ] Probar preflight con cURL
- [ ] Verificar Network tab en DevTools
- [ ] Probar con credenciales (JWT tokens)
- [ ] Revisar logs de Supabase para CORS errors

---

## 9. Ejemplo Completo: Crear Orden

### Frontend Component

```typescript
// src/components/InvestModal.tsx
import { useAuth } from '../context/AuthContext'

export default function InvestModal() {
  const { user } = useAuth()

  const handleCheckout = async () => {
    if (!user) return

    const session = await user.getSession()
    if (!session) return

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-stripe-checkout`,
        {
          method: 'POST',
          credentials: 'include', // ✓ Envía cookies
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`, // ✓ JWT
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            technology_id: 'tech-1',
            lots_count: 1,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`)
      }

      const { url } = await response.json()
      window.location.href = url // Redirige a Stripe
    } catch (error) {
      console.error('Checkout error:', error)
    }
  }

  return <button onClick={handleCheckout}>Pagar con Stripe</button>
}
```

### Edge Function

```typescript
// supabase/functions/create-stripe-checkout/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../cors-config.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)

serve(async (req) => {
  const origin = req.headers.get('origin') || ''

  // ✓ Maneja preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight(origin)
  }

  try {
    const { technology_id, lots_count } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verifica JWT
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(jwt!)
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: getCorsHeaders(origin) }
      )
    }

    // Crea sesión de Stripe
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: 50000, // $500
          product_data: { name: 'CAUA Lot Investment' },
        },
        quantity: lots_count,
      }],
      metadata: { user_id: user.id, technology_id },
      success_url: `https://cacaofrutabrutal.com/fund?status=success`,
      cancel_url: `https://cacaofrutabrutal.com/fund?status=cancelled`,
    })

    // Crea orden en DB
    await supabase.from('orders').insert({
      user_id: user.id,
      technology_id,
      lots_count,
      stripe_session_id: session.id,
      amount_cents: 50000 * lots_count,
      status: 'pending',
      payment_provider: 'stripe',
    })

    // ✓ Retorna con CORS headers
    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: {
          ...getCorsHeaders(origin),
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: getCorsHeaders(origin),
      }
    )
  }
})
```

---

## 🎯 Resumen

✅ **Dominios permitidos** → Solo HTTPS, lista whitelist explícita
✅ **Preflight OPTIONS** → Manejado automáticamente
✅ **Credentials** → `credentials: 'include'` en fetch + `Access-Control-Allow-Credentials: true`
✅ **JWT Tokens** → Envía en header `Authorization: Bearer token`
✅ **Testing** → Verifica en Network tab + cURL

**NUNCA:**
- ❌ Usar `Access-Control-Allow-Origin: *` con credentials
- ❌ Confiar en origin del cliente (siempre verificar en servidor)
- ❌ Exponer secrets en cliente (siempre en edge functions)
