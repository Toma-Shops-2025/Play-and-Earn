# Preview on your Android phone (APK)

## What you need (one time)

1. **Node.js** (LTS) — [nodejs.org](https://nodejs.org/)
2. **Android Studio** — [developer.android.com/studio](https://developer.android.com/studio)
3. Open Android Studio → **SDK Manager** → install **Android SDK Platform** for API **36** (matches `android/variables.gradle`).
4. Optional: add platform-tools to PATH so `adb` works (Studio → SDK Manager → SDK Tools → **Android SDK Platform-Tools**).

## Build the APK (Windows)

In **PowerShell**, from the repo folder:

```powershell
.\build-apk.ps1
```

First run downloads Gradle dependencies and can take several minutes.

**Output:** `android\app\build\outputs\apk\debug\app-debug.apk`

### Release build (optional)

```powershell
.\build-apk.ps1 -Release
```

For Play Store you still need a signed AAB — see [ANDROID_RELEASE.md](../ANDROID_RELEASE.md).

## Build on Mac / Linux / WSL

```bash
chmod +x build-apk.sh
./build-apk.sh
```

## Install on your device

### Option A — copy the file

1. Send `app-debug.apk` to your phone (USB cable, Google Drive, etc.).
2. Open the APK on the phone.
3. If asked, allow installation from that app (unknown sources).

### Option B — USB debugging

1. On the phone: **Developer options** → **USB debugging** ON.
2. Connect USB; accept the debugging prompt.
3. On your PC:

```powershell
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
```

## Unity ads on device

Replace placeholders in `android/app/src/main/res/values/levelplay.xml` with your LevelPlay app key and ad unit IDs before you expect real ads (see [UNITY_ADS.md](../UNITY_ADS.md)). The app still runs without them; ads may fail or use fallbacks.

## Troubleshooting

| Problem | Fix |
|--------|-----|
| `Android SDK not found` | Install Studio, run SDK Manager once, set `ANDROID_HOME` to your SDK path (Windows default: `%LOCALAPPDATA%\Android\Sdk`). |
| `JAVA_HOME` / JDK errors | Install JDK 17+; in Studio: **Settings → Build → Gradle → Gradle JDK**. |
| Gradle timeout | Retry; ensure stable internet for first Gradle sync. |
| App opens but blank | Re-run `.\build-apk.ps1` so `npm run build:mobile` refreshes the `out/` folder. |
