---
tags: [warm, backend, python, ml]
---
# Python ML Microservice — api/

> Referencia completa: [[../archive/CACAO_MODULE_SETUP.md]]

## Archivos

| Archivo | Responsabilidad |
|---------|----------------|
| `api/cacao_predictor.py` | Cron principal — fetch clima + actualiza tree_updates |
| `api/iot_receiver.py` | Ingesta datos de sensores IoT (humedad, temperatura) |
| `api/ml_predictor.py` | Entrenamiento + inferencia (scikit-learn / TensorFlow) |
| `api/requirements.txt` | pandas, scikit-learn, tensorflow, fastapi, supabase-py |

## Función Principal: `fetch_climate(lat, lon)`

```python
# Llama Open-Meteo API, retorna:
{
  "avg_temp_c": 24.5,
  "total_rain_mm": 45.2,
  "forecast_days": 7,
  "fetched_at": "2026-04-15T..."
}
```

## Cron Vercel: `/api/cacao_predictor`

Configurado en `vercel.json`:
```json
{ "path": "/api/cacao_predictor", "schedule": "0 6 * * *" }
```
Trigger manual: `curl -X POST https://caua-mvp.vercel.app/api/cacao_predictor -H "x-cron-secret: $CACAO_CRON_SECRET"`

## Variables de Entorno (Vercel)

| Variable | Fuente |
|---------|--------|
| `SUPABASE_URL` | Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard — **NUNCA en .env.local** |
| `CACAO_CRON_SECRET` | `openssl rand -base64 32` |

## Setup Local

```bash
cd api
pip install -r requirements.txt
python -c "from cacao_predictor import fetch_climate; print(fetch_climate('2.5359', '-75.5277'))"
```

## Regla de Código
Max **20 líneas por función** — si crece más, extraer helper.
Datos de usuario pseudonimizados antes de entrar al feature store.
