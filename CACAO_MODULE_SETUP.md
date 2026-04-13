# Cacao Fruta Brutal Module — Post-Deploy Setup

## 1. Migración Supabase (Local/Staging)

```bash
# Apply migration 005_cacao_trees.sql
supabase migration up

# Verify tables:
supabase sql "select tablename from pg_tables where schemaname = 'public' and tablename in ('cacao_trees','tree_updates');"
```

**Expected Output:**
```
 tablename   
─────────────
 cacao_trees
 tree_updates
(2 rows)
```

## 2. Deploy Edge Function

```bash
supabase functions deploy award-tokens
```

**Verify:** Check Supabase dashboard → Functions → award-tokens. Should have `tree_adoption`, `tree_update_read`, `tree_harvest_share` in the TOKEN_RATES object.

## 3. Vercel Environment Variables (Production)

Add these to Vercel → Settings → Environment Variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `SUPABASE_URL` | `https://your-project.supabase.co` | From Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` (long key) | **⚠️ NEVER commit this** — Only in Vercel (Production + Preview) |
| `CACAO_CRON_SECRET` | Generate: `openssl rand -base64 32` | Use same value in cron requests |

## 4. Verify Python Microservice

### Local Test
```bash
cd api
pip install -r requirements.txt

python -c "
import os
os.environ['SUPABASE_URL'] = 'https://your-project.supabase.co'
os.environ['SUPABASE_SERVICE_ROLE_KEY'] = 'your-key-here'
from cacao_predictor import fetch_climate
print(fetch_climate('2.5359', '-75.5277'))
"
```

**Expected Output:**
```json
{
  "avg_temp_c": 24.5,
  "total_rain_mm": 45.2,
  "forecast_days": 7,
  "fetched_at": "2026-04-12T15:30:00.123456"
}
```

### Manual Vercel Cron Trigger
```bash
curl -X POST https://your-app.vercel.app/api/cacao_predictor \
  -H "x-cron-secret: $CACAO_CRON_SECRET" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "processed": 5,
  "success": 5,
  "results": [
    {"id": "uuid-1", "ok": true},
    {"id": "uuid-2", "ok": true},
    ...
  ]
}
```

## 5. Test End-to-End Flow

### Step 1: Create Test User
- Navigate to `/auth` → sign up with test email
- Confirm email

### Step 2: Adopt Tree
- Go to `/adoptar`
- Click "Adoptar Mi Primer Árbol"
- Select Guardian: "Lucho" (Huila)
- Select Variety: "Criollo"
- Confirm → Should see token reward animation (+10 beans, +3 mazorcas)

### Step 3: Verify Database
```sql
-- Check tree was created:
select id, guardian_id, stage, co2_kg from cacao_trees where user_id = auth.uid() limit 1;

-- Check token event was logged:
select event_type, beans, mazorcas from token_events where event_type = 'tree_adoption' order by created_at desc limit 1;

-- Check user balance increased:
select beans_balance, mazorcas_balance from user_profiles where user_id = auth.uid();
```

### Step 4: Run Cron Manually (Vercel Dashboard)
- Go to Vercel → Settings → Cron Jobs
- Find `/api/cacao_predictor` → Click "Trigger"
- Check response → should be `{"processed": 1, "success": 1, ...}`
- Wait 10 seconds, then check Supabase:

```sql
select update_type, message, climate_data from tree_updates where tree_id = 'your-tree-id' order by created_at desc limit 1;
```

## 6. Common Issues & Fixes

### ❌ `SUPABASE_SERVICE_ROLE_KEY` is undefined
**Fix:** Add env var to Vercel dashboard (not in `.env.local`)

### ❌ Cron returns 401 Unauthorized
**Fix:** Check `CACAO_CRON_SECRET` matches the header sent by Vercel

### ❌ `tree_adoption` token not awarded
**Fix:** Ensure `award-tokens` Edge Function has `tree_adoption` in TOKEN_RATES

### ❌ `fetch_climate()` returns 0 results
**Fix:** Open-Meteo API may be down; check `https://api.open-meteo.com/v1/forecast?latitude=2.5359&longitude=-75.5277&daily=temperature_2m_max` in browser

### ❌ RLS policy blocks tree insert
**Fix:** Verify `user_id` in JWT matches `auth.uid()` — this is automatic if using Supabase auth

## 7. Monitoring

### Logs
- **React errors:** Browser console (`F12`)
- **Edge Function logs:** Supabase dashboard → Functions → award-tokens → Logs
- **Python cron logs:** Vercel dashboard → Deployments → Cron Jobs → Logs

### Metrics to Watch
- **Adoption rate:** SELECT COUNT(*) FROM cacao_trees
- **Token issuance:** SELECT SUM(beans) FROM token_events WHERE event_type = 'tree_adoption'
- **Cron success rate:** Check Vercel cron execution history

## 8. Post-Deployment Checklist

- [ ] Migration 005 applied to production Supabase
- [ ] `award-tokens` function deployed
- [ ] Vercel env vars added (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CACAO_CRON_SECRET)
- [ ] `/api/cacao_predictor.py` deployed to Vercel
- [ ] Cron job running (check Vercel dashboard → Cron Jobs)
- [ ] NavBar shows `/adoptar` link (both ES & EN)
- [ ] Test user can adopt tree
- [ ] Token reward animates
- [ ] Database reflects adoption + tokens
- [ ] Python cron updates tree stage/CO2

---

**Questions?** Check the plan file at `.claude/plans/lovely-dancing-sunbeam.md` for architecture details.
