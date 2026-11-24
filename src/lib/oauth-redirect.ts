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
    (url.includes("auth/callback") &&
      (url.includes("code=") || url.includes("error=") || url.includes("access_token=")))
  );
}

export type OAuthCallbackParams = {
  code: string | null;
  flowId: string | null;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;
};

/** Pull the PKCE code (or error) out of the Android deep link. */
export function readOAuthCallback(url: string): OAuthCallbackParams {
  let params: URLSearchParams;
  let hashParams: URLSearchParams;
  try {
    const parsed = new URL(url);
    params = parsed.searchParams;
    hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  } catch {
    const query = url.includes("?") ? url.slice(url.indexOf("?") + 1).split("#")[0] : "";
    const hash = url.includes("#") ? url.slice(url.indexOf("#") + 1) : "";
    params = new URLSearchParams(query);
    hashParams = new URLSearchParams(hash);
  }

  return {
    code: params.get("code"),
    flowId: params.get("sb_flow_id"),
    error:
      params.get("error_description") ||
      hashParams.get("error_description") ||
      params.get("error") ||
      hashParams.get("error"),
    accessToken: hashParams.get("access_token") || params.get("access_token"),
    refreshToken: hashParams.get("refresh_token") || params.get("refresh_token"),
  };
}