# Vercel Deploy Health Report
Timestamp: 2026-06-22T14:20:00Z
Window: last 7 days (2026-06-15 → 2026-06-22)
Project: caua-mvp (alias: caua-mvp-amauryamed-1073s-projects.vercel.app)
Run: **#55**

---

## ⚠️ NOTE: Vercel MCP Not Connected
The Vercel MCP server was not connected during this run. Checks 3–6 were performed using:
- GitHub Actions workflow run data (via GitHub MCP) as a proxy for Vercel deployment state
- Direct `curl` calls to the production URL for liveness checks
- `git log` for workflow integrity
Checks requiring the Vercel MCP (exact deployment IDs, Vercel build logs, domain record state from Vercel API) are marked `(GH proxy)`.

---

## Summary: ❌ FAIL

**CRITICAL: `cacaofrutabrutal.com` and `www.cacaofrutabrutal.com` both return HTTP 403 `x-deny-reason: host_not_allowed`. The site is DOWN for all users.**

The alias promotion step in GitHub Actions reports success (Vercel alias API `/v2/deployments/$DEP_ID/aliases` returns 200), but the Vercel edge refuses to serve traffic for both domains. Root cause: the alias API updates routing records but does NOT register a hostname as an authorized host in the Vercel project's domain list. If `cacaofrutabrutal.com` was removed from Vercel's Settings → Domains, the API call succeeds silently while the domain stays edge-blocked.

---

## Deploy Activity (7d — GH Actions proxy)
- Total GH Actions runs: **24**
- success: **18** | failure: **6** | canceled: 0
- Last successful run: `27958731112` — sha:`f6b2761` — *"chore(health): weekly health check run #55 — 2026-06-22"* — ~8h ago — end-to-end ~101s
- Last ERROR (6 total, all 2026-06-18): `27780929338` — sha:`dd2a6b0` — *"feat(web3): dashboard activos digitales + chip on-chain en jardín"* — Vercel build never reached READY within 8-min poll timeout

---

## Build Performance (GH Actions proxy)
Last 5 successful runs, end-to-end (hook trigger → alias promote complete):

| Date (UTC) | Duration | SHA |
|------------|----------|-----|
| 2026-06-19 02:03 | 59s | d6083cf |
| 2026-06-19 03:48 | 58s | e521e74 |
| 2026-06-19 04:27 | 58s | 57d9252 |
| 2026-06-19 04:29 | 59s | 8364d98 |
| 2026-06-22 14:06 | 101s | f6b2761 |

**Average: ~67s** (includes 45s intentional sleep + poll cycles; Vercel build itself ~15–55s)
Verdict: **OK** — well under 4-min warn threshold

---

## Domains
- `cacaofrutabrutal.com` → HTTP **403** `x-deny-reason: host_not_allowed` — no `x-vercel-id` header ❌
- `www.cacaofrutabrutal.com` → HTTP **403** `x-deny-reason: host_not_allowed` ❌

The alias API (last run 2026-06-22T14:08:25Z) returned 200 for both, logging:
```
{"alias":"cacaofrutabrutal.com","created":"2026-04-15T18:29:01.856Z","oldDeploymentId":"dpl_3TQgLvVHh5n7TvvWUQSgDHayWGhx"}
{"alias":"www.cacaofrutabrutal.com","created":"2026-04-26T18:14:34.635Z","oldDeploymentId":"dpl_FzotmCn3VVX3PWydJVjMfjQof8PC"}
```
Alias records exist since April. The Vercel edge still blocks both — the domains are not in the project's verified custom-domain host allowlist.

---

## Checks

| # | Check | Status | Detail |
|---|-------|--------|--------|
| 1 | Site availability | ❌ FAIL | 403 in 0.196s; `x-deny-reason: host_not_allowed`; no `x-vercel-id` header |
| 2 | Bundle freshness | ❌ FAIL | HTML unreachable (403); no Vite asset refs extractable |
| 3 | Vercel deploys 7d | ⚠️ WARN (GH proxy) | 18 success / 6 failure; all 6 failures on 2026-06-18 during web3 sprint |
| 4 | Build duration | ✅ OK (GH proxy) | avg ~67s end-to-end; well under 240s threshold |
| 5 | Domain alias | ❌ FAIL | Both apex and www return 403; alias API claims 200 but edge refuses traffic |
| 6 | Failed deploy logs | ⚠️ WARN (GH proxy) | 6 failures on 2026-06-18: all timed out after 24×20s polls (8 min) — Vercel build itself errored |
| 7 | gh ↔ Vercel cross-check | ✅ OK | 18 GH successes align with deploy hook triggers; 6 GH failures match Vercel build timeouts |
| 8 | Workflow integrity | ✅ OK | No changes to `deploy-vercel.yml` or `vercel.json` in last 14 days |
| 9 | SPA routes | ❌ FAIL | `/fund=403`, `/app/adoptar=403`, `/investor-landing.html=403` — all blocked by domain issue |

