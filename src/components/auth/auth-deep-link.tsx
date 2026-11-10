"use client";

import { useEffect } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { NATIVE_OAUTH_REDIRECT } from "@/lib/oauth-redirect";

function isAuthCallbackUrl(url: string): boolean {
  return (
    url.startsWith("com.playearn.arcade://") ||
    url.startsWith(NATIVE_OAUTH_REDIRECT)
  );
}

async function finishNativeOAuth(url: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { Browser } = await import("@capacitor/browser");
    await Browser.close();
  } catch {
    /* browser may already be closed */
  }

  const parsed = new URL(url);
  const code = parsed.searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) console.error("OAuth code exchange failed:", error.message);
    return;
  }

  const hash = url.includes("#") ? url.split("#")[1] : "";
  if (hash) {
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
    }
  }
}

/** Returns OAuth session from a deep link into the installed APK (not the browser). */
export function AuthDeepLinkHandler() {
  useEffect(() => {
    let remove: (() => void) | undefined;

    void (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      const { App } = await import("@capacitor/app");

      const listener = await App.addListener("appUrlOpen", (event) => {
        if (isAuthCallbackUrl(event.url)) {
          void finishNativeOAuth(event.url);
        }
      });
      remove = () => void listener.remove();

      const launch = await App.getLaunchUrl();
      if (launch?.url && isAuthCallbackUrl(launch.url)) {
        void finishNativeOAuth(launch.url);
      }
    })();

    return () => remove?.();
  }, []);

  return null;
}
