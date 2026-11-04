# Google Play Console checklist

Use this after you build a signed **Android App Bundle (`.aab`)** from this repo.

## 1. Before you upload

1. Edit `src/lib/app-config.ts`:
   - `supportEmail` — real support address (shown in-app and on the store).
   - `packageId` — must match `applicationId` in `android/app/build.gradle` (default `com.playearn.arcade`). **Changing the package ID later requires a new app listing.**
   - `privacyPolicyUrl` / `termsUrl` — public HTTPS URLs (see [HOSTING_PRIVACY.md](./HOSTING_PRIVACY.md)).
2. Bump `versionCode` (integer, always increase) and `versionName` in `android/app/build.gradle` for each release.
3. Replace launcher art if needed: `npm run assets:generate`.

## 2. Create the app in Play Console

- **App name:** Play N' Earn
- **Default language:** English (United States)
- **App or game:** Game
- **Free or paid:** Free
- **Declarations:** **Contains ads** (Unity LevelPlay rewarded videos)

## 3. Store listing

Copy from [store-listing-en-US.md](./store-listing-en-US.md). You still need:

- **App icon:** 512×512 PNG — `play-store/icon-512.png`
- **Feature graphic:** 1024×500 PNG — `play-store/feature-graphic.png`
- **Phone screenshots:** at least 2 (capture from Android emulator or device)
- **Category:** Casual (or Entertainment)

## 4. Content rating

Complete the IARC questionnaire honestly. For this project:

- Simulated gambling-style mini-games with **virtual currency only**
- **No real-money gambling or payouts**
- Not a cash contest / skill-based real-prize app

Answer accordingly so the rating reflects “simulated” play, not real gambling.

## 5. Target audience & news apps

- Target age: **18+** (matches in-app gate in `APP_CONFIG.minAge`)
- Not a news app

## 6. Data safety

Use [data-safety-answers.md](./data-safety-answers.md). Summary: gameplay data stays **on-device**; **no data collected or shared** with developers in this version.

## 7. Privacy policy

Play requires a **public URL**. Host the static `out/privacy/` page (see hosting doc). Enter the same URL in Play Console → App content → Privacy policy.

## 8. App access

- All functionality available without login → **No restrictions**
- If you add accounts later, provide test credentials here

## 9. Upload & release

1. Build signed AAB: [ANDROID_RELEASE.md](../ANDROID_RELEASE.md)
2. Play Console → **Testing → Internal testing** (recommended first) → Create release → Upload AAB
3. Fix pre-launch report issues, then promote to **Production**

## 10. Policy positioning (important)

This app is **entertainment with virtual rewards only**. Store copy and screenshots must **not** promise real money, PayPal cash, or guaranteed payouts. Misleading “earn real money” claims are a common rejection reason for reward/casino-style apps.

If you later add real rewards, gift cards, or payment integrations, you will need legal review, regional compliance, updated Data safety, and possibly different Play categories and licenses.
