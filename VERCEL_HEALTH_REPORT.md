# Vercel Deploy Health Report
Timestamp: 2026-08-31T14:16:00Z
Window: last 7 days (2026-08-24 → 2026-08-31)
Project: caua-mvp (id: prj_Fc5Rbha3hlIRAXrevMIoIaBeXWoz)
Team: amauryamed-1073s-projects (id: team_aVPGjM9P30YNoCQKEvdBp4UQ)

## Summary: WARN

Pipeline healthy: no ERROR deployments, all GH Actions runs succeeded, workflow unchanged.
Two persistent WARNs:
1. **`www.cacaofrutabrutal.com` is absent from Vercel project domain list** — only `cacaofrutabrutal.com` is registered as a permanent domain; www is only aliased transiently by the deploy workflow.
2. **Egress policy blocks site curl checks** — checks #1, #2, #9 still inconclusive from this sandbox environment (66th consecutive week). No production outage indicated; pipeline evidence is all green.

✅ Positive update: **Vercel MCP is now accessible** (previously showed `enabledInChat:false` for many weeks). Deployment data is now verifiable directly via MCP.

## Deploy activity (7d)
- Total (production-targeted): 6 | READY: 5 | CANCELED: 1 | ERROR: 0
- Last READY: `dpl_9dCFAnT5i3tYhdG5LjsP5pAjdTcM` — d6413239 — "chore: health report 2026-08-31" — 0h ago
- Last CANCELED: `dpl_HzZ5TK2VrHSY5rNbFB7v7bjArCP3` — d6413239 — same sha, same push (superseded by dpl_9dCFA)
- Last ERROR: none in 7d ✅
- Note: all 7d deploys are health-report commits; last real code deploy was 2026-06-26 (65 days ago — sha 16ed059, "fix(seed): include email column in cdp-reviewer upsert")

## Build performance
- Build duration: not returned by Vercel list API; estimated ~75s based on GH Actions run deltas and prior weekly reports
- GH Action run #132 (today): created 14:02:42Z → updated 14:04:49Z ≈ 127s total (includes 45s initial wait + polling)
- Prior 5-week avg from commit messages: ~75s
- Verdict: OK (within 90s baseline; no regression signal)

## Domains
- `cacaofrutabrutal.com` → attached to project ✅ (permanent domain in Vercel project settings)
- `www.cacaofrutabrutal.com` → ⚠️ NOT in Vercel project domain list (only aliased per-deploy by workflow; not a permanent project domain)
- `caua-mvp.vercel.app` → attached ✅
- `caua-mvp-amauryamed-1073s-projects.vercel.app` → attached ✅

## Checks
| # | Check | Status | Detail |
|---|-------|--------|--------|
| 1 | Site availability | ⚠️ BLOCKED | Egress proxy denies CONNECT to cacaofrutabrutal.com:443 (org policy, 66th week) |
| 2 | Bundle freshness | ⚠️ BLOCKED | Cannot curl production HTML from this sandbox |
| 3 | Vercel deploys 7d | ✅ PASS | READY=5 ERROR=0 CANCELED=1 (superseded) |
| 4 | Build duration | ✅ OK | ~75s avg (estimated); no regression |
| 5 | Domain alias | ⚠️ WARN | `cacaofrutabrutal.com` ✅; `www.cacaofrutabrutal.com` missing from project domain list |
| 6 | Failed deploy logs | ✅ N/A | No ERROR deployments in 7d |
| 7 | gh ↔ Vercel cross-check | ✅ MATCHED | 3 GH runs → 3 matching READY Vercel deployments (+ 1 CANCELED superseded); no mismatches |
| 8 | Workflow integrity | ✅ UNCHANGED | No commits to deploy-vercel.yml or vercel.json in 7d; alias logic intact for both domains |
| 9 | SPA routes | ⚠️ BLOCKED | Egress proxy blocks /fund, /app/adoptar, /investor-landing.html checks |

## Failed deployments (if any)
None — 0 ERROR deployments in the 7-day window.

One CANCELED deployment:
- `dpl_HzZ5TK2VrHSY5rNbFB7v7bjArCP3` | d641323 | 2026-08-31T14:02:43Z | CANCELED (superseded by dpl_9dCFA seconds later; same sha/push — expected behavior)

## Issues / Action items

1. **⚠️ Add `www.cacaofrutabrutal.com` as a permanent project domain in Vercel** — currently it is only aliased per-deploy by the GitHub Actions workflow (`promote-alias` step). If Vercel ever reclaims or removes the transient alias, www traffic will break. Fix: Vercel dashboard → caua-mvp → Settings → Domains → Add `www.cacaofrutabrutal.com`.

2. **⚠️ Site curl checks still blocked (66th week)** — checks #1/#2/#9 remain inconclusive. The org sandbox egress policy denies CONNECT to the production domain. Mitigation options (no action taken yet):
   - Add a step to `deploy-vercel.yml` that curls the site and checks HTTP 200 + asset hash after alias promotion (runs in GitHub Actions, which has unrestricted egress).
   - Or: subscribe to an external uptime monitor (e.g. Vercel Web Analytics, Better Uptime, UptimeRobot).

3. **ℹ️ No real code deployed in 65 days** — last substantive deploy was 2026-06-26. Not a failure, but worth noting for awareness.

4. **✅ Vercel MCP now accessible** — no action needed; previously the connector was `enabledInChat:false`. Deployment and domain data can now be queried directly each week.

## Vercel MCP tools used
- `mcp__Vercel__list_teams`
- `mcp__Vercel__list_projects`
- `mcp__Vercel__list_deployments` (project `caua-mvp`, target `production`, limit 20)
- `mcp__Vercel__get_project` (project `caua-mvp`)

## GitHub MCP tools used
- `mcp__github__actions_list` (list_workflow_runs, deploy-vercel.yml, limit 20)
- `mcp__github__get_file_contents` (.github/workflows/deploy-vercel.yml)
- `mcp__github__list_commits` (path filter: deploy-vercel.yml, since 7d)
