# Vercel Deploy Health Report
Timestamp: 2026-09-28T14:22:00Z
Window: last 7 days (2026-09-21 → 2026-09-28)
Project: **cacaofrutabrutal** (id: prj_bT6j40wDZmPy3tvhc6RtgatAkNyN)
Team: amauryamed-1073's projects (id: team_aVPGjM9P30YNoCQKEvdBp4UQ)

## Summary: ⚠️ WARN

Two persistent WARNs carried from prior weeks:
1. `cacaofrutabrutal.com` and `www.cacaofrutabrutal.com` are **not registered as Vercel project domains** — site works via DNS CNAME but Vercel has no SSL/domain management for these domains.
2. `/app/` (exact trailing-slash path) returns 404 — named SPA routes (`/fund`, `/app/adoptar`) serve correctly.

All deployment pipeline checks PASS. No build errors in 7 days.

---

## Deploy activity (7d)

| Metric | Value |
|--------|-------|
| Total deployments | 4 |
| READY | 4 |
| ERROR | 0 |
| CANCELED | 0 |
| BUILDING | 0 |

**Last READY (production):**
- id: `dpl_cZ4NfpuoYeYp5HJmVtCXrgq9Ze9c`
- sha: `4093ed0`
- commit: "chore: update HEALTH_REPORT with 2026-09-28 monitoring run"
- age: ~0h ago (2026-09-28T14:10Z)
- build: **65s**

**Last ERROR:** none in 7d ✅

**All 7-day deployments:**

| id | branch | state | target | created |
|----|--------|-------|--------|---------|
| dpl_cZ4NfpuoYeYp5HJmVtCXrgq9Ze9c | main | READY | production | 2026-09-28T14:10Z |
| dpl_B8T7tZ4jnfE44TxqZADjnTCDj3EB | chore/dead-code-sweep-2026-09-21 | READY | preview | 2026-09-21T14:17Z |
| dpl_86qHxoqAk3EyWmJTn2cUAdDfaVwj | main | READY | production | 2026-09-21T14:00Z |
| dpl_794WZ7NVjunqXhux67MzW529ScFb | main | READY | production | 2026-09-21T13:49Z |

---

## Build performance

| Deployment | Date | Build time |
|------------|------|-----------|
| dpl_cZ4NfpuoYeYp5HJmVtCXrgq9Ze9c | 2026-09-28 | 65.5s |
| dpl_86qHxoqAk3EyWmJTn2cUAdDfaVwj | 2026-09-21 | 64.2s |
| dpl_794WZ7NVjunqXhux67MzW529ScFb | 2026-09-21 | 65.2s |

**Last 3 READY avg build time: 65s**
**Verdict: OK** — well under 4-minute threshold; consistent with recent weeks (~54–65s range). No regression detected.

---

## Domains

| Domain | In Vercel project domains | Notes |
|--------|--------------------------|-------|
| `cacaofrutabrutal.vercel.app` | ✅ registered | permanent project domain, always routes to latest production |
| `cacaofrutabrutal.com` | ❌ not registered | site accessible via DNS CNAME to `cacaofrutabrutal.vercel.app`; no Vercel SSL management |
| `www.cacaofrutabrutal.com` | ❌ not registered | same — previous report (2026-09-21) claim of "gap resolved" was incorrect; not in project domain list |

> **Note:** The site IS serving HTTPS responses at `cacaofrutabrutal.com` (verified via Vercel MCP web_fetch → 200 OK with full HTML and security headers including HSTS). Routing works. However, the custom domain is not under Vercel's SSL/certificate management. Action recommended: add `cacaofrutabrutal.com` and `www.cacaofrutabrutal.com` as project domains in the Vercel dashboard.

**Latest production deployment aliases:**
- `cacaofrutabrutal.vercel.app`
- `cacaofrutabrutal-amauryamed-1073s-projects.vercel.app`
- `cacaofrutabrutal-git-main-amauryamed-1073s-projects.vercel.app`

---

## Checks

