#!/bin/bash
# Deploy CATACIÓN — Bash script (Mac/Linux)
# Uso: ./deploy.sh TOKEN_AQUI

if [ -z "$1" ]; then
    echo "❌ Necesitas proporcionar el Supabase Access Token"
    echo ""
    echo "Uso: ./deploy.sh YOUR_TOKEN"
    echo ""
    echo "Obtén tu token en:"
    echo "  https://app.supabase.com → Avatar → Preferences → Access Tokens"
    exit 1
fi

TOKEN=$1
PROJECT_REF="kjygovuiphbxcdxeduco"

echo "🚀 CATACIÓN — Deploy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Configura token
export SUPABASE_ACCESS_TOKEN=$TOKEN

# Navega al proyecto
cd "$(dirname "$0")"

echo ""
echo "📍 Paso 1: Vinculando proyecto..."
npx supabase link --project-ref $PROJECT_REF

echo ""
echo "📍 Paso 2: Ejecutando migración SQL..."
npx supabase db push

echo ""
echo "📍 Paso 3: Deployando Edge Function..."
npx supabase functions deploy notify-catacion-lead

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup completado"
echo ""
echo "Próximos pasos:"
echo "  1. npm run dev"
echo "  2. Abre http://localhost:3002/catacion"
echo "  3. Prueba el formulario"
