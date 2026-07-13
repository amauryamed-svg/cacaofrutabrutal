# Vercel Deploy Health Report
Timestamp: 2026-07-13T14:30:00Z
Window: last 7 days (2026-07-06 → 2026-07-13)
Project: caua-mvp (Vercel MCP installed but `enabledInChat: false`)

## Summary: ⚠️ WARN

GitHub Actions deploy pipeline is **100% green** (3 runs in 7d, 0 failures). Today's run
(2026-07-13T14:03–14:04 UTC) triggered the Vercel hook **and** completed alias promotion,
confirming `VERCEL_DEPLOY_HOOK_URL`, `VERCEL_TOKEN`, and the `cacaofrutabrutal.com` /
`www.cacaofrutabrutal.com` alias assignment are all working correctly.

**5 of 9 checks remain unverifiable** due to two persistent infrastructure constraints:

1. **Egress proxy blocks `cacaofrutabrutal.com:443`** — all curl-based site checks fail with
   `CONNECT tunnel failed, response 403` from the pre-configured proxy at `127.0.0.1:46101`.
   This is the **59th consecutive run** with this proxy block.
2. **Vercel MCP connector is installed but `enabledInChat: false`** — deployment-level queries
   (deploy list, build logs, domain alias state) remain unavailable from this environment.

**No evidence of production downtime** — the alias promotion job explicitly set both aliases
to the latest READY deployment at 14:04:32 UTC today. Site likely healthy from Vercel's side.

**Action required from owner:** Enable the Vercel connector in claude.ai chat settings so
future health runs can directly inspect deployment state and domain aliases.

---

## Deploy activity (7d) — GitHub Actions (Vercel MCP unavailable)

- **Total gh runs: 3 | success: 3 | failure: 0**
- Last READY deploy: sha `4543d37` — "chore: health report 2026-07-13" — 0h ago — 60s total
  - Trigger job: 14:03:38→14:03:44 (6s)
  - Alias promotion job: 14:03:46→14:04:35 (49s); aliases SET at 14:04:32
- Previous run: sha `33cc33e` — "chore: health report 2026-07-06" — 7d ago — 125s
- Oldest in window: sha `d55afb4` — "chore: health report 2026-07-06" — 7d ago — 59s
- **Last real code deploy:** `16ed059` — 2026-06-26T04:23Z — **17 days ago**
  - "fix(seed): include email column in cdp-reviewer upsert + resolve merge conflicts"
- **Last ERROR deployment: none** detected via GitHub Actions (all 118 recorded runs = success)

> Note: All 3 commits in the 7-day window are automated health-report chore commits. No
> substantive feature work was pushed in this window.

---

## Build performance — GitHub Actions timing

| SHA     | Date       | Trigger job | Alias job | Total |
|---------|------------|-------------|-----------|-------|
| 4543d37 | 2026-07-13 | 6s          | 49s       | 60s   |
| 33cc33e | 2026-07-06 | —           | —         | 125s  |
| d55afb4 | 2026-07-06 | —           | —         | 59s   |

Average over last 3 runs: **~81s**

Verdict: **OK** — well under the 4-minute WARN threshold. Build cache appears healthy
(health-report-only commits complete in 49–125s end-to-end including the 45s initial wait).

> Vercel build time itself is not directly observable from GitHub Actions job timing.
> The workflow sleeps 45s before polling, so actual build time is ≤ (alias job time − 45s) ≈ 4s,
> indicating Vercel build cache is active and working.

---

## Domains — inferred from workflow job output

**VERCEL_TOKEN is confirmed active**: the "Set production aliases" step executed (not skipped)
at 14:04:32 UTC today. Per workflow logic, this step calls:
```
POST /v2/deployments/<id>/aliases   body: {"alias":"cacaofrutabrutal.com"}
POST /v2/deployments/<id>/aliases   body: {"alias":"www.cacaofrutabrutal.com"}
```
Both would fail with non-200 HTTP codes causing job failure — which did not happen.

- `cacaofrutabrutal.com` → deployment for sha `4543d37` (READY, inferred) ✅
- `www.cacaofrutabrutal.com` → same deployment ✅

**Cannot directly confirm** via Vercel API or curl — Vercel MCP not enabled + proxy block.

---

## Checks

| # | Check | Status | Detail |
|---|-------|--------|--------|
| 1 | Site availability | ⚠️ BLOCKED | Proxy at 127.0.0.1:46101 rejects CONNECT to cacaofrutabrutal.com:443 (59th consecutive block) |
| 2 | Bundle freshness | ⚠️ BLOCKED | Cannot fetch site HTML — same proxy block |
| 3 | Vercel deploys 7d | ⚠️ PARTIAL | Vercel MCP not enabled; gh: 3 runs, 0 errors, 3 successes |
| 4 | Build duration | ✅ OK | Last 3 runs avg ~81s — well under 4-min threshold; cache active |
| 5 | Domain alias | ✅ INFERRED OK | Alias promotion job ran & succeeded at 14:04:32Z today for both domains |
| 6 | Failed deploy logs | ✅ N/A | 0 failures in last 7 days; nothing to fetch |
| 7 | gh ↔ Vercel cross-check | ⚠️ PARTIAL | gh: 3 success runs; Vercel side unqueryable; no mismatch evidence |
| 8 | Workflow integrity | ✅ PASS | No changes to deploy-vercel.yml or vercel.json in last 7 days |
| 9 | SPA routes | ⚠️ BLOCKED | Proxy block prevents curl to /fund, /app/adoptar, /investor-landing.html |

---

## Failed deployments (last 7 days)

None. All GitHub Actions runs concluded `success`.

---

## Issues / Action items

1. **[RECURRING — CRITICAL] Enable Vercel MCP in this chat session.**
   The Vercel connector is installed (`enabledInChat: false`) but turned off for this session.
   Until it's enabled, 5/9 health checks remain unverifiable every week.
   Fix: claude.ai → Settings → Connectors → Vercel → Enable in chat.

2. **[RECURRING — CRITICAL] Egress proxy blocks cacaofrutabrutal.com.**
   The monitoring environment (`127.0.0.1:46101`) has blocked CONNECT to the production domain
   for 59+ consecutive weekly runs. Direct site health checks (availability, bundle freshness,
   SPA routes) have been blind since at least 2026-06-26. Options:
   - Add `cacaofrutabrutal.com` to the proxy allowlist in the environment config
   - Route monitoring through a GitHub Actions cron job that CAN reach the production domain
   - Use an external uptime monitor (Better Uptime, Checkly, etc.) as the source of truth

3. **[MONITORING HYGIENE] Weekly health-report commits are triggering Vercel deploys.**
   Each health monitor run commits a file and pushes to main, firing the deploy hook. This means
   every week there is a "phantom" Vercel deployment of unchanged source code (only the health
   report MD changes). Low cost, but adds noise to the Vercel deployment history. Consider:
   not pushing when no real changes are found, or pushing to a non-main branch.

4. **[INFO] No new code deployed in 17 days.**
   Last substantive commit: `16ed059` (2026-06-26). No feature work pushed since. This may be
   intentional (stable period) but worth confirming the codebase isn't stalled.

---

## Vercel MCP tools used

None — Vercel MCP connector is `enabledInChat: false`. All deployment data inferred from:
- `mcp__github__actions_list` (list_workflow_runs, list_workflow_jobs)
- `mcp__github__list_commits`
- `ListConnectors` (connector status check)
- `git log`, local file reads for workflow/vercel.json inspection
- `curl -sv` (proxy-blocked; returned headers only from proxy, not site)
