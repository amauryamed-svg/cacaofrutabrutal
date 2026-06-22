# Setup: Página CATACIÓN

La página `/catacion` está lista para usar. Faltan dos pasos finales para completar el setup:

## 1. Ejecutar Migración SQL

Crea la tabla `catacion_leads` en Supabase:

### Opción A: Via Supabase Studio Dashboard
1. Abre https://app.supabase.com → tu proyecto
2. Ve a **SQL Editor** → **New query**
3. Copia y pega el contenido de:
   ```
   supabase/migrations/008_catacion_leads.sql
   ```
4. Ejecuta la query

### Opción B: Via CLI
```bash
supabase db push
```

**Resultado:** Tabla `catacion_leads` creada con RLS y índices.

---

## 2. Desplegar Edge Function

Despliega `notify-catacion-lead` que envía notificaciones a amaury@cauacolombia.co:

### Opción A: Via Dashboard (recomendado)
1. Ve a https://app.supabase.com → tu proyecto → **Edge Functions**
2. Click **Create a new function**
3. Nombre: `notify-catacion-lead`
4. Copia el contenido de:
   ```
   supabase/functions/notify-catacion-lead/index.ts
   ```
5. Pega en el editor del dashboard
6. Click **Deploy**

### Opción B: Via CLI (requiere autenticación)
```bash
# Login a Supabase (requerido una sola vez)
npx supabase login

# Desplegar la función
npx supabase functions deploy notify-catacion-lead
```

**Resultado:** Edge Function disponible en `https://{project-id}.supabase.co/functions/v1/notify-catacion-lead`

---

## 3. Verificar Setup (después de arriba)

### Test formulario localmente
```bash
npm run dev
# Abre http://localhost:3002/catacion
```

1. **Rellena el formulario:**
   - Nombre: "Test User"
   - Email: tu@email.com

2. **Verifica:**
   - ✓ `catacion_leads` se insertó en Supabase Studio → tabla `catacion_leads`
   - ✓ Magic link OTP llegó al email
   - ✓ Email de notificación en amaury@cauacolombia.co con detalles del lead

3. **Haz clic en el magic link:**
   - Deberías ser autenticado en `/catacion`
   - Sesión activa en Supabase Auth

4. **Descarga PDF:**
   - Click en "⬇ DESCARGAR PDF"
   - Abre `/cinco-tiempos` en nueva tab
   - Abre el print dialog (Ctrl+P / ⌘+P)
   - Genera PDF A4

---

## Arquitectura

```
/catacion (ruta pública)
  ↓
Formulario (Nombre + Email)
  ↓ [submit]
  ├→ INSERT catacion_leads (Supabase, RLS public)
  ├→ Magic Link OTP (Supabase Auth signInWithOtp)
  └→ notify-catacion-lead() [Edge Function]
      ↓
      Email a amaury@cauacolombia.co [Resend]

User cliquea magic link
  ↓
Sesión activa en /catacion
  ↓ [Perfil creado automáticamente en user_profiles]
```

---

## Archivos creados/modificados

| Acción | Archivo |
|--------|---------|
| ✅ CREAR | `src/pages/Catacion.tsx` |
| ✅ CREAR | `supabase/migrations/008_catacion_leads.sql` |
| ✅ CREAR | `supabase/functions/notify-catacion-lead/index.ts` |
| ✅ MODIFICAR | `src/App.tsx` — ruta `/catacion` |
| ✅ CREAR | `src/assets/logo-caua.svg` |
| ✅ CREAR | `src/pages/CincoTiemposProposal.tsx` |
| ✅ CREAR | `CincoTiemposCacao.html` |

---

## Compilación TypeScript

Los siguientes errores pre-existentes no bloquean el deploy:
- `CacaoTreeCard.tsx` — issues en componente existente
- `vite.config.ts` — config issue

Mi código (`Catacion.tsx`) compila sin errores. Para limpiar:
```bash
# Arreglaar los issues pre-existentes (opcional)
npm run build --noError
# O desplegar manualmente en Vercel
```

---

## Troubleshooting

### Magic link no llega
- ✓ Verifica spam/promotions en el email
- ✓ Supabase Auth debe tener `SMTP_ADMIN_EMAIL` configurado
- ✓ `RESEND_API_KEY` debe estar en Supabase environment vars

### Email de notificación no llega a amaury@
- ✓ Edge Function debe estar deployada
- ✓ `RESEND_API_KEY` debe estar en Supabase environment vars
- ✓ Verifica los logs de la Edge Function en Supabase Studio

### PDF no genera
- ✓ La página `/cinco-tiempos` debe estar accesible
- ✓ Usa Ctrl+P (Windows/Linux) o ⌘+P (Mac)
- ✓ Selecciona "Guardar como PDF" y márgenes "Ninguno"

---

## Quick Start Checklist

- [ ] Ejecutar migración SQL 008_catacion_leads.sql
- [ ] Desplegar Edge Function notify-catacion-lead
- [ ] `npm run dev` y verificar `/catacion` carga
- [ ] Completar test del formulario (ver Verificar Setup arriba)
- [ ] Confirmar magic link y email de notificación funcionan
- [ ] Descargar PDF y verificar A4 correcto

---

Generated from `/c/Users/amaur/OneDrive/Desktop/CAUA2.0/CATACION_SETUP.md`
