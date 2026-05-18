# Vercel Deploy Health Report
Timestamp: 2026-05-18T14:20:00Z
Window: last 7 days (2026-05-11 → 2026-05-18)
Project: caua-mvp (alias: caua-mvp-amauryamed-1073s-projects.vercel.app)
Run: **#52**

---

> **⚠️ PERSISTENT SANDBOX EGRESS BLOCK — RUN #52 (52 consecutive blocked runs)**
>
> Every outbound HTTP/HTTPS request from this Claude Code sandbox is intercepted by the
> **Anthropic sandbox egress proxy**, which returns `HTTP 403 x-deny-reason: host_not_allowed`
> before the packet reaches the real server. Confirmed again this run on:
> - `https://cacaofrutabrutal.com` → `403 x-deny-reason: host_not_allowed`
> - `https://www.cacaofrutabrutal.com` → `403 x-deny-reason: host_not_allowed`
> - `https://caua-mvp-amauryamed-1073s-projects.vercel.app` → `403 x-deny-reason: host_not_allowed`
> - `https://caua-mvp.vercel.app` → `403 Host not in allowlist`
> - `https://cacaofrutabrutal.vercel.app` → `403 Host not in allowlist`
>
> **This is not a production outage.** These are proxy artifacts — every egress URL is blocked.
>
> **Action still pending:** Move HTTP checks to GitHub Actions scheduled workflow or local terminal.
> This monitor has never produced real HTTP signal in 52 consecutive weekly runs.

---

## Summary: ⚠️ WARN

**Why WARN:**
- Vercel MCP unavailable → deployment states, build durations, domain alias bindings unqueryable
- All HTTP-based checks (site, routes, headers, bundle, domains) are **INCONCLUSIVE** due to sandbox proxy
- VERCEL_TOKEN secret validity still unverified (risk: silent alias-skip on every deploy since expiry)
- Very low code-push volume this week (1 feature commit + 1 health commit) — expected, but reduces deploy data

**Why not FAIL:**
- Sandbox proxy 403s are environment artifacts, not production failures
- `vercel.json` changes in this window are safe: 2 new redirect entries (`/adopta`, `/Adopta`) that do not affect alias promotion or SPA rewrites
- `deploy-vercel.yml` is **unchanged** — alias promotion logic intact for both production domains
- Active `promote-alias` job correctly targets `cacaofrutabrutal.com` and `www.cacaofrutabrutal.com`

---

## Deploy activity (7d)

