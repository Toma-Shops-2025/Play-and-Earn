# Build a signed release for Google Play

You need **JDK 17+**, **Android Studio** (or Android SDK + command-line tools), and this repo on your machine.

## One-time setup

1. Install [Android Studio](https://developer.android.com/studio).
2. Open **SDK Manager** and install the latest **Android SDK Platform** matching `compileSdk` in `android/variables.gradle`.
3. Create an upload keystore (keep backups and passwords safe):

```bash
keytool -genkeypair -alias play-earn-upload -keyalg RSA -keysize 2048 -validity 10000 \
  -keystore play-earn-upload.keystore
```

4. Copy `android/keystore.properties.example` → `android/keystore.properties` and fill in paths/passwords.
   Gradle reads that file automatically for `bundleRelease`. Do not commit `keystore.properties` or the `.keystore` file.

## Build web assets and sync Android

```bash
npm install
npm run build:mobile
```

This runs `next build` (static export to `out/`) and `cap sync android`.

## Generate icons / splash (optional)

```bash
npm run assets:generate
npm run build:mobile
```

## Open in Android Studio

```bash
npm run android:open
```

- Run on an emulator or device to QA onboarding, games, and **Profile → Delete all data**.
- **Build → Generate Signed Bundle / APK → Android App Bundle** for Play upload.

## Command-line AAB (after signing config)

PowerShell from the repo root:

```powershell
.\build-apk.ps1 -Bundle
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

Upload that file to Play Console **Internal testing** first, then closed testing.

## Versioning

For each Play upload, increment in `android/app/build.gradle`:

- `versionCode` — must increase every release
- `versionName` — user-visible string (keep in sync with `src/lib/app-config.ts`)
