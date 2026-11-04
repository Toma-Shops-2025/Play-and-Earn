"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-provider";

export function AuthPanel() {
  const { enabled, loading, user, signIn, signUp, signInWithGoogle, signOut } =
    useAuth();
  const [showEmail, setShowEmail] = useState(false);
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!enabled) {
    return (
      <section className="rounded-2xl border border-dashed border-violet-400/30 bg-white/5 p-4 text-sm text-violet-100/80">
        <p className="font-semibold text-cyan-100">Cloud account</p>
        <p className="mt-1">
          Add Supabase keys to enable Google sign-in, synced balances, and payouts. Without
          it, progress stays on this device only.
        </p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-violet-200/70">
        Checking session…
      </section>
    );
  }

  if (user) {
    const label =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email ||
      "Signed in";
    return (
      <section className="rounded-2xl border border-lime-400/25 bg-lime-400/10 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-lime-200/80">
          Account
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-white">{label}</p>
        {user.email ? (
          <p className="mt-0.5 truncate text-xs text-violet-200/70">{user.email}</p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full border-white/20 bg-black/20 text-violet-50 hover:bg-white/10"
          onClick={() => signOut()}
        >
          Sign out
        </Button>
      </section>
    );
  }

  async function handleGoogle() {
    if (!agreed) {
      setMessage("Accept Terms & Privacy before signing in.");
      return;
    }
    setBusy(true);
    setMessage(null);
    const error = await signInWithGoogle();
    setBusy(false);
    if (error) setMessage(error);
  }

  async function handleEmailSubmit() {
    if (!agreed) {
      setMessage("Accept Terms & Privacy before signing in.");
      return;
    }
    setBusy(true);
    setMessage(null);
    const error =
      mode === "signIn"
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);
    setBusy(false);
    if (error) {
      setMessage(error);
      return;
    }
    if (mode === "signUp") {
      setMessage(
        "Account created. Confirm your email if required, then sign in.",
      );
    }
  }

  return (
    <section className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-[#1a1040] to-[#0b122e] p-4 shadow-[0_0_28px_rgba(34,211,238,0.15)]">
      <p className="text-sm font-bold text-cyan-100">Sign in to sync &amp; cash out</p>
      <p className="mt-1 text-xs text-violet-200/75">
        Google is recommended for Android. Email/password stays available as a backup.
      </p>

      <label className="mt-4 flex items-start gap-2 text-xs text-violet-100">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-violet-400"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        <span>
          I agree to the{" "}
          <Link href="/terms/" className="font-semibold text-cyan-300 underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy/" className="font-semibold text-cyan-300 underline">
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      <Button
        type="button"
        className="mt-4 h-11 w-full rounded-xl bg-white text-sm font-bold text-slate-900 hover:bg-slate-100"
        disabled={busy || !agreed}
        onClick={() => void handleGoogle()}
      >
        {busy ? "Opening Google…" : "Continue with Google"}
      </Button>

      <button
        type="button"
        className="mt-3 w-full text-center text-xs font-medium text-violet-200/70 underline"
        onClick={() => setShowEmail((v) => !v)}
      >
        {showEmail ? "Hide email option" : "Use email instead"}
      </button>

      {showEmail ? (
        <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "signIn" ? "default" : "outline"}
              onClick={() => setMode("signIn")}
            >
              Sign in
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "signUp" ? "default" : "outline"}
              onClick={() => setMode("signUp")}
            >
              Sign up
            </Button>
          </div>
          <input
            type="email"
            autoComplete="email"
            placeholder="Email"
            className="h-11 w-full rounded-xl border border-white/20 bg-black/30 px-3 text-sm text-white placeholder:text-white/40"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            autoComplete={mode === "signIn" ? "current-password" : "new-password"}
            placeholder="Password (min 6 characters)"
            className="h-11 w-full rounded-xl border border-white/20 bg-black/30 px-3 text-sm text-white placeholder:text-white/40"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="button"
            className="w-full"
            disabled={busy || !agreed || !email || password.length < 6}
            onClick={() => void handleEmailSubmit()}
          >
            {busy ? "Please wait…" : mode === "signIn" ? "Sign in" : "Create account"}
          </Button>
        </div>
      ) : null}

      {message ? (
        <p className="mt-3 text-xs text-amber-200">{message}</p>
      ) : null}
    </section>
  );
}
