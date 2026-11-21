"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  getOAuthRedirectTo,
  isNativeOAuthCallback,
} from "@/lib/oauth-redirect";

type AuthContextValue = {
  enabled: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  signUp: (email: string, password: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const enabled = isSupabaseConfigured();
  const [loading, setLoading] = useState(enabled);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
      },
    );

    return () => subscription.subscription.unsubscribe();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    let removeListener: (() => void) | undefined;

    async function finishNativeOAuth(url: string) {
      if (!isNativeOAuthCallback(url)) return;
      const supabase = getSupabase();
      if (!supabase) return;
      try {
        const { Browser } = await import("@capacitor/browser");
        await Browser.close();
      } catch {
        // Browser may already be closed
      }
      await supabase.auth.exchangeCodeForSession(url);
    }

    void (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;

        const { App } = await import("@capacitor/app");
        const launch = await App.getLaunchUrl();
        if (launch?.url) {
          await finishNativeOAuth(launch.url);
        }

        const handle = await App.addListener("appUrlOpen", (event) => {
          void finishNativeOAuth(event.url);
        });
        removeListener = () => {
          void handle.remove();
        };
      } catch {
        // Web dev without Capacitor
      }
    })();

    return () => removeListener?.();
  }, [enabled]);

  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return "Backend auth is not configured.";
    const { error } = await supabase.auth.signUp({ email, password });
    return error?.message ?? null;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return "Backend auth is not configured.";
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return "Backend auth is not configured.";

    let isNative = false;
    try {
      const { Capacitor } = await import("@capacitor/core");
      isNative = Capacitor.isNativePlatform();
    } catch {
      isNative = false;
    }

    const redirectTo = getOAuthRedirectTo(isNative);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: isNative,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
    if (error) return error.message;

    if (isNative) {
      if (!data.url) {
        return "Could not start Google sign-in. Try again.";
      }
      try {
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url: data.url });
      } catch (e) {
        return e instanceof Error ? e.message : "Could not open sign-in browser.";
      }
    }

    return null;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      enabled,
      loading,
      session,
      user: session?.user ?? null,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
    }),
    [enabled, loading, session, signUp, signIn, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
