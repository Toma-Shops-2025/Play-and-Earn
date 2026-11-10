# Go live: real ads + real PayPal payouts

Use this when you are **intentionally** moving from test to production. Real payouts send **real money** from your PayPal Business balance.

**App code:** `realMoneyPayoutsEnabled` is already `true` in `src/lib/economy-config.ts`. Ads and payouts still need **dashboard + secrets + a new Android build**.

---

## Part 1 — Real ads (Unity LevelPlay)

### 1. Unity dashboard

1. [Unity LevelPlay](https://platform.unity.com/) → **Monetization** → add Android app **Play N' Earn**, package **`com.playearn.arcade`**.
2. Create **Rewarded** and **Interstitial** ad units → copy **App key** and both **Ad unit IDs**.
3. Enable **Unity Ads** (and networks you want).
4. For **production**: turn **off** test-mode / test devices so users see **live** ads (leave test mode on until one device smoke-test passes).

### 2. Android project

From repo root, edit `android/app/src/main/res/values/levelplay.xml` (template: `android/levelplay.xml.example`).

Replace the three `REPLACE_WITH_*` strings with your real keys — **never commit live keys to a public repo** if the repo is public (use a private fork or local-only commit).

```powershell
npm run build:mobile
.\build-apk.ps1 -Bundle
```

Upload the new **AAB** to Play Console (internal → production when ready).

### 3. Cloud ad rewards

Signed-in users already call `grant_ad_reward` after a completed ad. Ensure Supabase migrations **01–02** are applied (you did this).

---

## Part 2 — Real PayPal payouts

### 1. PayPal Business prerequisites

- [PayPal Business](https://www.paypal.com/business) account with **Payouts** enabled (not personal).
- [Developer Dashboard](https://developer.paypal.com/dashboard/) → **Live** (not Sandbox) app → **Client ID** + **Secret** with Payouts scope.

### 2. Supabase Edge secrets (PowerShell)

Repo root, after `supabase link --project-ref htntrbkswwoqjvjzvksg`:

```powershell
supabase secrets set `
  PAYPAL_MODE=live `
  PAYPAL_CLIENT_ID=YOUR_LIVE_CLIENT_ID `
  PAYPAL_CLIENT_SECRET=YOUR_LIVE_SECRET `
  PAYPAL_PAYOUTS_ENABLED=true `
  CRON_SECRET=YOUR_SAME_SECRET_AS_GITHUB

supabase functions deploy process-pending-payouts --no-verify-jwt --yes
```

`CRON_SECRET` must **match** GitHub Actions secret `CRON_SECRET`.

### 3. GitHub Actions

Confirm repository secrets exist:

| Secret | Value |
|--------|--------|
| `SUPABASE_URL` | `https://htntrbkswwoqjvjzvksg.supabase.co` |
| `CRON_SECRET` | Same as Supabase |
| `SUPABASE_ACCESS_TOKEN` / `SUPABASE_PROJECT_REF` | For function deploys |

Workflow **Process PayPal payouts** runs every 15 minutes and calls your worker.

### 4. Smoke test (before public launch)

1. Use **your own** test account on the app; sign in.
2. In Supabase SQL Editor (one-time test): set `cash_balance = 5.00` on your `profiles` row.
3. Save **your** PayPal email on Payouts → **Cash out**.
4. Check `withdrawals` → `pending` → after cron or manual POST to `process-pending-payouts`, status `completed` or `failed` (`failure_reason`).
5. Confirm **live** PayPal received the payment (small amount).

Manual worker trigger:

```powershell
curl.exe -X POST `
  -H "Authorization: Bearer YOUR_CRON_SECRET" `
  -H "x-cron-secret: YOUR_CRON_SECRET" `
  "https://htntrbkswwoqjvjzvksg.supabase.co/functions/v1/process-pending-payouts"
```

### 5. Cash App

The app can **queue** Cash App destinations; there is **no** automatic Cash App API yet — fulfill those manually or disable Cash App in UI until you have a process.

---

## Part 3 — Google Play honesty

With real payouts and ads:

- Update **store listing** so it matches reality (rewards, ads, possible PayPal payouts, 18+).
- Re-file **Data safety** (ads ID, email if account, payout destination) — `play-store/data-safety-answers.md`.
- **Content rating** (IARC) must match reward/cashout behavior.
- Read `play-store/PLAY_CONSOLE_CHECKLIST.md` §10 (no misleading “guaranteed cash”).

---

## Part 4 — Rollback

```powershell
supabase secrets set PAYPAL_PAYOUTS_ENABLED=false PAYPAL_MODE=sandbox
```

Redeploy worker optional. Flip Unity LevelPlay to test mode. Users can still queue withdrawals; money stops leaving PayPal.

---

## Checklist (all must be yes before production traffic)

- [ ] `levelplay.xml` has real keys; new AAB uploaded
- [ ] LevelPlay **test mode off** for production
- [ ] `PAYPAL_MODE=live`, `PAYPAL_PAYOUTS_ENABLED=true`, live Client ID/Secret in Supabase
- [ ] `CRON_SECRET` matches GitHub
- [ ] Live payout smoke test to **your** PayPal succeeded
- [ ] Play Console data safety + listing updated
