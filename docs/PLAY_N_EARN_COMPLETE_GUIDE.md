# Play N' Earn — Complete Guide (Front to Back)

Plain-text reference for operators, developers, and store listing. Copy any section below.

---

## 1. What It Is

Play N' Earn is a mobile-first rewards arcade app:

- Earn through rewarded video ads, mini-games, optional game portals (Y8 / Crazy Games), and a 7-day daily login streak.
- Balances display as dollars in the UI; internally the app uses coins (2,500 coins = $1.00 virtual).
- Every 3 hours, pending earnings convert to ready (cashable) balance, up to a $25 ready cap until the user cashes out.
- Cash out to PayPal (Cash App can be saved as destination; automation is PayPal-focused).
- First cashout minimum: $5. After the first successful cashout, smaller amounts are allowed.
- Revenue for the publisher: Unity LevelPlay ads on Android (rewarded + interstitials). The app does not sell coin packs in the current UI.

| Item | Value |
|------|--------|
| App name | Play N' Earn |
| Android package | com.playearn.arcade |
| GitHub repo | https://github.com/Toma-Shops-2025/Play-and-Earn |
| Web preview | https://toma-shops-2025.github.io/Play-and-Earn/ |
| Support email (config) | mytomaai@gmail.com (src/lib/app-config.ts) |

The website is a static preview. Real ads and the Play Store build use the installed Android APK/AAB (Capacitor).

---

## 2. Player Journey (Beginning to End)

### First launch

1. Compliance onboarding: age gate (18+ in config), agree to Terms and Privacy.
2. Default: guest mode — wallet stored on device only (local storage).
3. Five bottom tabs: Payouts, Daily, Watch Ad, Games, Profile.

### Core loop

```
Earn (ads, games, daily streak, portal time)
  → pending coins
  → every 3 hours: conversion → READY $ balance
  → save PayPal/Cash App on Profile
  → request withdrawal
  → (when enabled) PayPal Payouts worker sends money
```

### Guest vs signed in

| Mode | Header | Wallet | Watch Ad |
|------|--------|--------|----------|
| Guest (local) | On-device save · sign in to sync | localStorage only | Blocked if Supabase keys are in the build |
| Signed in (cloud) | Cloud save · signed in | Supabase Postgres | Server grant_ad_reward, daily limits |

Sign-in: Google (recommended) or email/password via Supabase Auth.

APK Google sign-in should redirect back to the app using:
  com.playearn.arcade://auth/callback
(Add that URL in Supabase Authentication → URL Configuration → Redirect URLs.)

---

## 3. The Five Tabs

### Payouts

- Ready vs pending balances.
- 3-hour conversion countdown.
- Cashout flow, payout destination (PayPal/Cash App).
- Withdrawal history.
- Legal footer links.

### Daily

- 7-day streak rewards in coins: Day 1–7 = 4, 6, 8, 10, 12, 15, 20 coins.
- UI shows progressive cent amounts (not identical $0.01 every day).
- User must watch one rewarded ad before claiming that day (config: dailyStreakRequiresRewardedAd = true).
- One streak claim per UTC calendar day (local + database).

### Watch Ad

- Main revenue surface: Unity LevelPlay rewarded videos on Android APK.
- Default: 10 coins per completed ad, 25 ads per UTC day (when signed in, enforced server-side).
- Web/GitHub Pages: simulated ad (browser confirm dialog) — not real LevelPlay.

### Games

In-app mini-games:

| ID | Name |
|----|------|
| spin | Lucky Spin |
| slot | Lucky Slot |
| scratch | Scratch Card |
| flip | Flip Card |

Server limits when signed in: 30 plays per game per UTC day, max 8 coins per grant.

Portal play (Y8 / Crazy Games embeds): 2 coins per minute, caps on session length and daily minutes. Retention feature; portal ad revenue goes to those sites.

### Profile

- Avatar and theme.
- Sign in / sign out.
- Payout email.
- Legal links, delete local data.
- Runtime diagnostics: confirms real APK (platform=android, native=true, id=com.playearn.arcade).

---

## 4. Economy (src/lib/economy-config.ts)

