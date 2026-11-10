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
import { signInWithGoogleOnDevice } from "@/lib/native-google-sign-in";
import {
  NATIVE_OAUTH_REDIRECT,
  webOAuthRedirectTo,
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

    const { Capacitor } = await import("@capacitor/core");
    const onAndroid =
      Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

    if (onAndroid) {
      const device = await signInWithGoogleOnDevice();
      if (device.ok) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: device.idToken,
        });
        return error?.message ?? null;
      }
      if (!device.fallbackBrowser) {
        return device.error;
      }
    }

    const native = Capacitor.isNativePlatform();
    const redirectTo = native ? NATIVE_OAUTH_REDIRECT : webOAuthRedirectTo();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: native,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
    if (error) return error.message;

    if (native && data?.url) {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url: data.url });
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
