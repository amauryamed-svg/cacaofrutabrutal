# NOTES — token-economy

## Architectural Decisions

**[2026-04-18] award-tokens Edge Function is the single source of truth**
All token balance mutations — earning, spending, adjustments — must go through the `award-tokens` Edge Function (or a future `redeem-tokens` Edge Function). Never call `supabase.from('user_profiles').update({ beans_balance: ... })` directly from frontend code. This ensures the `token_events` ledger stays consistent with the balance columns.

**[2026-04-18] beans_lifetime is immutable — never decremented**
`beans_lifetime` accumulates all earned beans forever and is never decremented on redemption. `beans_balance` is the spendable amount. This separation allows tier calculations (Bronze/Silver/Gold) to be independent of spending behavior. A heavy spender should not lose tier status.

**[2026-04-18] Why not a blockchain token?**
Three reasons: (1) Target audience (Colombian consumers, EU eco-investors) is not crypto-native and values simplicity. (2) On-chain tokens would trigger securities regulation analysis in Colombia and the EU. (3) The token economy serves engagement and loyalty, not speculation — a database is simpler, faster, and sufficient for Phase 1. Revisit governance token only if community voting becomes a product feature.

**[2026-04-18] Earning event asymmetry is by design**
Lot investment earns 10× more than a ritual draw (+5 beans vs +0.5 beans). This asymmetry is intentional — financial commitment should feel more rewarding than casual engagement. Do not flatten the earning rates in an attempt to "balance" them.

**[2026-04-18] JWT_SECRET must be set in Edge Function secrets**
The `award-tokens` Edge Function verifies the user's JWT using `JWT_SECRET` (the Supabase JWT secret), not the anon key. This prevents token fraud — someone cannot call the Edge Function without a valid authenticated session.

## Known Risks

- The `redeem-tokens` function does not exist. A user who earns tokens has no way to spend them. This is the most significant product gap relative to the token flywheel design.
- streak_7 and streak_30 awards are defined in TOKEN_RATES but never triggered. Users with long streaks receive no bonus. This undermines streak motivation.
- There is no anti-abuse protection for `blog_read`. A bot could theoretically call the award-tokens function repeatedly. Rate-limiting (once per slug per user per day) must be added before the blog token award is wired.