| Setting | Default | Meaning |
|---------|---------|---------|
| coinsPerVirtualDollar | 2500 | Coins per $1 virtual |
| conversionIntervalHours | 3 | Pending → ready batch |
| firstCashoutMinVirtualDollars | 5 | First withdrawal minimum |
| minCashoutVirtualDollars | 0 | After first cashout |
| maxCashBalanceVirtualDollars | 25 | Ready balance cap until cashout |
| rewardedAd.coinsPerAd | 10 | Per rewarded view |
| rewardedAd.dailyLimit | 25 | Max ads per day |
| dailyStreakCoins | 4,6,8,10,12,15,20 | 7-day streak |
| gamesBetweenInterstitials | 3 | Interstitial every N game opens |
| realMoneyPayoutsEnabled | true (UI) | Real PayPal still needs secrets + worker |

Planning: keep virtual value per ad below expected ad eCPM/1000 when paying real dollars. See MONETIZATION.md and docs/REWARDS_AND_PAYOUTS.md.

Example at $18 eCPM: ~$0.018 revenue per ad view vs ~$0.004 virtual granted per ad at default settings.

---

## 5. Web vs Native Android

| | Browser / GitHub Pages | Installed APK |
|--|------------------------|---------------|
| Ads | Simulated popup | Unity LevelPlay |
| levelplay.xml | N/A | android/app/src/main/res/values/levelplay.xml |
| Android Game ID (example) | — | 6218645 |
| OAuth after Google | Stays on github.io | Should return to app via deep link |
| Profile diagnostic | Amber / web | Green "Installed app (real APK)" |

Build APK (Windows):

```
cd path\to\play-and-earn
Remove-Item Env:GITHUB_PAGES_REPOSITORY -ErrorAction SilentlyContinue
npm run build:mobile
.\build-apk.ps1
```

Output: android\app\build\outputs\apk\debug\app-debug.apk

Do not leave levelplay.xml.example inside android/app/src/main/res/values/ (Gradle fails).

---

## 6. Technology Stack

Client:

- Next.js (static export to out/)
- React 19, TypeScript, Tailwind, shadcn/ui
- Capacitor 8 → Android
- wallet-provider and auth-provider for state

Android native:

- RewardedAdsPlugin.java (LevelPlay)
- levelplay.xml for app key and placement UUIDs

Backend:

- Supabase: Postgres, Auth, RLS, RPCs
- Edge Functions: PayPal + process-pending-payouts worker
- GitHub Actions: CI, Pages deploy, function deploy, optional payout cron

No separate app server — static client + Supabase.

---

## 7. Supabase

### Migrations

11 files in order (docs/SUPABASE_MIGRATIONS.md). One-shot: supabase/ALL_MIGRATIONS_IN_ORDER.sql

### Main tables

- profiles — balances, timer, streak, payout destination
- coin_ledger — grant audit
- ad_reward_claims — daily ad counts
- withdrawals — payout queue

### Main RPCs (signed-in users)

- get_wallet
- grant_ad_reward
- grant_game_coins
- grant_portal_play
- claim_daily_reward
- sync_conversion
- request_withdrawal

Legacy: credit_purchased_coins / PayPal order functions (coin packs removed from UI).

### Auth redirect URLs (add all)

```
https://toma-shops-2025.github.io/Play-and-Earn/**
http://localhost:43123/**
com.playearn.arcade://auth/callback
```

Supabase dashboard (your project):

https://supabase.com/dashboard/project/htntrbkswwoqjvjzvkksg/auth/url-configuration

### Edge function secrets (examples)

- PAYPAL_CLIENT_ID
- PAYPAL_CLIENT_SECRET
- PAYPAL_MODE (sandbox | live)
- PAYPAL_PAYOUTS_ENABLED (false until ready, then true)
- CRON_SECRET
- Supabase service keys (auto on deploy)

### Edge functions

- create-paypal-order (legacy IAP)
- complete-paypal-order (legacy)
- paypal-webhook (legacy)
- process-pending-payouts (payout worker — required for automation)

Deploy from repo root: supabase functions deploy ...

---

## 8. Unity LevelPlay Ads

Configure only in:

android/app/src/main/res/values/levelplay.xml

