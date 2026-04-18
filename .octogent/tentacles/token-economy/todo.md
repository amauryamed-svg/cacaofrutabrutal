# todo — token-economy

## P1 — Q2 Meaningful Experience

- [ ] [P1] Implement `redeem-tokens` Edge Function: atomic balance check → decrement → apply discount code — mirrors `award-tokens` structure
- [ ] [P1] Define redemption rate table: beans-to-discount conversion per product category (e.g., 10 beans = $1 off tonics, 50 beans = $5 off subscriptions)
- [ ] [P1] Wire streak_7 award: in `Ritual.tsx`, after draw, check if `ritual_streak % 7 === 0` → call award-tokens with `streak_7` event
- [ ] [P1] Wire streak_30 award: same location, check `ritual_streak % 30 === 0` → call with `streak_30` event
- [ ] [P1] Build referral token flow: on user signup, check if `referral_code` param exists → award `referral` event to referrer + `referral_bonus_referred` to new user
- [ ] [P1] Add rate-limit: `blog_read` can only fire once per slug per user per day — check `token_events` for duplicate before calling award-tokens

## P2 — Q3–Q4 Scale

- [ ] [P2] Token tier system: Bronze (0–100 beans_lifetime) / Silver (100–500) / Gold (500+) — display tier badge in user profile + NavBar
- [ ] [P2] Build `TokenLedger` component: paginated table of `token_events` rows showing event type, beans, mazorcas, date — link from dashboard
- [ ] [P2] Wire Supabase Realtime subscription to `token_events` in `useTokenBalance` hook — live balance updates without page refresh
- [ ] [P2] Mazorcas gated access: implement unlock check at Marketplace — products marked `mazorca_gated: true` require N mazorcas to access
- [ ] [P2] Add `beans_lifetime` progress bar to user profile: show progress toward next tier threshold
