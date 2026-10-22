# Backend, auth & payments setup

Recommended order:

1. **Supabase** — database + auth (source of truth for balances when signed in)
2. **PayPal** — coin pack purchases (web / mobile browser)
3. **Withdrawals** — virtual ledger in-app; real PayPal **Payouts** only when you enable ops (see MONETIZATION.md)

## 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Run all SQL files in `supabase/migrations/` in order in the SQL editor.
3. Enable **Email** auth under Authentication → Providers.
4. Add to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-sandbox-client-id
```

## 2. PayPal coin packs

1. Create apps at [PayPal Developer](https://developer.paypal.com/dashboard/) (Sandbox for testing).
2. Copy **Client ID** → `NEXT_PUBLIC_PAYPAL_CLIENT_ID` (app) and `PAYPAL_CLIENT_ID` (edge secrets).
3. Copy **Secret** → Supabase secret `PAYPAL_CLIENT_SECRET` only.
4. Deploy edge functions:

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_REF
supabase secrets set \
  PAYPAL_CLIENT_ID=your_client_id \
  PAYPAL_CLIENT_SECRET=your_secret \
  PAYPAL_MODE=sandbox
supabase functions deploy create-paypal-order
supabase functions deploy complete-paypal-order
supabase functions deploy paypal-webhook --no-verify-jwt
```

5. Optional webhook in PayPal Dashboard → your app → Webhooks:

`https://YOUR_REF.supabase.co/functions/v1/paypal-webhook`

Events: `PAYMENT.CAPTURE.COMPLETED`, `CHECKOUT.ORDER.COMPLETED`

6. Sign in → **Profile → Buy coin packs** → approve in PayPal → return URL credits coins.

### Return URL

PayPal redirects to `/?paypal=success&token=ORDER_ID`. The app calls `complete-paypal-order` to capture and credit coins (idempotent).

### Google Play note

Digital coin sales **inside** the Android app must use **Google Play Billing**, not PayPal in a WebView. Use PayPal on web or external browser until Play Billing is added.

## 3. Withdrawals (automatic PayPal payouts)

Users can enter a PayPal email on cashout. A scheduled worker (`process-pending-payouts`) can send [PayPal Payouts](https://developer.paypal.com/docs/payouts/) automatically — see **[AUTOMATION.md](./AUTOMATION.md)**.

## 4. Environment reference

See `.env.example`.

## 5. Security

- Never put `PAYPAL_CLIENT_SECRET` or `SUPABASE_SERVICE_ROLE_KEY` in the client app.
- Use `PAYPAL_MODE=live` only in production secrets.
