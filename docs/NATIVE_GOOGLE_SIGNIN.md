# Google sign-in on the installed APK (stay in the app)

If Google sign-in opens Chrome and lands on `github.io` with a **simulate ad** popup, the OAuth redirect was hitting the **website** instead of the **APK**.

The app now uses a deep link:

`com.playearn.arcade://auth/callback`

## One-time Supabase setup (required)

**Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**

Add these (keep your existing GitHub Pages entries):

```
com.playearn.arcade://auth/callback
https://localhost/**
```

Save, then rebuild and reinstall the APK.

## User flow after fix

1. Open **Play N' Earn** from the home screen (Profile should show **Installed app (real APK)**).
2. **Profile → Continue with Google**.
3. Pick your Google account in the in-app browser tab.
4. You return to **Play N' Earn** automatically (not Chrome on github.io).
5. Header shows **Cloud save · signed in** — **Watch Ad** grants sync to Supabase.

## Rebuild APK

```powershell
cd C:\Users\SexyMimi\.app-store\play-and-earn
git pull
Remove-Item Env:GITHUB_PAGES_REPOSITORY -ErrorAction SilentlyContinue
npm run build:mobile
.\build-apk.ps1
```

Uninstall old app → install `app-debug.apk`.