| # | Check | Status | Detail |
|---|-------|--------|--------|
| 1 | Site availability | ✅ PASS | 200 OK via Vercel MCP web_fetch; `x-vercel-id` header confirmed; HSTS present. Direct curl blocked by egress proxy (persistent environment limitation — not a site issue). |
| 2 | Bundle freshness | ✅ PASS | SPA HTML at `/fund` and `/app/adoptar` references Vite-hashed assets: `/assets/index-Cx3ZScNp.js`, `/assets/index-41YfyASg.css`, `/assets/Web3Provider-DR00Q9RG.css` + 14 preloaded chunks. Root `/` serves static `investor-landing.html` (no SPA assets there by design). |
| 3 | Vercel deploys 7d | ✅ PASS | READY=4, ERROR=0 |
| 4 | Build duration | ✅ PASS | avg 65s across 3 builds; no regression |
| 5 | Domain alias | ⚠️ WARN | `cacaofrutabrutal.com` and `www` not registered as Vercel project domains (persistent). Site functions via CNAME passthrough but no Vercel-managed SSL/redirects. |
| 6 | Failed deploy logs | ✅ N/A | 0 failures in 7d |
| 7 | gh ↔ Vercel cross-check | ✅ PASS | 3 GH Actions runs (runs #136, #137, #138) → 3 matching READY production deployments; SHAs cross-referenced. No mismatches. |
| 8 | Workflow integrity | ✅ PASS | No commits to `.github/workflows/deploy-vercel.yml` or `vercel.json` in last 7 days. |
| 9 | SPA routes | ⚠️ WARN | `/fund`=200 ✅ `/app/adoptar`=200 ✅ `/investor-landing.html`=200 ✅. But `/app/` (trailing slash, no sub-path) returns 404 — vercel.json has no catch-all for exact `/app/` index. Named routes work; only the bare `/app/` path is unhandled. |

---

## Failed deployments

None in 7-day window.

---

## Issues / Action items

### ⚠️ WARN-1 — Custom domains not registered as Vercel project domains (persistent)
`cacaofrutabrutal.com` and `www.cacaofrutabrutal.com` are absent from the Vercel project domain list. The site works today via DNS CNAME to `cacaofrutabrutal.vercel.app`, but Vercel does not manage SSL certificates for unregistered domains. Risk: SSL renewal handled outside Vercel; no automatic Vercel redirect rules for www→apex or vice versa.

**Action:** In the Vercel dashboard → Project `cacaofrutabrutal` → Settings → Domains → Add `cacaofrutabrutal.com` and `www.cacaofrutabrutal.com`.

### ⚠️ WARN-2 — `/app/` exact path returns 404
The path `https://cacaofrutabrutal.com/app/` (trailing slash, no route) returns a Vercel 404. All named SPA routes under `/app/*` work correctly. This is likely a missing rewrite rule for the bare `/app` directory in `vercel.json`.

**Action:** Add a rewrite to `vercel.json` to serve `index.html` for `/app` and `/app/`:
```json
{ "source": "/app", "destination": "/index.html" },
{ "source": "/app/", "destination": "/index.html" }
```

### ℹ️ INFO — Egress proxy blocks curl checks (ongoing, week 69)
Direct curl to `cacaofrutabrutal.com` is rejected by the remote execution environment's egress proxy policy. This has been consistent since the health monitor was set up. All site-availability checks now run via Vercel MCP `web_fetch_vercel_url` as a workaround.

---

## Vercel MCP tools used

- `list_teams` — discover team ID
- `list_projects` — discover project by name
- `list_deployments` — list 7d deployments
- `get_deployment` — build time (buildingAt → ready) for 3 deployments
- `list_project_domains` — permanent domain registration check
- `list_deployment_aliases` — aliases on latest READY deployment
- `web_fetch_vercel_url` — site availability, bundle freshness, SPA route checks (/, /fund, /app/adoptar, /app/, /investor-landing.html)

---

*Generated by automated health monitor — 2026-09-28T14:22:00Z*
