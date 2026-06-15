# Vercel Deploy Health Report
Timestamp: 2026-06-15T14:20:00Z
Window: last 7 days (2026-06-08 → 2026-06-15)
Project: caua-mvp (alias: caua-mvp-amauryamed-1073s-projects.vercel.app)
Run: **#54**

---

> **⚠️ PERSISTENT SANDBOX EGRESS BLOCK — RUN #54 (54 consecutive blocked runs)**
>
> Every outbound HTTP/HTTPS request from this Claude Code sandbox is intercepted by the
> **Anthropic sandbox egress proxy**, which returns `HTTP 403` with body:
> `Host not in allowlist: <host>. Add this host to your network egress settings to allow access.`
> Confirmed again this run on:
> - `https://cacaofrutabrutal.com` → `403` (32ms — proxy intercept, not real server)
> - `https://caua-hu6pvdyil-amauryamed-1073s-projects.vercel.app` → `403`
> - `https://caua-mvp-amauryamed-1073s-projects.vercel.app` → `403`
>
> **This is not a production outage.** These are proxy artifacts — every egress URL is blocked.
>
> **P1 (VERCEL_TOKEN) CLOSED last run (#53).** Token confirmed valid; alias promotion is working.
>
> **P0 still open:** Move HTTP checks to a non-sandboxed environment (GitHub Actions scheduled workflow).
> This monitor has never produced real HTTP signal in 54 consecutive weekly runs.

---

## Summary: ⚠️ WARN

**Why WARN and not PASS:**
- All HTTP-based checks (site, routes, headers, bundle) remain INCONCLUSIVE due to sandbox proxy (54th consecutive run)
- Vercel MCP unavailable → deployment states and domain listing unqueryable directly
- Low feature-deploy cadence: no feature commit since `da32907` on 2026-05-13 (33 days ago)

**Why not FAIL:**
- GitHub Actions runs in 7d window: 2 deploys triggered, 2 READY, 0 ERROR
- VERCEL_TOKEN confirmed working (alias promotion executed both runs this week)
- Both production aliases (`cacaofrutabrutal.com`, `www.cacaofrutabrutal.com`) confirmed set via Vercel API response
- `deploy-vercel.yml` and `vercel.json` unchanged this window
- No ERROR deployments in last 7 days

---

## Deploy activity (7d)

| Metric | Value |
|--------|-------|
| Commits pushed to `main` | **2** |
| Deploy hook triggers | **2** |
| READY deployments confirmed | **2** |
| ERROR deployments | **0** |
| Vercel MCP available | ❌ Not connected |
| GitHub Actions API reachable | ✅ Accessible this run |

**Commits in window (2026-06-08 → 2026-06-15):**

| SHA | Date (UTC) | Title |
|-----|-----------|-------|
| `1a8c917` | 2026-06-15T14:04Z | chore(health): weekly health report 2026-06-15 (run #54) |
| `ce974f6` | 2026-06-08T14:03Z | chore(health): weekly health report 2026-06-08 (run #53) |

*(Both commits are health report automation. Last feature commit was `da32907` on 2026-05-13 — 33 days ago.)*

**Last READY deployment (from GitHub Actions job logs):**
- Deployment ID: `dpl_G1cLBcELDxNYyR4zTF8d36zZgKfo`
- URL: `caua-hu6pvdyil-amauryamed-1073s-projects.vercel.app`
- SHA: `1a8c917fe249848fe06448240d47b5c5fd080b99`
- Deploy hook POSTed: `2026-06-15T14:04:50Z` → READY detected: `2026-06-15T14:05:40Z` (~50s)
- Workflow run: [27551850534](https://github.com/amauryamed-svg/cacaofrutabrutal/actions/runs/27551850534)

**Previous READY deployment (run #53, last week):**
- Deployment ID: `dpl_6fBFevk1fmHEVsaLs5iArfyg2MPu` (confirmed as `oldDeploymentId` replaced this run)
- SHA: `ce974f6` | 2026-06-08 | workflow run: 27144209869

---

## Build performance

- Deploy hook → READY: **~50 seconds** (hook POST at 14:04:50Z, READY at 14:05:40Z)
- Total workflow duration: **67s** (includes job setup overhead + alias API calls)
- Last 5 successful workflow durations: 67s, 61s, 61s, 64s, 64s → **avg 63s**
- Well within 4-minute WARN threshold; consistent with historical ~90s baseline
- Verdict: **OK** — no bundle regression signal

*(Exact Vercel build durations unavailable — Vercel MCP not connected. GH Actions workflow time is a proxy.)*

---

## Domains

**Confirmed via Vercel REST API response (from promote-alias job logs, 2026-06-15T14:05:41Z):**

| Domain | Deployment | Status |
|--------|-----------|--------|
| `cacaofrutabrutal.com` | `dpl_G1cLBcELDxNYyR4zTF8d36zZgKfo` | ✅ Alias set (API HTTP 200) |
| `www.cacaofrutabrutal.com` | `dpl_G1cLBcELDxNYyR4zTF8d36zZgKfo` | ✅ Alias set (API HTTP 200) |

**API response excerpts (from job logs):**
```json
// cacaofrutabrutal.com
{"uid":"bc2ca4fb...","alias":"cacaofrutabrutal.com","created":"2026-04-15T18:29:01.856Z","oldDeploymentId":"dpl_6fBFevk1fmHEVsaLs5iArfyg2MPu"}

// www.cacaofrutabrutal.com
{"uid":"1805bcfa...","alias":"www.cacaofrutabrutal.com","created":"2026-04-26T18:14:34.235Z","oldDeploymentId":"dpl_6fBFevk1fmHEVsaLs5iArfyg2MPu"}
```

*`oldDeploymentId` `dpl_6fBFevk1fmHEVsaLs5iArfyg2MPu` = run #53 deployment (sha=`ce974f6`, 2026-06-08).*

---

## Checks

| # | Check | Status | Detail |
|---|-------|--------|--------|
| 1 | Site availability | ⚠️ INCONCLUSIVE | Sandbox proxy → `403 Host not in allowlist`; not real failure |
| 2 | Bundle freshness | ⚠️ INCONCLUSIVE | curl blocked; no HTML reachable |
| 3 | Vercel deploys 7d | ✅ PASS | 2 deploys triggered, 2 READY, 0 ERROR (via GH Actions job logs) |
| 4 | Build duration | ✅ PASS | ~50s hook→READY; avg 63s total workflow; well under 4min threshold |
| 5 | Domain alias | ✅ PASS | Both domains aliased to `dpl_G1cLBcELDxNYyR4zTF8d36zZgKfo` via Vercel API |
| 6 | Failed deploy logs | ✅ PASS | 0 ERROR deployments in 7d window |
| 7 | gh ↔ Vercel cross-check | ✅ PASS | 2 GH runs → 2 deploy hooks HTTP 201 → 2x READY → both alias sets confirmed |
| 8 | Workflow integrity | ✅ PASS | `deploy-vercel.yml` and `vercel.json` unchanged in 7d |
| 9 | SPA routes | ⚠️ INCONCLUSIVE | All routes return 403 from sandbox proxy |

---

## Deploy logs — latest run (2026-06-15)

**Job: Trigger caua-mvp deploy hook** (job 81440048249)
```
HTTP 201
{"job":{"id":"QR2DSUEwlh5bkzcOt35u","state":"PENDING","createdAt":1781532290197}}
Deploy queued for sha 1a8c917fe249848fe06448240d47b5c5fd080b99.
```

**Job: Promote latest READY deployment to production alias** (job 81440102728)
```
Found READY deployment for 1a8c917fe249848fe06448240d47b5c5fd080b99
  → caua-hu6pvdyil-amauryamed-1073s-projects.vercel.app

Aliasing caua-hu6pvdyil...vercel.app → cacaofrutabrutal.com
{"uid":"bc2ca4fb...","alias":"cacaofrutabrutal.com","created":"2026-04-15T18:29:01.856Z","oldDeploymentId":"dpl_6fBFevk1fmHEVsaLs5iArfyg2MPu"}

Aliasing caua-hu6pvdyil...vercel.app → www.cacaofrutabrutal.com
{"uid":"1805bcfa...","alias":"www.cacaofrutabrutal.com","created":"2026-04-26T18:14:34.235Z","oldDeploymentId":"dpl_6fBFevk1fmHEVsaLs5iArfyg2MPu"}

✅ Aliases promoted to deployment dpl_G1cLBcELDxNYyR4zTF8d36zZgKfo for sha 1a8c917...
```

---

## Failed deployments (7d)

None — 0 ERROR deployments in the 2026-06-08 to 2026-06-15 window.

---

## Issues / Action items

### 🔴 P0 — Fix the monitoring environment (54 consecutive blocked runs = zero HTTP signal ever)

This health monitor has run 54 times without producing a single real HTTP measurement. Both the
GitHub Actions API and the Vercel deploy pipeline are accessible, but all HTTP egress to the
production site and Vercel URLs is blocked by the sandbox egress proxy.

**Recommended fix (pending since run #50):**

Add a scheduled GitHub Actions workflow that runs the HTTP checks from a real runner:

```yaml
# .github/workflows/health-check.yml
name: Weekly HTTP health check
on:
  schedule:
    - cron: '0 8 * * 1'  # Every Monday 08:00 UTC
  workflow_dispatch:
jobs:
  http-checks:
    runs-on: ubuntu-latest
    steps:
      - name: Site availability
        run: |
          curl -s -o /dev/null -w '%{http_code} %{time_total}s\n' https://cacaofrutabrutal.com
          curl -sI https://cacaofrutabrutal.com | grep -iE 'x-vercel-id|server'
      - name: SPA routes
        run: |
          curl -s -o /dev/null -w '/fund=%{http_code} ' https://cacaofrutabrutal.com/fund
          curl -s -o /dev/null -w '/app/adoptar=%{http_code} ' https://cacaofrutabrutal.com/app/adoptar
          curl -s -o /dev/null -w '/investor-landing.html=%{http_code}\n' https://cacaofrutabrutal.com/investor-landing.html
      - name: Bundle freshness
        run: |
          curl -s https://cacaofrutabrutal.com/investor-landing.html \
            | grep -oE '/assets/[a-zA-Z0-9._-]+\.(js|css)' | sort -u | head -5
```

### 🟡 P1 — VERCEL_TOKEN validity ✅ CLOSED (resolved run #53)

Token `github-actions-cfb` is confirmed active and functional. Created ~April 2025 with 1-year TTL →
**renewal due ~April 2026** (may already be past due). Verify exact creation date in
Vercel Dashboard → Account Settings → Tokens and rotate if expired.

### 🟡 P2 — Low feature deploy cadence

Last feature commit: `da32907` on 2026-05-13 (33 days ago). Every deploy since has been a health
report commit. Likely expected (quiet sprint). Pipeline is healthy — no action on pipeline needed.

### 🟢 P3 — Verify /adopta redirects from non-sandboxed terminal (carried from run #52)

The `/adopta` and `/Adopta` redirects added in `da32907` are in 5+ production deployments.
Confirm from outside sandbox:
```bash
curl -sI https://cacaofrutabrutal.com/adopta | grep -i location
# Expected: location: https://cacaofrutabrutal.com/app/adoptar
```

---

## GitHub Actions runs in 7d window

| Run ID | SHA | Date (UTC) | Conclusion | Duration | Notes |
|--------|-----|-----------|-----------|---------|-------|
| [27551850534](https://github.com/amauryamed-svg/cacaofrutabrutal/actions/runs/27551850534) | `1a8c917` | 2026-06-15T14:04:37Z | ✅ success | 67s | Run #54 — today's health report |
| [27144209869](https://github.com/amauryamed-svg/cacaofrutabrutal/actions/runs/27144209869) | `ce974f6` | 2026-06-08T14:03Z | ✅ success | 61s | Run #53 — last week's health report |

**Job breakdown for run 27551850534 (today):**

| Job | Start | End | Duration | Result |
|-----|-------|-----|---------|--------|
| Trigger caua-mvp deploy hook | 14:04:46Z | 14:04:51Z | 5s | ✅ HTTP 201 — Vercel job `QR2DSUEwlh5bkzcOt35u` queued |
| Promote latest READY deployment | 14:04:54Z | 14:05:43Z | 49s | ✅ Both aliases set → `dpl_G1cLBcELDxNYyR4zTF8d36zZgKfo` |

---

## Tools used this run

**GitHub MCP tools called:**
- `mcp__github__actions_list` (list_workflow_runs) — last 30 deploy workflow runs
- `mcp__github__actions_list` (list_workflow_jobs) — job list for run 27551850534
- `mcp__github__get_job_logs` — full log content for jobs 81440102728 and 81440048249

**Direct tools used:**
- `curl` — site availability, SPA routes, headers, bundle, preview URL (all blocked by sandbox proxy)
- `git log --since='7 days ago'` — workflow/vercel.json change detection
- `git log --oneline -5` — recent commits
- `python3` — parsed GH Actions JSON payload to extract run stats and durations

**Vercel MCP:** Not connected — no `mcp__vercel__*` tools available in this session.
