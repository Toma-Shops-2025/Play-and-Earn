# Backend, auth & payments setup

Recommended order (what this repo implements):

1. **Supabase** — database + auth (source of truth for balances when signed in)
2. **Stripe** — coin pack purchases (web checkout; see Play Billing note below)
3. **Manual / Connect payouts** — withdrawal rows are created in the DB; you fulfill via PayPal Payouts or Stripe Connect in a later ops step

## 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → paste and run `supabase/migrations/20260322000000_init.sql`.
3. Under **Authentication → Providers**, enable **Email** (password).
4. Copy **Project URL** and **anon public** key into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

5. Restart the dev server / rebuild the mobile bundle.

When signed in, the app calls RPCs (`get_wallet`, `grant_game_coins`, etc.) so clients cannot forge balances.

## 2. Stripe coin packs (web)

1. Create a [Stripe](https://stripe.com) account and get test keys.
2. Deploy edge functions (Supabase CLI):

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_REF
supabase secrets set STRIPE_SECRET_KEY=sk_test_... STRIPE_WEBHOOK_SECRET=whsec_...
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook --no-verify-jwt
```

3. In Stripe Dashboard → **Developers → Webhooks**, add endpoint:

`https://YOUR_REF.supabase.co/functions/v1/stripe-webhook`

Events: `checkout.session.completed`

4. Add to `.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

5. Sign in → **Profile → Buy coin packs**.

### Google Play note

Selling **digital coins inside the Android app** must use **Google Play Billing**, not Stripe in a WebView. Use Stripe for **web** users or a **mobile browser** flow only until Play Billing is integrated. Misusing external checkout in-app is a common Play rejection.

## 3. Withdrawals (real money)

`request_withdrawal` creates a `pending` row and zeros the user’s **virtual** cash balance in the database. It does **not** automatically send money.

To pay users for real:

- Complete KYC / legal review for your regions
- Integrate **Stripe Connect Express** or **PayPal Payouts**
- Add an admin job or edge function that moves `pending` → `processing` → `completed` with audit logs

Until then, treat cash balances as **loyalty points** in copy and Play Console declarations.

## 4. Environment reference

See `.env.example` for all variables.

## 5. Security checklist

- Never put `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` in the mobile app
- Rotate keys if leaked
- Re-run Data safety in Play Console when you collect email / payment info
