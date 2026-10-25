# Complete setup checklist (GitHub + Supabase + PayPal + Android)

**Your repo:** [github.com/Toma-Shops-2025/Play-and-Earn](https://github.com/Toma-Shops-2025/Play-and-Earn)  
**Your live site (after Pages deploy):** [toma-shops-2025.github.io/Play-and-Earn/](https://toma-shops-2025.github.io/Play-and-Earn/)

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
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | PayPal Developer → your app → **Client ID** (sandbox first) |
| `CRON_SECRET` | Make up a long random string (password generator); use the **same** value in Supabase later |

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

### B2. Run database SQL (one time)
1. Supabase → **SQL Editor** → **New query**.
2. Open the file `supabase/FULL_SCHEMA.sql` from this repo (**copy the entire file**, from line 1 to the end).
3. Paste into the editor → **Run**.
4. Wait for “Success”.

**Troubleshooting**
| Error | What to do |
|--------|------------|
| `relation "public.profiles" does not exist` | You ran a **partial** script (e.g. only the PayPal fix). **Reset:** run **all** of `FULL_SCHEMA.sql` from the top. On a brand-new project with no data, you can use **Project Settings → Database → Reset database**, then run `FULL_SCHEMA.sql` again. |
| `cannot change return type of existing function credit_purchased_coins` | Pull latest repo, then run `supabase/scripts/fix-credit-purchased-coins.sql` **only after** `profiles` exists — or re-run the full `FULL_SCHEMA.sql` (it now drops that function before recreating it). |

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

### B5. Deploy functions via GitHub
1. Make a small commit that touches `supabase/` (or run **Actions** → **Deploy Supabase backend** → **Run workflow**).
2. Wait for green check.

### B6. PayPal return URLs (coin packs)
1. PayPal Developer Dashboard → your app.
2. Ensure sandbox/live app allows your site URL.
3. After Pages deploys, use:  
   **https://toma-shops-2025.github.io/Play-and-Earn/**  
   (PayPal return paths are `/?paypal=success` on that host.)

---

## Part C — PayPal (buying coin packs)

### C1. Developer account
1. Go to [https://developer.paypal.com/dashboard/](https://developer.paypal.com/dashboard/).
2. **Apps & Credentials** → **Sandbox** → **Create App**.
3. Copy **Client ID** and **Secret** (Secret → Supabase only, never the mobile app).

### C2. Webhook (optional backup)
1. PayPal app → **Webhooks** → Add webhook.
2. URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/paypal-webhook`
3. Events: `PAYMENT.CAPTURE.COMPLETED`, `CHECKOUT.ORDER.COMPLETED`.

### C3. Test a purchase
1. Open your GitHub Pages URL on a phone or desktop.
2. **Profile** → sign up / sign in.
3. **Buy coin packs** → complete PayPal **sandbox** payment.
4. You should return to the app and see coins added.

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
| PayPal coin packs | User pays → return URL captures order |
| Payout queue | **Process PayPal payouts** every 15 min (if F2 enabled) |

---

## If something fails

| Problem | Check |
|---------|--------|
| Actions red on deploy-backend | Secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` |
| Pages 404 | Settings → Pages source = GitHub Actions; workflow green |
| PayPal checkout fails | Supabase secrets; functions deployed; user signed in |
| No coins after PayPal | `complete-paypal-order` logs in Supabase → Edge Functions |
| Payouts not sending | `PAYPAL_PAYOUTS_ENABLED=true`, user entered email, `CRON_SECRET` matches |

Need more detail on one area: `BACKEND_SETUP.md`, `AUTOMATION.md`, `ANDROID_RELEASE.md`, `UNITY_ADS.md`.
