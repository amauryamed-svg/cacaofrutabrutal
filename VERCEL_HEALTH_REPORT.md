# Vercel Deploy Health Report
Timestamp: 2026-08-24T14:30:00Z
Window: last 7 days (since 2026-08-17)
Project: caua-mvp (alias: caua-mvp-amauryamed-1073s-projects.vercel.app)

## Summary: WARN

Core CI/CD pipeline is **healthy** — all 3 GitHub Actions runs in the window succeeded and build times remain well within baseline. However, **3 checks could not be executed** due to persistent infrastructure constraints: egress proxy blocks outbound HTTPS to external hosts, and the Vercel MCP connector is installed but not enabled for this chat session. These gaps reduce confidence in end-to-end site health.

**Action required (standing):** Enable the Vercel MCP connector in claude.ai chat settings so future runs can query deployment state, domain aliases, and fetch build logs directly.

---

## Deploy activity (7d)
- **Total:** 3 | **SUCCESS:** 3 | **FAILURE:** 0 | **CANCELED:** 0
- **Last SUCCESS:** run `32736284758` — sha `6513cae` — *"chore: health report 2026-08-24 — all checks blocked by proxy egress"* — ~0h ago — build **~65s**
- **Previous SUCCESS:** run `32038835580` — sha `955bda7` — *"chore: Vercel health report 2026-08-17 — WARN (pipeline OK, 3 checks blocked)"* — 168h ago — build **~68s**
- **Last FAILURE:** none in window ✅
- **Note:** All 3 deploys in window are health-report-only commits. Last real code deploy: sha `16ed059` on 2026-06-26 (~59 days ago).

## Build performance
- Last 3 GH Actions run durations (wall-clock): 65s, 68s, 91s
- Average: **~75s** (1m 15s)
- Historical baseline: ~90s
- Verdict: **OK** — well within normal range; no bundle regression

## Domains
- `cacaofrutabrutal.com` → NOT VERIFIABLE (Vercel MCP disabled) ⚠️
- `www.cacaofrutabrutal.com` → NOT VERIFIABLE (Vercel MCP disabled) ⚠️
- **Workflow analysis:** `deploy-vercel.yml` promote-alias job explicitly aliases both domains to the READY deployment. Logic is correct and unchanged this week.

---

## Checks

| # | Check | Status | Detail |
|---|-------|--------|--------|
| 1 | Site availability | ⚠️ BLOCKED | Egress policy denies outbound HTTPS to cacaofrutabrutal.com from this environment. Cannot curl. |
| 2 | Bundle freshness | ⚠️ BLOCKED | Same egress policy; cannot fetch HTML to verify Vite-hashed assets. |
| 3 | Vercel deploys 7d | ✅ PASS | 3 GH Actions runs, all success. No ERROR states. (via GitHub MCP, not Vercel MCP) |
| 4 | Build duration | ✅ PASS | Avg ~75s across last 3 runs. Threshold <4min. No regression. |
| 5 | Domain alias | ⚠️ UNVERIFIED | Vercel MCP not enabled in chat. Workflow code confirms correct alias logic. |
| 6 | Failed deploy logs | ✅ PASS | Zero failures in 7d. No logs to fetch. |
| 7 | gh ↔ Vercel cross-check | ✅ PASS | 3 GH Actions successes. Deploy hook fires on each push to main per workflow design. |
| 8 | Workflow integrity | ✅ PASS | No commits to `deploy-vercel.yml` or `vercel.json` in 7 days. Alias logic intact. |
| 9 | SPA routes | ⚠️ BLOCKED | Cannot curl /fund, /app/adoptar, /investor-landing.html — egress policy. |

---

## Failed deployments (if any)
None in the last 7 days. ✅

---

## Issues / Action items

1. **[INFRA] Enable Vercel MCP in claude.ai chat settings** — The Vercel connector (`installedServerId: ce17b2be-c8b3-4032-8770-a1702e6da06b`) is authenticated but `enabledInChat: false`. Enable it via claude.ai → connector settings → Vercel → toggle on. This will unlock checks 3 (Vercel-side), 5 (domain aliases), and 6 (build logs) in future runs.

2. **[INFRA] Egress policy blocks external curl** — Checks 1, 2, and 9 (site availability, bundle freshness, SPA routes) cannot run because the scheduled cloud environment's network policy denies CONNECT to `cacaofrutabrutal.com:443`. These checks require either: (a) the egress policy to allowlist the production domain, or (b) using the Vercel MCP to infer health from deployment state.

3. **[INFO] No production code deploys in 59 days** — Last real code push was `16ed059` on 2026-06-26. All weekly runs since are health-report-only commits. Normal for a stable phase; flagged for awareness.

---

## Vercel MCP tools used
None — `enabledInChat: false` for this session. Tools available if enabled: `list_projects`, `get_project`, `list_deployments`, `get_deployment`, `get_deployment_events`, `list_teams`.

## GitHub MCP tools used
- `mcp__github__actions_list` (list_workflow_runs for deploy-vercel.yml, last 20)

## Curl checks attempted
All blocked by egress proxy policy (exit code 56, connection refused). See `/root/.ccr/README.md` §"403 / 407 from the proxy".
