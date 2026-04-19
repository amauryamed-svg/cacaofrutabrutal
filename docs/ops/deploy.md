---
tags: [cold, ops, vercel, deploy]
---
# Deploy — Vercel SOP

> Referencia completa: [[../archive/DEPLOY_MANUAL.md]]

## Deploy Estándar

```powershell
# Desde c:\Users\Amaury\Desktop\CAUA CODE\cacaofrutabrutal
# (PowerShell — PATH necesita Node.js manual en esta sesión)
powershell -Command "$env:PATH += ';C:\Program Files\nodejs;C:\Users\Amaury\AppData\Roaming\npm'; vercel --prod --yes"
```

## Proyecto Vercel
- **Nombre:** `caua-mvp`
- **Scope:** `amauryamed-1073s-projects`
- **URL prod:** `https://caua-mvp.vercel.app`
- **Linked en:** `.vercel/` (no commitear)

## Requisito Crítico en vercel.json
```json
"installCommand": "npm install --ignore-scripts"
```
Sin esto, `@playwright/test` y `supabase` CLI fallan con exit 127.

## Variables de Entorno (Vercel Dashboard)

| Variable | Dónde obtener |
|---------|--------------|
| `SUPABASE_URL` | app.supabase.com → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | app.supabase.com → Settings → API (**solo Production**) |
| `CACAO_CRON_SECRET` | `openssl rand -base64 32` (generar una vez) |

## Troubleshooting

| Error | Solución |
|-------|---------|
| `npm install exited with 127` | Agregar `"installCommand": "npm install --ignore-scripts"` a vercel.json |
| `vercel` no reconocido en bash | Usar `vercel.cmd` desde `C:\Users\Amaury\AppData\Roaming\npm\vercel.cmd` |
| Build falla TypeScript | Correr `npm run build` local primero |
| Deploy al proyecto equivocado | Borrar `.vercel/`, re-linkear: `vercel link --project caua-mvp` |
