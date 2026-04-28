---
name: CauaBonga economy.md first draft
description: economy.md written 2026-04-28; key GDD conflicts found; 10 open balance questions; regen multiplier curve issue flagged
type: project
---

`economy.md` drafted at `.octogent/tentacles/cauabonga/economy.md` (v0.1, 2026-04-28).

**Why:** CauaBonga P2E farming-sim needs a documented token economy before implementation begins. Feeds into `token-economy` tentacle handoff (new event_type values needed in award-tokens Edge Function).

**Key decisions made:**
- Daily emission hard cap: 200 mz/user/day (server-enforced)
- Quest sub-cap revised DOWN from GDD §11's 200 mz to 120 mz (inflation risk)
- Second plot cost confirmed at 500 mz (GDD §18 open question #2 resolved, pending balance-check)
- Seed costs are the primary recurring sink; full-field replanting consumes ~663 mz/day (exceeds daily yield — intended pacing gate)
- No new fungible token (Charter §10 compliance confirmed)

**Critical GDD conflict found (§4.4):**
GDD §7 states "regen wins after ~5 harvest cycles" implying traditional is better early. Under current flat 1.30× regen multiplier, regen is ahead from cycle 1 — the teaching moment never exists. Recommendation: soil-dependent regen multiplier (Option A: 1.10× at soil 31–60, 1.25× at 61–85, 1.40× at 86–100). Needs `/balance-check` and game-designer sign-off.

**Fallow cost analysis clarification:**
Traditional's real advantage is cycle speed (3h–8h vs. regen's cycle + 1-day fallow). Over 16 days, traditional completes 48 cycles vs. regen's 12. Traditional wins on total mz in the first 2 weeks. Regen wins over any 4+ week horizon due to soil compounding and 60-day infertility cooldown for traditional.

**10 open balance questions in §9** — priority order for /balance-check:
1. Regen multiplier curve (highest priority — affects core educational thesis)
2. Quest cap (120 vs 200 mz)
3. Claim diminishing return thresholds
4. Plot-mint cost (500 vs 1000 mz)
5–10: v1.1 concerns (care deficit debuff, soilTier reset on transfer, abandonment scar, etc.)

**How to apply:** When revisiting CauaBonga economy, start from §9 open questions. Regen multiplier curve (#1) must be resolved before yield tables are finalized.
