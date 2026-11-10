# Google sign-in on the APK (stay in the app)

## Symptom

After **Continue with Google**, Chrome opens **`toma-shops-2025.github.io`** and you are no longer in the installed app (simulate ads, wrong sign-in).

## Fix (recommended): in-app Google Sign-In

The APK now uses **native Google** (Android account picker inside the app) → Supabase `signInWithIdToken`. **No browser, no github.io.**

### Step 1 — Web client ID in your build

Use the **same Web client ID** already pasted into **Supabase → Authentication → Google** (ends with `.apps.googleusercontent.com`).

In the repo root, create or edit **`.env.local`**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://htntrbkswwoqjvjzvkksg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
```

Rebuild the APK **after** this file exists (`build-apk.ps1` runs `next build`, which reads `.env.local`).

### Step 2 — Android OAuth client + SHA-1 (Google Cloud)

1. [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. **Create credentials → OAuth client ID → Android**
   - Package name: `com.playearn.arcade`
   - SHA-1: from your **debug** keystore (phone APK from `.\build-apk.ps1`):

```powershell
cd C:\Users\SexyMimi\.app-store\play-and-earn\android
.\gradlew signingReport
```

Copy **SHA1** under `Variant: debug` → paste into the Android OAuth client.

3. Keep your existing **Web application** client (used for Supabase and `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID`).
4. OAuth consent screen: add your Google account as a **Test user** if the app is still in **Testing** mode.

### Step 3 — Supabase redirect URLs (still required for web + fallback)

[URL configuration](https://supabase.com/dashboard/project/htntrbkswwoqjvjzvkksg/auth/url-configuration) → **Redirect URLs**:

```
com.playearn.arcade://auth/callback
https://localhost/**
https://toma-shops-2025.github.io/Play-and-Earn/**
```

### Step 4 — Rebuild and reinstall

```powershell
cd C:\Users\SexyMimi\.app-store\play-and-earn
git pull
git checkout cursor/daily-streak-ui-web-hint-98c2
Remove-Item Env:GITHUB_PAGES_REPOSITORY -ErrorAction SilentlyContinue
.\build-apk.ps1
```

Uninstall old **Play N' Earn** → install new **`app-debug.apk`**.

### Success

- Google account picker appears **inside the app** (not Chrome).
- Header: **Cloud save · signed in**.
- Profile: green **Installed app (real APK)**.
- Watch Ad works with cloud wallet.

### If you see an error on screen

| Message | Fix |
|---------|-----|
| `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Add `.env.local` and rebuild APK |
| Developer console not set up / SHA-1 | Run `signingReport`, update Android OAuth client |
| Deep link / github.io (old build) | Pull latest, reinstall APK, confirm `.env.local` |

---

## Fallback: browser OAuth + deep link

If native Google is not configured, the app opens a browser tab and should return via `com.playearn.arcade://auth/callback`. That only works if Supabase lists that redirect URL and you are on a **recent APK**. Prefer native Google on Android.
