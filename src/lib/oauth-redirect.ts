import { SITE_URL } from "@/lib/site-url";

/** Deep link Supabase redirects to after Google OAuth in the Android APK. */
export const NATIVE_OAUTH_REDIRECT = "com.playearn.arcade://auth/callback";

/** Web / GitHub Pages redirect (must be allow-listed in Supabase). */
export function webOAuthRedirectTo(): string {
  if (typeof window === "undefined") return `${SITE_URL}/`;
  const path = window.location.pathname.endsWith("/")
    ? window.location.pathname
    : `${window.location.pathname}/`;
  return `${window.location.origin}${path}`;
}
