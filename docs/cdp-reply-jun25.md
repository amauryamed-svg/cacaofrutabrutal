# CDP Support Reply — 25 Jun 2026

**To:** cdp-support@coinbase.com (reply to Support Hub case)
**From:** Amaury Amed · amaury@cauaculture.co
**Re:** Re: Test credentials / email login

---

Hi Rishabh,

Thanks for the follow-up. We've just shipped a **magic link** login option so you don't need a Google account to access the app. Here's how to log in:

1. Go to **https://cacaofrutabrutal.com/auth?next=/web3**
2. Enter `rishabh.jain@coinbase.com` in the email field and click **"Send link"**
3. Click the link in your inbox — you'll land directly on `/app/web3`

> **One-time step:** the first login creates your account. **Reply to this email or ping me directly once you're in**, and I'll immediately provision your account with:
> - KYC status: `verified`, Tier 1
> - Wallet pre-linked: `0x7E9E25cFfc8BC68Fb9E1f4708e761C68a37a846A` (Base mainnet)
> - Geo-block: disabled, country set to `US`
>
> After that, the **"BUY USDC WITH CARD · BASE"** button on `/app/web3` will be active with no extra steps.

---

**What to verify once provisioned:**

| Check | Expected |
|-------|----------|
| POST `/functions/v1/coinbase-onramp-session` | `200 { ok: true, session_token: "...", onramp_url: "..." }` |
| Onramp URL format | `pay.coinbase.com/buy?sessionToken=...` — **no `addresses=` or `walletAddress=` param** |
| Logged-out click | Frontend returns `login_required` |
| Fresh account click | Backend returns `kyc_required` |

The preset is hardcoded at `$5` to stay within sandbox limits — no need to complete a real purchase; just confirming the session-token call returns 200 and the popup opens is sufficient.

---

Happy to jump on a quick screen share if anything doesn't load.

Best,

Amaury Amed
Co-Founder & CTO — Caúa Colombia SAS / WA'KA1 CORP
amaury@cauaculture.co | cacaofrutabrutal.com
