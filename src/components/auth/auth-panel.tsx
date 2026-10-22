"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-provider";

export function AuthPanel() {
  const { enabled, loading, user, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!enabled) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">Cloud account (optional)</p>
        <p className="mt-1">
          Add Supabase keys in <code className="text-xs">.env.local</code> to enable
          sign-in, synced balances, and Stripe coin packs. Without it, progress stays on
          this device only.
        </p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm">
        Checking session…
      </section>
    );
  }

  if (user) {
    return (
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-800">Signed in</p>
        <p className="mt-1 truncate text-xs text-slate-500">{user.email}</p>
        <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => signOut()}>
          Sign out
        </Button>
      </section>
    );
  }

  async function handleSubmit() {
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
      setMessage("Account created. Check your email if confirmation is required, then sign in.");
    }
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
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
      <div className="mt-3 space-y-2">
        <input
          type="email"
          autoComplete="email"
          placeholder="Email"
          className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          autoComplete={mode === "signIn" ? "current-password" : "new-password"}
          placeholder="Password (min 6 characters)"
          className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button
        type="button"
        className="mt-3 w-full"
        disabled={busy || !email || password.length < 6}
        onClick={handleSubmit}
      >
        {busy ? "Please wait…" : mode === "signIn" ? "Sign in" : "Create account"}
      </Button>
      {message ? <p className="mt-2 text-xs text-slate-600">{message}</p> : null}
    </section>
  );
}
