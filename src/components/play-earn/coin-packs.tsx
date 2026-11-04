"use client";

import { Capacitor } from "@capacitor/core";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-provider";
import { type CoinPackId, COIN_PACKS } from "@/lib/wallet-api";
import { startPayPalCoinPackCheckout } from "@/lib/paypal-checkout";
import { isPayPalConfigured } from "@/lib/supabase/env";

export function CoinPacks() {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<CoinPackId | null>(null);

  // Play requires Google Play Billing for digital goods on Android.
  if (Capacitor.isNativePlatform()) {
    return null;
  }

  if (!isPayPalConfigured()) {
    return (
      <section className="rounded-2xl border border-dashed border-violet-200 bg-violet-50 p-4 text-xs text-violet-900">
        PayPal client ID not set. Add <code>NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> and deploy
        Supabase functions <code>create-paypal-order</code> /{" "}
        <code>complete-paypal-order</code> (see BACKEND_SETUP.md).
      </section>
    );
  }

  async function buy(packId: CoinPackId) {
    if (!user) {
      setError("Sign in before purchasing a coin pack.");
      return;
    }
    setBusy(packId);
    setError(null);
    try {
      const { url } = await startPayPalCoinPackCheckout(packId);
      const { Capacitor } = await import("@capacitor/core");
      if (Capacitor.isNativePlatform()) {
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url });
      } else {
        window.location.href = url;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "PayPal checkout failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="font-semibold text-slate-800">Buy coin packs</h3>
      <p className="mt-1 text-xs text-slate-500">
        Checkout with PayPal. On Google Play, use Play Billing for in-app purchases (store
        policy).
      </p>
      <div className="mt-3 space-y-2">
        {(Object.keys(COIN_PACKS) as CoinPackId[]).map((id) => {
          const pack = COIN_PACKS[id];
          return (
            <Button
              key={id}
              type="button"
              variant="outline"
              className="flex h-auto w-full items-center justify-between py-3"
              disabled={busy !== null}
              onClick={() => buy(id)}
            >
              <span>
                {pack.label} · +{pack.coins} coins
              </span>
              <span className="font-bold">{pack.priceLabel}</span>
            </Button>
          );
        })}
      </div>
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
    </section>
  );
}
