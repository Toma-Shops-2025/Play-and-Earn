# Complete setup checklist (GitHub + Supabase + PayPal + Android)

**Your repo:** [github.com/Toma-Shops-2025/Play-and-Earn](https://github.com/Toma-Shops-2025/Play-and-Earn)  
**Your live site (after Pages deploy):** [toma-shops-2025.github.io/Play-and-Earn/](https://toma-shops-2025.github.io/Play-and-Earn/)

**Current product:** earn rewards, convert on a timer, cash out to PayPal / Cash App — **no coin-pack store** in the app. PayPal setup below is for **optional automatic payouts**, not IAP.

**Short path:** [docs/OPERATOR_CHECKLIST.md](./OPERATOR_CHECKLIST.md)

Do these sections **in order**. Each step is one small action.

---

## Part A — GitHub repository

### A1. Put code on GitHub
1. Repo: **https://github.com/Toma-Shops-2025/Play-and-Earn**
2. If this folder is not on GitHub yet, on your computer run:
   ```bash
   git remote add github https://github.com/Toma-Shops-2025/Play-and-Earn.git
   git push -u github main
   ```
   (If `origin` already points elsewhere, use `github` as above or change `origin` to your repo URL.)

### A2. Turn on GitHub Actions
1. Open your repo on GitHub.
2. Click **Settings** → **Actions** → **General**.
3. Under “Actions permissions”, choose **Allow all actions**.
4. Click **Save**.

### A3. Turn on GitHub Pages
1. **Settings** → **Pages**.
2. Under “Build and deployment”, **Source** = **GitHub Actions**.
3. Save (no branch picker needed).

### A4. Add GitHub Actions secrets
1. **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
2. Add each row:

| Secret name | Where to get it |
|-------------|-----------------|
| `SUPABASE_ACCESS_TOKEN` | [Supabase Account Tokens](https://supabase.com/dashboard/account/tokens) → Generate |
| `SUPABASE_PROJECT_REF` | Supabase project URL: `https://supabase.com/dashboard/project/`**`abcdefgh`** — use `abcdefgh` |
| `SUPABASE_URL` | Supabase → **Project Settings** → **API** → Project URL (`https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Same as `SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → **API** → `anon` `public` key |
| `CRON_SECRET` | Make up a long random string (password generator); use the **same** value in Supabase later |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | *(Optional — legacy coin packs only; not used by current UI)* |

### A5. Confirm workflows run
1. Open **Actions** tab.
2. After a push to `main`, you should see **CI**, **Deploy web**, and **Deploy Supabase backend** (backend only when `supabase/` changes).
3. Open **Deploy web** → wait for green check.
4. **Settings** → **Pages** shows your site URL:  
   **https://toma-shops-2025.github.io/Play-and-Earn/**

---

## Part B — Supabase (database + auth)

### B1. Create project
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. **New project** → pick name, password, region → **Create**.

### B2. Run database migrations (one time)

**Full guide:** **[docs/SUPABASE_MIGRATIONS.md](./SUPABASE_MIGRATIONS.md)**

**Quick path (CLI):**
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

**Quick path (SQL Editor):** Run these files **in order**, one query each, all from `supabase/migrations/`:

1. `20260322000000_init.sql`
2. `20260322000001_ad_rewards.sql`
3. `20260322000002_wallet_ad_stats.sql`
4. `20260322000003_profitable_economy.sql`
5. `20260322000004_three_hour_payout_cycle.sql`
6. `20260322000005_paypal_payments.sql` (fulfillment table; keep for schema consistency)
7. `20260322000006_payout_automation.sql`
8. `20260322000007_portal_play_rewards.sql`
9. `20260322000008_justplay_payouts.sql`
10. `20260322000009_first_cashout_and_cap.sql`

Or run **`supabase/ALL_MIGRATIONS_IN_ORDER.sql` once** on an empty database (not twice).

**Troubleshooting:** see the table in [SUPABASE_MIGRATIONS.md](./SUPABASE_MIGRATIONS.md).

### B3. Enable email login
1. **Authentication** → **Providers** → **Email**.
2. Turn **Enable Email provider** ON.
3. Save (disable “Confirm email” for faster testing if you want).

### B4. Supabase Edge Function secrets
1. Install Supabase CLI on your PC (optional) **or** use Dashboard → **Edge Functions** → secrets UI if available.
2. With CLI:
   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase secrets set \
     PAYPAL_CLIENT_ID=your_paypal_client_id \
     PAYPAL_CLIENT_SECRET=your_paypal_secret \
     PAYPAL_MODE=sandbox \
     CRON_SECRET=same_as_github_CRON_SECRET \
     PAYPAL_PAYOUTS_ENABLED=false
   ```
3. `PAYPAL_PAYOUTS_ENABLED=false` until you are ready for **real** payouts.

### B5. Deploy edge functions
1. **Required today:** `process-pending-payouts` (`supabase functions deploy process-pending-payouts --no-verify-jwt --yes` from repo root, or **Actions** → **Deploy Supabase backend**).
2. Order/checkout functions (`create-paypal-order`, etc.) are **optional** — not used by the current app UI.
3. Wait for green check (deploy workflow uses `--yes` for non-interactive CI).

---

## Part C — PayPal (automatic payouts only)

Skip this entire part until you are ready for **real money** leaving your PayPal Business account. Until then, keep `PAYPAL_PAYOUTS_ENABLED=false`; users can still **queue** cashouts in the database.

### C1. Developer / Business account
1. Go to [https://developer.paypal.com/dashboard/](https://developer.paypal.com/dashboard/).
2. **Apps & Credentials** → **Sandbox** (then live when ready) → **Create App**.
3. Copy **Client ID** and **Secret** → Supabase secrets only (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`). **Do not** add Client ID to the web build unless you re-enable coin-pack UI.

### C2. Test payout worker (sandbox)
1. Set secrets per **B4** and **Part F**.
2. Create a signed-in user with ready balance and a saved PayPal email; request cashout.
3. Trigger worker manually or wait for **Process PayPal payouts** cron.
4. Inspect `withdrawals` in Supabase (`completed` / `failed`).

*(Legacy coin-pack checkout and `paypal-webhook` are documented in **BACKEND_SETUP.md** appendix — not part of current product.)*

---

## Part D — App configuration (your branding)

### D1. Support email and legal URLs
1. Edit `src/lib/app-config.ts`:
   - `supportEmail` → your real email.
   - `privacyPolicyUrl` → your GitHub Pages URL + `/privacy/`
   - `termsUrl` → your GitHub Pages URL + `/terms/`
2. Commit and push → wait for **Deploy web** to finish.

### D2. Unity LevelPlay (Android ads)
1. Follow `UNITY_ADS.md`.
2. Edit `android/app/src/main/res/values/levelplay.xml` with your **App key** and ad unit IDs.
3. Run `npm run build:mobile` and open Android Studio.

### D3. Android package name (if you change it)
1. Update `applicationId` in `android/app/build.gradle`, `capacitor.config.ts`, and `app-config.ts` to match.
2. Use the **same** package in Unity LevelPlay and Google Play.

---

## Part E — Google Play

### E1. Build release AAB
1. Follow `ANDROID_RELEASE.md`.
2. Create a signed **Android App Bundle** in Android Studio.

### E2. Play Console
1. Follow `play-store/PLAY_CONSOLE_CHECKLIST.md`.
2. Privacy policy URL = your GitHub Pages `/privacy/` link.
3. Declare **Contains ads**.

---

## Part F — Automatic PayPal payouts (optional, real money)

Only when you are ready for real cash leaving your account:

### F1. Enable in code
1. Set `realMoneyPayoutsEnabled: true` in `src/lib/economy-config.ts`.
2. Push to `main`.

### F2. Enable on server
1. `supabase secrets set PAYPAL_PAYOUTS_ENABLED=true`
2. PayPal Business account must have **Payouts** enabled.
3. Switch `PAYPAL_MODE=live` and live credentials when going production.

### F3. Cron (already on GitHub)
1. Workflow **Process PayPal payouts** runs every **15 minutes** if `SUPABASE_URL` and `CRON_SECRET` are set in GitHub secrets.
2. Users enter PayPal email on **Request PayPal payout**.
3. Check Supabase table `withdrawals` for `completed` / `failed`.

---

## Quick reference — what runs automatically

| What | How |
|------|-----|
| Web site deploy | Push to `main` → **Deploy web (GitHub Pages)** |
| Supabase functions | Push changes under `supabase/` → **Deploy Supabase backend** |
| Build test | **CI** on every push/PR |
| 3-hour coin → cash | In-app timer + database |
| Payout queue | **Process PayPal payouts** every 15 min (if Part F enabled) |

---

## If something fails

| Problem | Check |
|---------|--------|
| Actions red on deploy-backend | Secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` |
| Pages 404 | Settings → Pages source = GitHub Actions; workflow green |
| Payouts not sending | `PAYPAL_PAYOUTS_ENABLED=true`, PayPal secrets set, user entered email, `CRON_SECRET` matches |
| Deploy backend fails on “Confirmation required” | Use latest `deploy-backend.yml` (`--yes` on deploy) or deploy from laptop CLI |

Need more detail on one area: `BACKEND_SETUP.md`, `AUTOMATION.md`, `ANDROID_RELEASE.md`, `UNITY_ADS.md`.
