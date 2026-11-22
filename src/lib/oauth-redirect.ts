import { SITE_URL } from "@/lib/site-url";

/** Deep link Supabase redirects to after Google OAuth on Android (must be allowlisted in Supabase). */
export const NATIVE_OAUTH_REDIRECT = "com.playearn.arcade://auth/callback";

export function getOAuthRedirectTo(isNativeApp: boolean): string {
  if (isNativeApp) {
    return NATIVE_OAUTH_REDIRECT;
  }
  if (typeof window === "undefined") {
    return `${SITE_URL}/`;
  }
  return `${window.location.origin}${window.location.pathname}`;
}

export function isNativeOAuthCallback(url: string): boolean {
  return (
    url.startsWith(NATIVE_OAUTH_REDIRECT) ||
    (url.includes("auth/callback") && url.includes("code="))
  );
}