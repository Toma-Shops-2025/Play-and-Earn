# Play & Earn Arcade

Mobile-style **virtual rewards** arcade (mini-games, wallet UI, daily check-ins). Packaged for **Google Play** with Capacitor. All balances are **entertainment only** — not real money.

**Start here (GitHub + Supabase + PayPal + Play):** **[docs/GITHUB_SETUP_CHECKLIST.md](./docs/GITHUB_SETUP_CHECKLIST.md)**

## Quick start (web preview)

```bash
npm install
npm run dev -- --port 43123
```

Open [http://localhost:43123](http://localhost:43123).

## Unity rewarded ads

**Watch Ad** tab + LevelPlay on Android: **[UNITY_ADS.md](./UNITY_ADS.md)**.

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

```bash
npm run build:mobile    # static web export + cap sync
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

- First-launch age + Terms/Privacy acceptance
- In-app Privacy Policy and Terms (`/privacy/`, `/terms/`)
- Profile → **Delete all data on device** (local storage wipe)
- No third-party analytics or ad SDKs in this build

## Stack

Next.js (static export), TypeScript, Tailwind, shadcn/ui, Capacitor 8, Android SDK 36 target

## Scripts

- `npm run dev` — local web development
- `npm run build` — static export to `out/`
- `npm run build:mobile` — export + sync into `android/`
- `npm run assets:generate` — launcher icons and splash screens
- `npm run lint` — ESLint
