# Google sign-in: show “Play N' Earn” instead of Supabase

When users tap **Continue with Google**, Google shows:

> Choose an account to continue to **`your-project.supabase.co`**

That URL is **normal** for Supabase Auth: Google talks to Supabase first, then Supabase sends the user back to your app. You can improve branding, but you **cannot** fully hide Supabase on the free/default setup without extra infrastructure.

## What you can change (recommended, ~15 minutes)

### 1. Google Cloud OAuth consent screen

Use the **same** OAuth client whose Client ID is in **Supabase → Authentication → Google**.

1. [Google Cloud Console](https://console.cloud.google.com/) → pick the project tied to that client.
2. **APIs & Services** → **OAuth consent screen**.
3. Set **App name** to **`Play N' Earn`**.
4. Upload your **App logo** (512×512 works).
5. Add **User support email** and **Developer contact**.
6. Under **Authorized domains**, include `supabase.co` (required for Supabase callback).
7. Save. If the app is in **Testing**, add tester Google accounts until you publish the consent screen.

Users still see the Supabase hostname in “continue to …”, but the consent screen title and logo show **Play N' Earn**.

### 2. Supabase URL configuration

**Supabase Dashboard → Authentication → URL Configuration**

- **Site URL**: your live app, e.g. `https://toma-shops-2025.github.io/Play-and-Earn/`
- **Redirect URLs**: same pattern you use for GitHub Pages and `capacitor://localhost` / custom scheme if you add native redirects later.

This does not change the Google hostname line, but keeps redirects correct for web + APK.

## Fully custom “continue to playnearn.com” (optional, advanced)

Google’s “continue to **domain**” line follows the **OAuth redirect domain**. With default Supabase that stays `xxxx.supabase.co`.

To show your own domain you typically need:

1. **Supabase custom domain** (paid plan) for Auth, e.g. `auth.yourdomain.com`, **or**
2. A **native** Google Sign-In flow (Capacitor plugin) with your own client IDs — still requires careful redirect setup with Supabase.

Most solo launches use **consent screen name + logo** and accept `supabase.co` in the Google prompt.

## Android note

The installed APK (`com.playearn.arcade`) uses the same Supabase Google provider. After you update the consent screen, test **Continue with Google** on the phone again (force-close Chrome if the old consent UI is cached).
