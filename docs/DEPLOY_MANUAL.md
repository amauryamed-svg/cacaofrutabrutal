# 🚀 Deploy Manual: CATACIÓN

Para completar el setup necesitas:
1. **Supabase Access Token** (para autenticación CLI)
2. **Ejecutar 2 comandos**

---

## Paso 1: Obtener Supabase Access Token

### Opción A: Via Supabase Dashboard (30 segundos)
1. Ve a https://app.supabase.com
2. Click en tu avatar (arriba a la derecha)
3. **Preferences** → **Access Tokens**
4. Click **Generate new token**
5. Nombre: `catacion-deploy`
6. Copia el token (aparece una sola vez)

### Opción B: Via CLI (si tienes cuenta)
```bash
npx supabase login
# Te abrirá un navegador para autenticarte
# Automáticamente guardará el token
```

---

## Paso 2: Ejecutar Deploy

Una vez tengas el token, ejecuta en la terminal (reemplaza `YOUR_TOKEN`):

### En Windows (PowerShell):
```powershell
$env:SUPABASE_ACCESS_TOKEN = "YOUR_TOKEN"
cd "C:\Users\amaur\OneDrive\Desktop\CAUA2.0"
npx supabase link --project-ref kjygovuiphbxcdxeduco
npx supabase db push
npx supabase functions deploy notify-catacion-lead
```

### En Mac/Linux (Bash):
```bash
export SUPABASE_ACCESS_TOKEN="YOUR_TOKEN"
cd /path/to/CAUA2.0
npx supabase link --project-ref kjygovuiphbxcdxeduco
npx supabase db push
npx supabase functions deploy notify-catacion-lead
```

---

## Qué hace cada comando

| Comando | Qué hace |
|---------|----------|
| `npx supabase link ...` | Vincula tu proyecto local a Supabase cloud |
| `npx supabase db push` | Ejecuta la migración SQL (crea tabla `catacion_leads`) |
| `npx supabase functions deploy ...` | Depliegua la Edge Function (notify-catacion-lead) |

---

## Verificar que funcionó

Después de ejecutar los comandos:

### ✅ Verificación 1: Tabla SQL
1. Ve a https://app.supabase.com → tu proyecto
2. **Table Editor** → busca `catacion_leads`
3. Deberías ver la tabla con columnas: `id`, `email`, `full_name`, `status`, `source`, `created_at`, `updated_at`

### ✅ Verificación 2: Edge Function
1. Ve a https://app.supabase.com → tu proyecto
2. **Edge Functions** → busca `notify-catacion-lead`
3. Deberías ver el estado **"Deployed"** en verde

### ✅ Verificación 3: Funcionamiento
```bash
npm run dev
# Abre http://localhost:3002/catacion
```

Rellena el formulario:
- Nombre: Test User
- Email: tu_email@example.com

Debería:
1. ✅ Guardar el lead en `catacion_leads`
2. ✅ Enviar magic link OTP al email
3. ✅ Enviar notificación a amaury@cauaculture.co

---

## Si algo falla

### Error: "Access token not provided"
**Solución:** No configuraste correctamente la variable de entorno
```bash
# Verifica que el token está configurado:
echo $SUPABASE_ACCESS_TOKEN  # Deberías ver el token

# Si no sale nada, repite:
export SUPABASE_ACCESS_TOKEN="tu_token_aqui"
```

### Error: "Project not found"
**Solución:** El PROJECT_ID es incorrecto
```bash
# Verifica el ID correcto en la URL de tu proyecto:
# https://app.supabase.com/project/[PROJECT_ID]/

# Debería ser: kjygovuiphbxcdxeduco
```

### Error: "Migration failed"
**Solución A:** Ejecuta manualmente en Supabase Studio
1. Ve a https://app.supabase.com/project/kjygovuiphbxcdxeduco
2. **SQL Editor** → **New query**
3. Copia el contenido de `supabase/migrations/008_catacion_leads.sql`
4. Ejecuta

**Solución B:** Usa psql directamente (si tienes acceso a la DB)
```bash
psql "postgresql://user:password@db.supabase.co:5432/postgres" < supabase/migrations/008_catacion_leads.sql
```

### Error: "Function deployment failed"
**Solución A:** Depliegua manualmente
1. Ve a https://app.supabase.com/project/kjygovuiphbxcdxeduco
2. **Edge Functions** → **Create new**
3. Nombre: `notify-catacion-lead`
4. Copia el contenido de `supabase/functions/notify-catacion-lead/index.ts`
5. Click **Deploy**

**Solución B:** Verifica que RESEND_API_KEY está en variables de entorno
```bash
# En Supabase Studio → Settings → Edge Functions
# Agrega: RESEND_API_KEY = tu_key
```

---

## Quick Copy-Paste (Windows PowerShell)

```powershell
# 1. Reemplaza YOUR_TOKEN con tu token
$token = "YOUR_TOKEN"

# 2. Configura variable de entorno
$env:SUPABASE_ACCESS_TOKEN = $token

# 3. Navega al proyecto
cd "C:\Users\amaur\OneDrive\Desktop\CAUA2.0"

# 4. Ejecuta los comandos
npx supabase link --project-ref kjygovuiphbxcdxeduco
npx supabase db push
npx supabase functions deploy notify-catacion-lead

# 5. Verifica
npm run dev
# Abre http://localhost:3002/catacion
```

---

## Próximos pasos (después de deploy exitoso)

1. ✅ Tabla creada (`catacion_leads`)
2. ✅ Edge Function deployada (`notify-catacion-lead`)
3. 🔄 **npm run dev** y test en `/catacion`
4. 📧 Verifica formulario + magic link + email de notificación

---

**¿Necesitas ayuda?** Ver `CATACION_SETUP.md` para guía completa.
