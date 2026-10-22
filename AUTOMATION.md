# Automation guide

What runs **automatically** in this project and how to turn it on.

## Already automatic (no setup)

| Feature | How |
|---------|-----|
| **3-hour coin → cash** | Timer in app + `sync_conversion` on server |
| **PayPal coin packs** | User returns from PayPal → `complete-paypal-order` credits coins |
| **PayPal pack backup** | `paypal-webhook` (if configured in PayPal Dashboard) |
| **Ad / game economy** | Server RPCs enforce limits when signed in |

## 1. Automatic PayPal withdrawals (optional)

**Only enable when** `realMoneyPayoutsEnabled` is true in `economy-config.ts`, you accept legal/tax risk, and your PayPal Business account has **Payouts** enabled.

### Supabase secrets

```bash
supabase secrets set \
  PAYPAL_PAYOUTS_ENABLED=true \
  CRON_SECRET=long-random-string \
  PAYPAL_CLIENT_ID=... \
  PAYPAL_CLIENT_SECRET=... \
  PAYPAL_MODE=sandbox
```

Deploy the worker:

```bash
supabase functions deploy process-pending-payouts --no-verify-jwt
```

Run migration `20260322000006_payout_automation.sql`.

### User flow

1. User enters **PayPal email** on cashout (Profile / wallet card when signed in).
2. `request_withdrawal` creates a `pending` row with `payout_email`.
3. **Cron** calls `process-pending-payouts` every 15 minutes (see below).
4. Worker sends PayPal Payouts API requests and marks rows `completed` or `failed`.

### Manual test

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  "https://YOUR_PROJECT.supabase.co/functions/v1/process-pending-payouts"
```

## 2. GitHub Actions (recommended)

Add these **repository secrets** (Settings → Secrets → Actions):

| Secret | Purpose |
|--------|---------|
| `SUPABASE_ACCESS_TOKEN` | [Supabase account token](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_PROJECT_REF` | Project ref from dashboard URL |
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `CRON_SECRET` | Same value as Supabase `CRON_SECRET` |

Workflows in `.github/workflows/`:

- **`deploy-backend.yml`** — deploys PayPal + payout edge functions on push to `main` when `supabase/` changes.
- **`process-payouts-cron.yml`** — calls the payout worker every **15 minutes**.

Migrations are **not** auto-applied (safer). After new SQL files, run them in the Supabase SQL editor or use `supabase db push` locally.

## 3. Without GitHub Actions

Use any cron (Vercel Cron, cron-job.org, server crontab):

```cron
*/15 * * * * curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://YOUR_PROJECT.supabase.co/functions/v1/process-pending-payouts
```

## 4. Android / web app releases

- **Web:** connect repo to Vercel/Netlify — build `npm run build`, output `out/`.
- **Android:** GitHub Action for signed AAB is not included (keystore must stay private). Build locally or add your own `upload-play-store` workflow with encrypted keystore secrets.

## Safety checklist

- Keep `PAYPAL_PAYOUTS_ENABLED=false` until you are ready for real money out.
- Use **sandbox** until end-to-end tests pass.
- Monitor `withdrawals` table for `failed` and `failure_reason`.
