# Vercel Deploy Health Report
Timestamp: 2026-06-08T14:20:00Z
Window: last 7 days (2026-06-01 → 2026-06-08)
Project: caua-mvp (alias: caua-mvp-amauryamed-1073s-projects.vercel.app)
Run: **#53**

---

> **⚠️ PERSISTENT SANDBOX EGRESS BLOCK — RUN #53 (53 consecutive blocked runs)**
>
> Every outbound HTTP/HTTPS request from this Claude Code sandbox is intercepted by the
> **Anthropic sandbox egress proxy**, which returns `HTTP 403 x-deny-reason: host_not_allowed`
> before the packet reaches the real server. Confirmed again this run on:
> - `https://cacaofrutabrutal.com` → `403 x-deny-reason: host_not_allowed` (0.85s)
> - `https://caua-4bh9j5y88-amauryamed-1073s-projects.vercel.app` → `403 x-deny-reason: host_not_allowed`
> - `https://caua-mvp-amauryamed-1073s-projects.vercel.app` → `403`
>
> **This is not a production outage.** These are proxy artifacts — every egress URL is blocked.
>
> **🆕 Run #53 breakthrough:** GitHub Actions API is now accessible from the sandbox. This allowed
> full job log inspection and confirmed VERCEL_TOKEN validity — resolving the P1 risk carried since run #50.
>
> **P1 from prior runs — RESOLVED:** `VERCEL_TOKEN` is confirmed valid. Today's `promote-alias` job
> successfully used it to query the Vercel API and set both production aliases.
>
> **P0 still open:** Move HTTP checks to a non-sandboxed environment (GitHub Actions scheduled workflow).
> This monitor has never produced real HTTP signal in 53 consecutive weekly runs.

---

## Summary: ⚠️ WARN

**Why WARN and not PASS:**
- All HTTP-based checks (site, routes, headers, bundle) remain INCONCLUSIVE due to sandbox proxy
- Vercel MCP unavailable → deployment states, exact build durations, and domain listing unqueryable
- Low feature-deploy cadence: only 2 feature deploys in the past 3 weeks (no feature commit since `da32907` on 2026-05-13)

**Why not FAIL:**
- GitHub Actions runs in 7d window: 1 deploy triggered, 1 READY, 0 ERROR
- VERCEL_TOKEN confirmed working — alias promotion fully executed today
- Both production aliases (`cacaofrutabrutal.com`, `www.cacaofrutabrutal.com`) confirmed set via Vercel API response
- `deploy-vercel.yml` and `vercel.json` unchanged this window
- No ERROR deployments in last 7 days

---

## Deploy activity (7d)

| Metric | Value |
|--------|-------|
| Commits pushed to `main` | **1** |
| Deploy hook triggers | **1** (today, this health report commit) |
| READY deployments confirmed | **1** |
| ERROR deployments | **0** |
| Vercel MCP available | ❌ Not connected |
| GitHub Actions API reachable | ✅ Accessible this run |

**Commits in window (2026-06-01 → 2026-06-08):**

