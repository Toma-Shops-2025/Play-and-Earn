# Play N' Earn

Mobile-style **virtual rewards** arcade (mini-games, wallet UI, daily check-ins). Packaged for **Google Play** with Capacitor. All balances are **entertainment only** — not real money.

**Repository:** [github.com/Toma-Shops-2025/Play-and-Earn](https://github.com/Toma-Shops-2025/Play-and-Earn)  
**Start here (GitHub + Supabase + PayPal + Play):** **[docs/GITHUB_SETUP_CHECKLIST.md](./docs/GITHUB_SETUP_CHECKLIST.md)**  
**Supabase DB (migrations):** **[docs/SUPABASE_MIGRATIONS.md](./docs/SUPABASE_MIGRATIONS.md)**

## Quick start (web preview)

```bash
npm install
npm run dev -- --port 43123
```

Open [http://localhost:43123](http://localhost:43123).

## Unity rewarded ads

**Watch Ad** tab + LevelPlay on Android: **[UNITY_ADS.md](./UNITY_ADS.md)**  
**Rewards & payouts (profitability):** **[docs/REWARDS_AND_PAYOUTS.md](./docs/REWARDS_AND_PAYOUTS.md)**  
**Logo → icon/splash:** **[docs/LOGO_HANDOFF.md](./docs/LOGO_HANDOFF.md)**

## Profitability

Economy defaults and unit economics: **[MONETIZATION.md](./MONETIZATION.md)** — tune **`src/lib/economy-config.ts`**.

## Automation

Scheduled PayPal payouts, backend deploys, and what already runs on its own: **[AUTOMATION.md](./AUTOMATION.md)**.

## Backend, auth & PayPal

Optional cloud accounts and PayPal coin packs: **[BACKEND_SETUP.md](./BACKEND_SETUP.md)**.

Without `.env.local`, the app keeps using **on-device-only** demo mode.

## Google Play release

1. Read **[play-store/PLAY_CONSOLE_CHECKLIST.md](./play-store/PLAY_CONSOLE_CHECKLIST.md)** end to end.
2. Edit **`src/lib/app-config.ts`** (support email, package id, privacy URLs).
3. Host a public privacy policy — **[play-store/HOSTING_PRIVACY.md](./play-store/HOSTING_PRIVACY.md)**.
4. Build and sign an AAB — **[ANDROID_RELEASE.md](./ANDROID_RELEASE.md)**.

**Preview on your phone (APK):** **[docs/BUILD_APK.md](./docs/BUILD_APK.md)**

```powershell
# Windows (PowerShell, repo root)
.\build-apk.ps1
```

```bash
npm run build:mobile    # static web export + cap sync
npm run build:apk       # same + Gradle debug APK (uses build-apk.ps1 / .sh)
npm run android:open    # Android Studio
```

## Project layout

| Path | Purpose |
|------|---------|
| `src/components/play-earn/` | UI, games, onboarding |
| `src/lib/app-config.ts` | Store id, support email, legal URLs |
| `android/` | Capacitor Android project (upload to Play Console) |
| `play-store/` | Listing copy, Data safety draft, checklist |
| `out/` | Static export (generated; host for privacy policy) |

## Compliance features

- First-launch rules walkthrough + age / Terms / Privacy checkboxes
- Legal pages: Privacy, Terms, FAQ, Rules, Contact
- Sign-in Terms checkbox + cashout payout confirmation checkbox
- Profile → **Delete all data on device** (local storage wipe)
- Google sign-in (recommended) with optional email backup

## Stack

Next.js (static export), TypeScript, Tailwind, shadcn/ui, Capacitor 8, Android SDK 36 target

## Scripts

- `npm run dev` — local web development
- `npm run build` — static export to `out/`
- `npm run build:mobile` — export + sync into `android/`
- `npm run build:apk` — build debug APK for device preview (see `build-apk.ps1`)
- `npm run assets:generate` — launcher icons and splash screens
- `npm run lint` — ESLint
