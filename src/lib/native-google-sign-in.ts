import { getGoogleWebClientId } from "@/lib/supabase/env";

let initialized = false;

/** Android system Google picker — stays inside Play N' Earn (no github.io redirect). */
export async function signInWithGoogleOnDevice(): Promise<
  { ok: true; idToken: string } | { ok: false; error: string; fallbackBrowser: boolean }
> {
  const webClientId = getGoogleWebClientId();
  if (!webClientId) {
    return {
      ok: false,
      error:
        "Native Google sign-in needs NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID (Web OAuth client ID from Google Cloud — same project as Supabase Google auth).",
      fallbackBrowser: true,
    };
  }

  try {
    const { SocialLogin } = await import("@capgo/capacitor-social-login");
    if (!initialized) {
      await SocialLogin.initialize({
        google: {
          webClientId,
          skipAuthOnlyAuthorizationAfterSignIn: true,
        },
      });
      initialized = true;
    }
    const res = await SocialLogin.login({ provider: "google", options: {} });
    if (res.provider !== "google") {
      return { ok: false, error: "Unexpected sign-in provider.", fallbackBrowser: false };
    }
    const idToken = "idToken" in res.result ? res.result.idToken : null;
    if (!idToken) {
      return {
        ok: false,
        error:
          "Google did not return an ID token. Add your debug APK SHA-1 to Google Cloud → Android OAuth client (see docs/NATIVE_GOOGLE_SIGNIN.md).",
        fallbackBrowser: false,
      };
    }
    return { ok: true, idToken };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Google sign-in failed.";
    return { ok: false, error: msg, fallbackBrowser: false };
  }
}
