# PowerShell Script: Deploy CATACIÓN
# Uso: .\deploy.ps1 -Token "your_supabase_access_token"

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,

    [string]$ProjectRef = "kjygovuiphbxcdxeduco"
)

Write-Host "🚀 CATACIÓN — Automated Deploy" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Configurar variables de entorno
Write-Host ""
Write-Host "🔐 Configurando autenticación..." -ForegroundColor Yellow
$env:SUPABASE_ACCESS_TOKEN = $Token

# Verificar que estamos en el directorio correcto
$projectDir = "C:\Users\amaur\OneDrive\Desktop\CAUA2.0"
if (-not (Test-Path $projectDir)) {
    Write-Host "❌ Directorio no encontrado: $projectDir" -ForegroundColor Red
    exit 1
}
cd $projectDir
Write-Host "✅ Ubicación: $projectDir" -ForegroundColor Green

# Paso 1: Link del proyecto
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "PASO 1: Vinculando proyecto Supabase" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

npx supabase link --project-ref $ProjectRef
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Link falló. Continuando de todas formas..." -ForegroundColor Yellow
}

# Paso 2: DB Push (migración SQL)
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "PASO 2: Ejecutando migración SQL (db push)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

npx supabase db push
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migración SQL completada" -ForegroundColor Green
} else {
    Write-Host "❌ Migración SQL falló" -ForegroundColor Red
    Write-Host "   Intenta manualmente en: https://app.supabase.com" -ForegroundColor Yellow
}

# Paso 3: Deploy Edge Function
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "PASO 3: Deployando Edge Function" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

npx supabase functions deploy notify-catacion-lead
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Edge Function deployada" -ForegroundColor Green
} else {
    Write-Host "❌ Deploy de Edge Function falló" -ForegroundColor Red
    Write-Host "   Intenta manualmente en: https://app.supabase.com" -ForegroundColor Yellow
}

# Resumen final
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "SETUP COMPLETADO" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host ""
Write-Host "✅ Próximos pasos:" -ForegroundColor Green
Write-Host "   1. npm run dev" -ForegroundColor White
Write-Host "   2. Abre http://localhost:3002/catacion" -ForegroundColor White
Write-Host "   3. Prueba el formulario (Nombre + Email)" -ForegroundColor White
Write-Host "   4. Verifica magic link en tu email" -ForegroundColor White
Write-Host "   5. Verifica notificación en amaury@cauaculture.co" -ForegroundColor White

Write-Host ""
Write-Host "ℹ️  Documentación: CATACION_SETUP.md, DEPLOY_MANUAL.md" -ForegroundColor Cyan
