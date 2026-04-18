# todo — b2b-marketplace

## P1 — Q2 Meaningful Experience

- [ ] [P1] Implement Coinbase Commerce Edge Function (`create-coinbase-charge`) — USDC checkout for lot investments
- [ ] [P1] Wire `stripe-webhook` → `award-tokens` call after `checkout.session.completed`: +5 beans +2 mazorcas per lot purchased
- [ ] [P1] Add ROI calculator widget to `TechnologyCard.tsx`: input lot count → show projected return % (based on target price per kg output)
- [ ] [P1] Build lot-tier bulk pricing: 5 lots (10% off), 10 lots (20% off), 25 lots (30% off) — display in InvestModal
- [ ] [P1] Wire Marketplace product checkout to Stripe — currently redirects to Fund page; build dedicated checkout flow for individual products
- [ ] [P1] Wire `send-order-email` Edge Function to fire on confirmed lot investment (currently no email sent on confirmation)

## P2 — Q3–Q4 Scale

- [ ] [P2] `/cotizacion` B2B quote page — form that generates downloadable PDF with technology specs, COA fields, pricing, and EU regulatory status
- [ ] [P2] EU regulatory certification status badges per technology (Novel Food pending / approved / EFSA review)
- [ ] [P2] Real-time funding progress bar via Supabase Realtime subscription to `technologies` table
- [ ] [P2] Build `CAUA Labs` content page — visual diagram of 3 biotech processes (lyophilization, distillation, cold fermentation)
- [ ] [P2] Add investor-only gated content section (role=investor): production timeline, COA preview, lot status tracker
- [ ] [P2] Subscription management page for CÍRCULO SUMAPAZ ($45/mo) — handle recurring payments via Stripe Billing