| Metric | Value |
|--------|-------|
| Git commits pushed to `main` | **2** |
| Expected Vercel deploy hook triggers | **2** |
| Feature PRs merged | **1** (#56 — /adopta redirect) |
| Health report commits | **1** (run #52) |
| Vercel MCP available | ❌ Not connected |
| GitHub Actions API reachable from sandbox | ❌ Blocked |

**Commits in window (newest → oldest):**

| SHA | Date (UTC) | Title |
|-----|-----------|-------|
| `af0eedd` | 2026-05-18T14:08Z | chore(health): weekly health report 2026-05-18 (run #52) |
| `da32907` | 2026-05-13T01:41Z | feat(redirect): /adopta short-URL → /app/adoptar (#56) |

*(2026-05-11 boundary commit `c8d83305` — health run #51 — excluded from window)*

**Note on low activity:** Only 1 feature commit this week. This is a quiet week, not a deploy outage signal.

---

## Build performance

**INCONCLUSIVE** — Vercel MCP not connected; cannot query deployment records or build durations.

*Baseline for reference:* Historical builds average ~90s. WARN threshold: >4 min average.

---

## Domains

**INCONCLUSIVE** — All domain checks blocked by sandbox proxy.

**Structurally verified (git + file inspection):**
- `vercel.json` modified in this window (da32907): **only** 2 new redirect entries added
  - `{ "source": "/adopta", "destination": "/app/adoptar", "permanent": true }`
  - `{ "source": "/Adopta", "destination": "/app/adoptar", "permanent": true }`
- All existing SPA rewrites, headers, and other redirects are **untouched**
- `deploy-vercel.yml` promote-alias step still aliases both production domains on every READY deploy

**Ongoing risk:** If `VERCEL_TOKEN` is expired/absent, `promote-alias` silently skips with `exit 0` and domains serve stale code. Still **unverified**.

---

## Checks

| # | Check | Status | Detail |
|---|-------|--------|--------|
| 1 | Site availability | ⚠️ INCONCLUSIVE | Sandbox proxy → `403 x-deny-reason: host_not_allowed`; not a real failure |
| 2 | Bundle freshness | ⚠️ INCONCLUSIVE | curl blocked; no HTML reachable; no asset hash extractable |
| 3 | Vercel deploys 7d | ⚠️ INCONCLUSIVE | Vercel MCP not connected; 2 commits → 2 expected hook triggers |
| 4 | Build duration | ⚠️ INCONCLUSIVE | Vercel MCP not connected |
| 5 | Domain alias | ⚠️ INCONCLUSIVE | Cannot verify from sandbox; structurally correct per workflow + vercel.json |
| 6 | Failed deploy logs | ⚠️ INCONCLUSIVE | Vercel MCP not connected |
| 7 | gh ↔ Vercel cross-check | ⚠️ INCONCLUSIVE | `gh` CLI unavailable; GitHub Actions API blocked from sandbox |
| 8 | Workflow integrity | ✅ PASS | `deploy-vercel.yml` unchanged; `vercel.json` changed safely (2 redirects added, alias logic intact) |
| 9 | SPA routes | ⚠️ INCONCLUSIVE | `/fund`, `/app/adoptar`, `/investor-landing.html` all return `403` from sandbox proxy |

---

## Failed deployments

Cannot determine — Vercel MCP not available.

---

## vercel.json change detail (da32907)

The only `vercel.json` change this week added two new 308 permanent redirects for the social CTA short-URL:

```json
{ "source": "/adopta",  "destination": "/app/adoptar", "permanent": true },
{ "source": "/Adopta",  "destination": "/app/adoptar", "permanent": true }
```

These are **safe**: they mirror the existing `/adoptar` redirect pattern, do not overlap any SPA rewrite rule, and do not affect alias promotion. No action required.

---

## Issues / Action items

### 🔴 P0 — Fix the monitoring environment (52 consecutive blocked runs = zero HTTP signal ever)

This health monitor has run 52 times without producing a single real HTTP measurement. Options:

1. **GitHub Actions scheduled workflow** (recommended) — Add `schedule: cron('0 8 * * 1')` to a new `.github/workflows/health-check.yml`. The runner has real egress and can call `curl`, the Vercel REST API with `VERCEL_TOKEN`, and post results to Slack/Discord.
2. **Vercel cron + serverless function** — Add `/api/health` endpoint + entry in `vercel.json` `crons` array that pings external endpoints and posts to a webhook.
3. **Local terminal** — All curl/gh commands work fine outside this sandbox; run ad-hoc from dev machine.

### 🟡 P1 — Verify VERCEL_TOKEN secret validity (carried from runs #50 and #51)

The `promote-alias` job silently skips when the token is absent or expired:
```yaml
echo "::warning::VERCEL_TOKEN not configured — skipping alias promotion."
echo "skip=true" >> "$GITHUB_OUTPUT"
exit 0
```
Vercel personal tokens have a maximum 1-year TTL. Token `github-actions-cfb` was created at project setup.

**Action:** Vercel Dashboard → Account Settings → Tokens → verify `github-actions-cfb` is active and not expired. If expired: regenerate, update `VERCEL_TOKEN` GitHub Secret, trigger a manual `workflow_dispatch`, confirm `cacaofrutabrutal.com` resolves to the latest commit.

### 🟢 P3 — Verify /adopta redirects post-deploy (from a non-sandboxed terminal)

The new `/adopta` and `/Adopta` redirects (da32907) are in `vercel.json`. Confirm from outside sandbox:
```bash
curl -sI https://cacaofrutabrutal.com/adopta | grep -i location
curl -sI https://cacaofrutabrutal.com/Adopta | grep -i location
```
Expected: `location: https://cacaofrutabrutal.com/app/adoptar`

---

## Vercel MCP tools used

**None** — Vercel MCP server was not connected. Tool discovery confirmed only GitHub MCP and shadcn MCP as available.

**GitHub MCP tools called:**
- `mcp__github__list_commits` — commit activity in 7d window
- `mcp__github__get_file_contents` — prior VERCEL_HEALTH_REPORT.md for run-number continuity

**Direct tools used:**
- `curl` — site availability, headers, SPA routes, bundle, www, and multiple Vercel aliases (all blocked by sandbox proxy)
- `git log --since` — commit activity and workflow/vercel.json change detection
- `git show <sha> --stat` — confirmed da32907 touched only `vercel.json` (+2 lines)
- `cat .github/workflows/deploy-vercel.yml` — alias promotion logic verified intact
- `cat vercel.json` — redirect/rewrite config verified intact