---

## Failed Deployments (7d — GH Actions proxy)

All 6 failures on 2026-06-18 during a rapid web3 feature sprint:

| Run ID | SHA | Time (UTC) | Title |
|--------|-----|------------|-------|
| 27733152603 | a4c3ed9 | 02:40 | feat(web3): simplified 2-step onboarding + CDP Onramp KYC gate removed |
| 27733358676 | 474831a | 02:47 | fix(build): close Screen tag in Web3Onboarding + clear 2 TS errors |
| 27733828947 | 695eb6a | 03:01 | feat(web3): dual-audience onboarding with layered trust signals |
| 27734003729 | 4437a61 | 03:06 | fix(web3): populate RainbowKit wallet list with connectorsForWallets |
| 27734152858 | 701ccfb | 03:10 | feat(web3): add WEB3 to navbar + 5-step journey rail in onboarding |
| 27780929338 | dd2a6b0 | 18:30 | feat(web3): dashboard activos digitales + chip on-chain en jardín |

**Error pattern**: `promote-alias` job timed out — `Timed out waiting for READY deployment matching <sha>` after 24×20s polls. The Vercel build for those SHAs never completed READY (likely TypeScript/build errors on the Vercel side). The sprint recovered: 10 consecutive successes followed.

---

## Root Cause Analysis — Site DOWN (403)

Vercel has two separate systems that the workflow conflates:

| System | API | Effect |
|--------|-----|--------|
| **Deployment alias routing** | `POST /v2/deployments/$ID/aliases` | Updates which deployment a known alias points to — returns 200 even for unverified hostnames |
| **Project domain authorization** | Dashboard → Settings → Domains (or `POST /v9/projects/{id}/domains`) | Registers hostname as an allowed edge host — required for the edge to serve traffic |

The workflow only calls the alias API. If a custom domain was ever removed from the project's Settings → Domains list (e.g., via dashboard during a Vercel project reconfigure), the edge will block it with `host_not_allowed` — while the alias API continues to return 200 on every deploy.

Evidence the gap existed at least since the last successful deploy (2026-06-19): both domains were returning 403 at the time of this check.

---

## Issues / Action Items

### P0 — SITE IS DOWN — Immediate manual action required

Go to the Vercel Dashboard → `caua-mvp` project → **Settings → Domains**:

1. Verify `cacaofrutabrutal.com` is listed. If not → **Add Domain**.
2. Verify `www.cacaofrutabrutal.com` is listed. If not → **Add Domain**.
3. Confirm DNS is correct:
   - Apex `cacaofrutabrutal.com` → `A 76.76.21.21` (Vercel)
   - `www` → `CNAME cname.vercel-dns.com`
4. Once both show **"Valid Configuration"**, traffic resumes within minutes.

Verify fix: `curl -sI https://cacaofrutabrutal.com | grep -iE 'http|x-vercel-id'` should show `HTTP/2 200` and `x-vercel-id: ...`.

### P1 — Workflow silent failure: add post-alias liveness check

The `promote-alias` job treats alias API 200 as a proxy for site health. It is not. Add a verification step:

```yaml
- name: Verify production is live
  run: |
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://cacaofrutabrutal.com)
    if [ "$STATUS" != "200" ]; then
      echo "::error::Production returned HTTP $STATUS after alias promotion — domain may have been removed from Vercel project domains list"
      exit 1
    fi
    echo "✅ Production live at HTTP $STATUS"
```

This would have caught the outage on the first deploy instead of silently passing.

### P2 — 6 build failures on 2026-06-18

All during a 30-min web3 iteration window. TypeScript/build errors at the Vercel side (not surfaced by the deploy hook). Check Vercel build logs for those SHAs if investigation needed. The sprint stabilized with 10 consecutive successes afterward — no action needed, but worth auditing if any broken state was pushed to production.

### P3 — Vercel MCP not connected

Future runs should have the Vercel MCP available for direct deployment state, domain verification, and build log access. Without it, all Vercel-side checks fall back to GH Actions proxy and may miss edge-level failures (as this outage demonstrates).

---

## Vercel MCP Tools Used
*None — Vercel MCP server was not connected during this run.*

## GitHub MCP Tools Used
- `mcp__github__actions_list` — `list_workflow_runs`, `list_workflow_jobs`
- `mcp__github__get_job_logs`