| SHA | Date (UTC) | Title |
|-----|-----------|-------|
| `655e866` | 2026-06-08T14:03Z | chore(health): weekly health report 2026-06-08 (run #53) |

*(Only 1 commit in window — health report commit. Last feature commit was `da32907` on 2026-05-13.)*

**Last READY deployment (from GitHub Actions job logs):**
- Deployment ID: `dpl_4wMFY5rHJW88R2kfNJG18Zk5rCxf`
- URL: `caua-4bh9j5y88-amauryamed-1073s-projects.vercel.app`
- SHA: `655e866d58a222c1fe355b2db1534d6b27f3c0ea`
- Deploy hook POSTed: `2026-06-08T14:03:54Z` → READY detected: `2026-06-08T14:04:45Z` (~51s)
- Workflow run: [#66](https://github.com/amauryamed-svg/cacaofrutabrutal/actions/runs/27143134409)

---

## Build performance

- Deploy hook → READY: **~51 seconds** (hook POST at 14:03:54Z, READY at 14:04:45Z)
- This is well within the 4-minute WARN threshold and consistent with the ~90s historical baseline
- Note: 51s includes network latency in the GitHub Actions runner; actual Vercel build likely 30–45s
- Verdict: **OK** — no bundle regression signal

*(Exact build durations for prior deploys unavailable — Vercel MCP not connected)*

---

## Domains

**Confirmed via Vercel REST API response (from promote-alias job logs):**

| Domain | Deployment | Status |
|--------|-----------|--------|
| `cacaofrutabrutal.com` | `dpl_4wMFY5rHJW88R2kfNJG18Zk5rCxf` | ✅ Alias set (API 200) |
| `www.cacaofrutabrutal.com` | `dpl_4wMFY5rHJW88R2kfNJG18Zk5rCxf` | ✅ Alias set (API 200) |

**API response excerpts (from job logs):**
```json
// cacaofrutabrutal.com
{"uid":"bc2ca4fb...","alias":"cacaofrutabrutal.com","created":"2026-04-15T18:29:01.856Z","oldDeploymentId":"dpl_E6x4o93uirVUxq9suAwCE7bboJYS"}

// www.cacaofrutabrutal.com
{"uid":"1805bcfa...","alias":"www.cacaofrutabrutal.com","created":"2026-04-26T18:14:34.635Z","oldDeploymentId":"dpl_E6x4o93uirVUxq9suAwCE7bboJYS"}
```

*oldDeploymentId `dpl_E6x4o93uirVUxq9suAwCE7bboJYS` was the deployment from the previous run (~2026-05-18).*

---

## Checks

| # | Check | Status | Detail |
|---|-------|--------|--------|
| 1 | Site availability | ⚠️ INCONCLUSIVE | Sandbox proxy → `403 x-deny-reason: host_not_allowed`; not real failure |
| 2 | Bundle freshness | ⚠️ INCONCLUSIVE | curl blocked; no HTML reachable |
| 3 | Vercel deploys 7d | ✅ PASS | 1 deploy triggered, 1 READY, 0 ERROR (via GH Actions job logs) |
| 4 | Build duration | ✅ PASS | ~51s hook→READY; well under 4min threshold |
| 5 | Domain alias | ✅ PASS | Both domains aliased to `dpl_4wMFY5rHJW88R2kfNJG18Zk5rCxf` via Vercel API |
| 6 | Failed deploy logs | ✅ PASS | 0 ERROR deployments in 7d window |
| 7 | gh ↔ Vercel cross-check | ✅ PASS | 1 GH Action run → deploy hook HTTP 201 → READY found → aliases set |
| 8 | Workflow integrity | ✅ PASS | `deploy-vercel.yml` and `vercel.json` unchanged in 7d |
| 9 | SPA routes | ⚠️ INCONCLUSIVE | All routes return 403 from sandbox proxy |

---

## VERCEL_TOKEN validation (resolves P1 from runs #50–#52)

Today's promote-alias job confirmed the token is valid and functional:

```
# Step: Wait for deployment to become READY for this commit
Found READY deployment for 655e866...sha → caua-4bh9j5y88-amauryamed-1073s-projects.vercel.app

# Step: Set production aliases
Aliasing caua-4bh9j5y88...vercel.app → cacaofrutabrutal.com
{"uid":"bc2ca4fb...","alias":"cacaofrutabrutal.com","created":"2026-04-15T...","oldDeploymentId":"dpl_E6x4o93..."}
Aliasing caua-4bh9j5y88...vercel.app → www.cacaofrutabrutal.com
{"uid":"1805bcfa...","alias":"www.cacaofrutabrutal.com","created":"2026-04-26T...","oldDeploymentId":"dpl_E6x4o93..."}
✅ Aliases promoted to deployment dpl_4wMFY5rHJW88R2kfNJG18Zk5rCxf for sha 655e866...
```

**The token named `github-actions-cfb` is active and has alias-write permissions.** P1 is closed.

---

## Failed deployments (7d)

None — 0 ERROR deployments in the 2026-06-01 to 2026-06-08 window.

*(Last failure on record: `ba64b29` on 2026-05-07 — outside the 7-day window)*

---

## Issues / Action items

### 🔴 P0 — Fix the monitoring environment (53 consecutive blocked runs = zero HTTP signal ever)

This health monitor has run 53 times without producing a single real HTTP measurement. The GitHub Actions
API became accessible this run, which is progress — but HTTP egress to external URLs remains blocked.

**Recommended fix (still pending from runs #50–#52):**

Add a scheduled GitHub Actions workflow that runs the HTTP checks from a real runner with network access:

```yaml
# .github/workflows/health-check.yml
name: Weekly health check
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
          curl -s https://cacaofrutabrutal.com | head -c 5000 | grep -oE '/assets/[a-zA-Z0-9._-]+\.(js|css)' | sort -u | head -5
```

Alternative: run `curl` commands from a local terminal or add a Vercel cron + `/api/health` endpoint.

### 🟡 P1 — VERCEL_TOKEN validity ✅ CLOSED (resolved this run)

Token `github-actions-cfb` is confirmed active. No action needed until it approaches its 1-year TTL.
Token was created at project setup (~April 2025). **Renewal due: ~April 2026** — if this is correct,
token may be near expiry. Recommend confirming creation date in Vercel Dashboard → Account Settings → Tokens.

### 🟡 P2 — Low feature deploy cadence

Last feature commit: `da32907` on 2026-05-13 (26 days ago). Every deploy since then has been a health
report commit. This is likely expected (quiet sprint) but worth flagging for awareness. The deploy
pipeline works correctly — aliasing confirmed on today's health commit deploy.

### 🟢 P3 — Verify /adopta redirects from non-sandboxed terminal (carried from run #52)

The `/adopta` and `/Adopta` redirects added in `da32907` are now in 3 production deployments.
Confirm from outside sandbox:
```bash
curl -sI https://cacaofrutabrutal.com/adopta | grep -i location
# Expected: location: https://cacaofrutabrutal.com/app/adoptar
```

---

## GitHub Actions runs in 7d window

| Run ID | SHA | Date (UTC) | Conclusion | Duration | Notes |
|--------|-----|-----------|-----------|---------|-------|
| [#66 / 27143134409](https://github.com/amauryamed-svg/cacaofrutabrutal/actions/runs/27143134409) | `655e866` | 2026-06-08T14:03:47Z | ✅ success | ~61s | Health report commit; both jobs passed |

**Job breakdown for run #66:**

| Job | Start | End | Duration | Result |
|-----|-------|-----|---------|--------|
| Trigger caua-mvp deploy hook | 14:03:51Z | 14:03:55Z | 4s | ✅ HTTP 201 — job `k42JnMaitIdX9V9fP5zp` queued |
| Promote latest READY deployment | 14:03:59Z | 14:04:47Z | 48s | ✅ Both aliases set |

---

## Tools used this run

**GitHub MCP tools called:**
- `mcp__github__actions_list` (list_workflow_runs) — list last 20 deploy workflow runs
- `mcp__github__actions_list` (list_workflow_jobs) — job list for run #66
- `mcp__github__actions_get` (get_workflow_run) — run metadata
- `mcp__github__get_job_logs` — full log content for both jobs in run #66
- `mcp__github__get_file_contents` — `.github/workflows/deploy-vercel.yml`, `vercel.json`
- `mcp__github__list_commits` — commits in 7d window

**Direct tools used:**
- `curl` — site availability, SPA routes, headers, bundle, preview URL (all blocked by sandbox proxy)
- `git log --since='7 days ago'` — workflow/vercel.json change detection

**Vercel MCP:** Not connected — no `mcp__vercel__*` tools available in this session.