| XML key | Source |
|---------|--------|
| levelplay_app_key | Unity Ads Monetization → Android Game ID |
| levelplay_rewarded_ad_unit_id | Rewarded placement UUID (full UUID) |
| levelplay_interstitial_ad_unit_id | Interstitial placement UUID |

Template (do not put under res/values): android/levelplay.xml.example

Dashboard: Unity Cloud / Ads Monetization (not old platform.unity.com).

Package must match everywhere: com.playearn.arcade

---

## 9. GitHub Actions & Hosting

| Workflow | Purpose |
|----------|---------|
| ci.yml | Build/lint |
| deploy-web-pages.yml | Static site → GitHub Pages |
| deploy-backend.yml | Deploy Supabase edge functions |
| process-payouts-cron.yml | Scheduled payout worker |

GitHub secrets (typical):

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_ACCESS_TOKEN
- SUPABASE_PROJECT_REF
- CRON_SECRET, SUPABASE_URL (for cron)

---

## 10. Legal & Google Play

In-app: onboarding, Terms/Privacy at sign-in and cashout, static legal pages (privacy, terms, faq, rules, contact).

Play Store assets and checklists:

- play-store/PLAY_CONSOLE_CHECKLIST.md
- play-store/store-listing-en-US.md
- play-store/data-safety-answers.md
- ANDROID_RELEASE.md (signed AAB)
- docs/BUILD_APK.md (debug APK on phone)

Declare: free app, contains ads, honest payout language if PayPal automation is live.

---

## 11. Operator Checklists (which doc when)

| Document | Use for |
|----------|---------|
| docs/OPERATOR_CHECKLIST.md | Pre-test cloud wallet |
| docs/GITHUB_SETUP_CHECKLIST.md | Full GitHub + Supabase + Play setup |
| BACKEND_SETUP.md | Auth and payouts |
| docs/GO_LIVE_ADS_AND_PAYOUTS.md | Live LevelPlay + live PayPal |
| docs/NATIVE_GOOGLE_SIGNIN.md | APK Google login stays in app |
| docs/GOOGLE_SIGNIN_BRANDING.md | OAuth consent screen branding |
| docs/BUILD_APK.md | Build and install debug APK |
| UNITY_ADS.md | LevelPlay overview |

### Test cashout without grinding to $5 (ops only)

In Supabase SQL Editor, for your test user:

UPDATE profiles SET cash_balance = 5.00 WHERE id = '<user-uuid>';

---

## 12. What Is NOT in the Product Today

- No coin pack store in the UI (legacy PayPal checkout code remains in repo).
- No Google Play Billing for digital goods (required if you sell coins on Play later).
- Cash App: save destination yes; full automated API like PayPal no.
- Gift cards: not implemented.
- Banner ads: not primary design (rewarded + optional interstitials).

---

## 13. Repository Layout

```
play-and-earn/
├── src/app/                 Static legal pages + export
├── src/components/play-earn/  All game UI
├── src/context/             Auth + wallet
├── src/lib/                 economy-config.ts, supabase, ads, money
├── android/                 Capacitor + LevelPlay
├── supabase/migrations/     Database
├── supabase/functions/      Edge functions
├── .github/workflows/       CI/CD
├── play-store/              Store listing drafts
├── docs/                    Operator guides
├── build-apk.ps1            Windows APK build
└── capacitor.config.ts        appId com.playearn.arcade
```

---

## 14. Quick Commands

Local web dev:

```
npm install
npm run dev -- --port 43123
```

Mobile build:

```
npm run build:mobile
npm run build:apk
```

Supabase (repo root):

```
supabase login
supabase link --project-ref YOUR_REF
supabase functions deploy process-pending-payouts --no-verify-jwt --yes
```

---

## 15. One-Paragraph Pitch (copy for store/social)

Play N' Earn is a free casual rewards arcade on Android: spin, slots, scratch cards, and flip mini-games, plus daily streak bonuses and rewarded video ads. Earn in-app, watch your balance convert on a timer, and cash out to PayPal when you meet the rules. Sign in to sync your wallet to the cloud. Contains ads. Not gambling for real money — a rewards entertainment app with optional verified payouts when enabled by the publisher.

---

End of document.
