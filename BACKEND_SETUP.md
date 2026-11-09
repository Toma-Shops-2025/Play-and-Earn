# Backend, auth & payouts setup

Recommended order:

1. **Supabase** — database + auth (source of truth for balances when signed in)
2. **Optional** — automatic PayPal **Payouts** when you enable ops (see `MONETIZATION.md`, `AUTOMATION.md`)

The shipped app does **not** sell coin packs. PayPal credentials are for the **payout worker**, not in-app purchases.

**Operator checklist:** [docs/OPERATOR_CHECKLIST.md](./docs/OPERATOR_CHECKLIST.md)

## 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Run all SQL files in `supabase/migrations/` in order (or `supabase/ALL_MIGRATIONS_IN_ORDER.sql` once).
3. Enable auth providers under Authentication → Providers:
   - **Google** (recommended for Android) — create OAuth credentials in Google Cloud, add authorized redirect URI `https://YOUR_PROJECT.supabase.co/auth/v1/callback`, paste Client ID/Secret into Supabase Google provider. To brand the sign-in screen as **Play N' Earn**, see **[docs/GOOGLE_SIGNIN_BRANDING.md](./docs/GOOGLE_SIGNIN_BRANDING.md)** (Google will still show your `*.supabase.co` hostname unless you add a custom auth domain).
   - **Email** — enable for sign-in (disable confirm email for faster testing if you want).
4. In Authentication → URL Configuration, add your site URL (GitHub Pages / localhost) to **Redirect URLs**.
5. For local dev, add to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## 2. Edge functions (payouts)

Deploy from the **repo root** (folder must contain `supabase/functions/`):

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_REF
supabase secrets set \
  PAYPAL_CLIENT_ID=your_client_id \
  PAYPAL_CLIENT_SECRET=your_secret \
  PAYPAL_MODE=sandbox \
  CRON_SECRET=your_long_random_string \
  PAYPAL_PAYOUTS_ENABLED=false
supabase functions deploy process-pending-payouts --no-verify-jwt --yes
```

Keep `PAYPAL_PAYOUTS_ENABLED=false` until PayPal Business **Payouts** is enabled and you accept real-money ops risk.

Full automation: **[AUTOMATION.md](./AUTOMATION.md)**.

## 3. Withdrawals (user flow)

Users save **PayPal** or **Cash App** on the Payouts tab. `request_withdrawal` creates a `pending` row. The worker `process-pending-payouts` sends PayPal Payouts when enabled.

## 4. Security

- Never put `PAYPAL_CLIENT_SECRET` or `SUPABASE_SERVICE_ROLE_KEY` in the client app.
- Use `PAYPAL_MODE=live` only in production secrets.

---

## Appendix — legacy coin-pack checkout (not in app UI)

These remain in the repo for possible future use or Play Billing experiments. **No setup required** for the current product.

| Artifact | Purpose |
|----------|---------|
| `create-paypal-order`, `complete-paypal-order`, `paypal-webhook` | PayPal checkout for virtual coin packs |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Baked into static build if you re-mount `CoinPacks` |
| `src/components/play-earn/coin-packs.tsx` | Unmounted component |
| Migration `20260322000005_paypal_payments.sql` | `payment_fulfillments` table |

To enable legacy web packs: set `NEXT_PUBLIC_PAYPAL_CLIENT_ID` in GitHub + `.env.local`, deploy the three checkout functions, mount `CoinPacks` in the UI, and test `/?paypal=success` return handling (`paypal-return.tsx`).

Digital coin sales **inside** the Android app must use **Google Play Billing**, not PayPal in a WebView.
