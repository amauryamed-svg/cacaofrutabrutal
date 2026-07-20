# Vercel Deploy Health Report
Timestamp: 2026-07-20T14:16:04Z
Window: last 7 days (2026-07-13 → 2026-07-20)
Project: caua-mvp (id: discovered via workflow; Vercel MCP not enabled — see §Limitations)

## Summary: ⚠️ WARN

Deploy pipeline is healthy — 2/2 gh Actions runs succeeded this week, both alias promotions
completed (VERCEL_TOKEN confirmed working, both domains aliased today at 14:04:07Z).
**WARN reason:** The monitoring sandbox egress policy blocks direct HTTPS to
`cacaofrutabrutal.com` for the 60th consecutive week, making checks #1, #2, #5 (domain
state), and #9 impossible. The Vercel MCP connector is installed but `enabledInChat: false`.
These are monitoring infrastructure gaps — not evidence of a production outage.

---

## Deploy activity (7d)
- **Total runs:** 2 | **SUCCESS:** 2 | **FAILURE:** 0 | **CANCELED:** 0
- **Last SUCCESS:** run #120 — sha `76252d6` — "chore: health report 2026-07-20" — 0h ago — pipeline 64s
- **Last FAILURE:** none in 7d (none in last 30 days across all 10 sampled runs)
- **Last real code deploy:** `16ed059` "fix(seed): include email column in cdp-reviewer upsert" — 2026-06-26 (24 days ago)

### 7-day runs detail
| Run ID | SHA | Title | Created | Duration | Conclusion |
|--------|-----|-------|---------|----------|------------|
| 29748918484 | 76252d6 | health report 2026-07-20 | 2026-07-20T14:03:07Z | 64s | success |
| 29257623193 | 2457776 | health report 2026-07-13 | 2026-07-13T14:21:53Z | 61s | success |

---

## Build / pipeline performance (last 5 successful runs)
| Run ID | Created | Total pipeline duration |
|--------|---------|------------------------|
| 29748918484 | 2026-07-20 | 64s |
| 29257623193 | 2026-07-13 | 61s |
| 29256326358 | 2026-07-13 | 60s |
| 28798427673 | 2026-07-06 | 190s |
| 28797544501 | 2026-07-06 | 125s |

- **Average pipeline time (last 5):** ~100s (~1.7 min)
- **Verdict: OK** — well under 4-min WARN threshold

> Note: These are total workflow durations (deploy-hook POST + poll-for-READY + alias-set),
> not the Vercel build time itself. The "Wait for deployment" step in today's run took 45s,
> implying the Vercel build completed within ~1 min of the hook being called.

---

## Domains
Vercel MCP is not enabled for this session (`enabledInChat: false`), so domain state cannot
be confirmed via the Vercel API directly. However, **today's "Promote latest READY deployment"
job succeeded** — step "Set production aliases" completed at 14:04:07Z with conclusion
`success`, meaning the Vercel API accepted both alias assignments.

- `cacaofrutabrutal.com` → aliased to sha `76252d6` deployment at 14:04:07Z (inferred from gh job success)
- `www.cacaofrutabrutal.com` → same deployment, same promotion step (inferred from gh job success)

---

## Checks
| # | Check | Status | Detail |
|---|-------|--------|--------|
| 1 | Site availability | BLOCKED | Egress proxy 403 on CONNECT to cacaofrutabrutal.com — sandbox policy, 60th consecutive week |
| 2 | Bundle freshness | BLOCKED | Cannot curl production site — same proxy restriction |
| 3 | gh Actions 7d | PASS | 2 runs, 2 success, 0 failures |
| 4 | Pipeline duration | PASS | avg 100s, well under 4-min WARN threshold |
| 5 | Domain alias | INFERRED OK | Alias promotion job succeeded today; Vercel MCP needed for direct confirmation |
| 6 | Failed deploy logs | N/A | Zero failures in 7d |
| 7 | gh <-> Vercel cross-check | PASS | Both gh successes -> "Set production aliases" step succeeded -> READY deployments confirmed |
| 8 | Workflow integrity | PASS | No changes to deploy-vercel.yml or vercel.json in last 7 days |
| 9 | SPA routes (/fund, /app/adoptar, /investor-landing.html) | BLOCKED | Cannot curl production site |

---

## Failed deployments
None in the last 7 days.

---

## Issues / Action items

### Persistent (known, pre-existing)
1. **Monitoring sandbox egress block (60 consecutive weeks):** The Claude Code remote execution
   environment's egress policy does not permit CONNECT tunnels to `cacaofrutabrutal.com`.
   Checks #1, #2, #9, and direct Vercel API calls are impossible from here. This is a sandbox
   policy issue, not a production issue. The deploy pipeline's own alias-promotion step (which
   runs on GitHub Actions, not this sandbox) confirms READY deployments are being aliased.
   **Action:** Enable the **Vercel MCP connector** in claude.ai connector settings
   (it is installed but `enabledInChat: false`). This alone unlocks deployment and domain
   state checks natively without needing curl to the production domain.

2. **No real code deploys in 24 days:** Last product commit was 2026-06-26. This may be
   intentional (feature freeze, CDP review period) but worth confirming if active development
   is expected.

---

## Vercel MCP tools used
None — `enabledInChat: false`. The connector is installed (directoryUuid:
`7eb42afe-0087-4493-a105-da2b021d5c03`) but toggled off for this session. Enable it in
claude.ai connector settings to unlock: `list_projects`, `get_project`, `list_deployments`,
`get_deployment`, `get_deployment_events`, `list_teams`.

## GitHub MCP tools used
- `mcp__github__actions_list` (list_workflow_runs, list_workflow_jobs)
- `mcp__github__actions_get` (get_workflow_run x 2)
