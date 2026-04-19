# Tentacle: infra-devops

## Domain
Build pipeline, deployment, pre-commit hooks, health monitoring, security headers, E2E tests, CI/CD.

## What This Domain Owns
- `/vite.config.ts` — Vite build configuration (React + TailwindCSS)
- `/vite.config.security-headers.ts` — Vite config variant with security headers
- `/vercel.json` — Vercel deployment configuration
- `/netlify.toml` — Netlify deployment configuration (secondary/backup)
- `/.vercelignore` — Vercel build exclusions
- `/scripts/health.py` — Pre-commit health check script
- `/scripts/health-monitor.py` — Health monitoring daemon
- `/scripts/install-hooks.sh` — Git hook installer (runs via `npm run postinstall`)
- `/scripts/pre-commit-hook` — The installed pre-commit hook
- `/HEALTH_REPORT.md` — Latest health check output
- `/CORS-SECURITY-GUIDE.md`, `/SECURITY-HEADERS-GUIDE.md` — Security reference docs

## Build Pipeline

```
npm run build
  → tsc -b (TypeScript check)
  → vite build (outputs to dist/)
  → dist/ contains: index.html + assets/ (JS/CSS/images)
```

Output: static SPA build. Deployed to Vercel as static output.

## Deployment

### Vercel (Primary)
- Config: `vercel.json`
- SPA routing: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`
- Environment variables: set in Vercel dashboard (not in files)
- Python serverless: `api/` directory → Vercel Python Runtime

### Netlify (Secondary / Backup)
- Config: `netlify.toml`
- Output directory: `dist/`
- Keep in sync with Vercel config

## Pre-commit Hook

**Installed via:** `npm run postinstall` → `scripts/install-hooks.sh` → `.git/hooks/pre-commit`

**On every commit, `scripts/health.py` runs:**
- 🔴 **Blocks commit** if: `console.log` found in `src/` (production code)
- 🟡 **Warns (does not block)** if: any file in `src/` exceeds 200 lines
- 🟡 **Warns (does not block)** if: unused imports detected

**To bypass (emergency only):** `git commit --no-verify` — requires explicit user intent.

## Environment Variables

### Frontend (Vite — exposed to browser)
```
VITE_SUPABASE_URL          Supabase project URL
VITE_SUPABASE_ANON_KEY     Supabase anon (public) key
VITE_STRIPE_PUBLISHABLE_KEY Stripe publishable key (public)
VITE_HUBSPOT_PORTAL_ID     HubSpot portal ID
VITE_HUBSPOT_FORM_ID       HubSpot form ID
```

### Edge Functions + Python (server-side only — never in src/)
```
SUPABASE_URL               Same URL (server-side)
SUPABASE_SERVICE_ROLE_KEY  Service role key (bypasses RLS)
STRIPE_SECRET_KEY          Stripe secret key
STRIPE_WEBHOOK_SECRET      Stripe webhook signing secret
MERCADOPAGO_ACCESS_TOKEN   MercadoPago access token
CACAO_ML_SECRET            ML service API key
JWT_SECRET                 Supabase JWT secret (for award-tokens verification)
RESEND_API_KEY             Resend email API key
HUBSPOT_API_KEY            HubSpot private app key
PRIVACY_SALT               Salt for ML pseudonymization (SHA-256)
```

## Security Headers

**Configured via:** `vite.config.security-headers.ts` + `public/_headers` + `supabase/functions/security-headers-middleware.ts`

Key headers:
- `Content-Security-Policy` — Restricts script/style/connect origins
- `X-Frame-Options: DENY` — Prevents clickjacking
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — Restricts camera, microphone, geolocation

## Testing

| Tool | Status | Location |
|------|--------|----------|
| Playwright (E2E) | Installed, zero tests written | `@playwright/test` in devDependencies |
| TypeScript check | `tsc --noEmit` works | Runs on `npm run build` |
| ESLint | Configured | `eslint.config.js` |
| Python pytest | Not configured | No test files in `api/` |
| GitHub Actions | Not configured | No `.github/workflows/` files |

## Python Dependencies (api/requirements.txt)
```
fastapi
uvicorn
scikit-learn
pandas
numpy
supabase
pydantic
python-dotenv
joblib
```

## Vercel Python Runtime Notes
- Each `api/*.py` file is a separate serverless function
- FastAPI app object must be named `app` for Vercel to detect it
- Cold start: ~1–3s first request per region
- Max execution time: 10s (Vercel hobby plan), 60s (pro plan)
- For persistent IoT connections → migrate to Railway/Render
