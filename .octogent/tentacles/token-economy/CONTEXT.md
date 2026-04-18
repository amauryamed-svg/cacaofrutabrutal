# Tentacle: token-economy

## Domain
Dual-token system — beans (high-frequency) and mazorcas (milestone-based), earning events, balance management, and redemption mechanics.

## What This Domain Owns
- `/src/components/ui/TokenBalance.tsx` — Live balance display (beans + mazorcas)
- `/src/components/ritual/TokenReward.tsx` — Floating token reward animation popup
- `/src/hooks/useTokenBalance.ts` — Reads `beans_balance` + `mazorcas_balance` from `user_profiles`
- `/supabase/functions/award-tokens/index.ts` — The single Edge Function for all token mutations
- `TOKEN_RATES` constant in `/src/utils/constants.ts` — Canonical earning rates

## Token Design

### Two Tokens
| Token | Type | Typical earning | Typical value |
|-------|------|-----------------|---------------|
| **beans** | Fractional (decimal) | Daily rituals, blog reads, care actions | Small but frequent |
| **mazorcas** | Integer (whole units) | Adoptions, streaks, lot investments, referrals | Rare but significant |

### Why Two Tokens?
- Beans drive **daily engagement** — ritual draws, care actions, blog reads earn small amounts every day
- Mazorcas drive **milestone behavior** — only earned at meaningful commitments (adoption, lot purchase, 7-day streaks)
- Users see both balances at all times — the contrast motivates both daily habits and larger investments

## Earning Rate Table (TOKEN_RATES in constants.ts)

| Event Type | Beans | Mazorcas |
|------------|-------|----------|
| `ritual_draw` | +0.5 | +0 |
| `streak_7` | +3.5 | +1 |
| `streak_30` | +15.0 | +5 |
| `purchase_per_usd` | +2.0 (per USD) | +0 |
| `lot_per_lot` | +5.0 | +2 |
| `blog_read` | +0.2 | +0 |
| `blog_share` | +1.0 | +0 |
| `referral` | +10.0 | +3 |
| `tree_adoption` | +10.0 | +3 |
| `tree_update_read` | +0.5 | +0 |
| `tree_harvest_share` | +5.0 | +2 |
| `referral_bonus_referred` | +5.0 | +1 |

## Data Model

### `user_profiles` columns (token-relevant)
```
beans_balance    numeric  (current spendable balance, decrements on redemption)
mazorcas_balance int      (current spendable balance)
beans_lifetime   numeric  (cumulative beans ever earned — NEVER decremented, used for tier calculation)
```

### `token_events` table (immutable ledger)
```
id          uuid PK
user_id     uuid FK → auth.users
event_type  text (one of the event types above)
beans       numeric
mazorcas    int
ref_id      uuid (optional — reference to the tree/order/post that triggered the event)
created_at  timestamptz
```

RLS: users can only SELECT their own rows. INSERT restricted to service_role (Edge Function uses it).

## award-tokens Edge Function (`supabase/functions/award-tokens/index.ts`)

This is the **single source of truth** for all token mutations. Architecture:
1. Receives POST with `{ event_type, ref_id }` + user JWT
2. Verifies JWT to get `user_id`
3. Looks up `beans` and `mazorcas` from a local rate table (mirrors TOKEN_RATES)
4. Inserts row into `token_events`
5. Updates `user_profiles` atomically:
   ```sql
   UPDATE user_profiles
   SET beans_balance = beans_balance + $beans,
       mazorcas_balance = mazorcas_balance + $mazorcas,
       beans_lifetime = beans_lifetime + $beans
   WHERE user_id = $userId
   ```
6. Returns `{ success, new_beans_balance, new_mazorcas_balance }`

**Never update `beans_balance` or `mazorcas_balance` directly from the frontend.** All mutations must go through this Edge Function.

## Token Redemption (NOT YET IMPLEMENTED)

The redemption path — spending beans/mazorcas for product discounts — does not exist yet. Design spec:

- Beans → product discount: e.g., 10 beans = $1 off at Marketplace checkout
- Mazorcas → gated access: early batch access, exclusive products, future farm visit tickets
- A `redeem-tokens` Edge Function must be created (mirrors award-tokens but decrements balances)
- Redemption must be atomic: check balance, verify product availability, decrement balance, apply discount — all in one DB transaction
- Never allow redemption to push `beans_balance` below 0

## Components

### TokenBalance.tsx
Displays current `beans_balance` and `mazorcas_balance` in the NavBar. Reads from `user_profiles` via `useTokenBalance` hook. Should ideally subscribe to Realtime for live updates (not yet wired).

### TokenReward.tsx
Floating animation popup that appears when tokens are awarded (e.g., after ritual draw). Receives `{ beans, mazorcas }` as props and animates them rising off screen. Used in `Ritual.tsx` after each card draw.

## Current Critical Gaps

1. **Token redemption not implemented** — Users can earn but cannot spend. This is the missing half of the flywheel.
2. **streak_7 and streak_30 awards not triggered** — Only `ritual_draw` fires currently. Streak milestone checks are not in the Ritual page.
3. **blog_read not wired in BlogPost.tsx** — The `blog_read` event is defined in TOKEN_RATES but never called.
4. **Referral signup bonus not triggered** — The `user_referrals` table exists but the token award on referral signup is not wired.
