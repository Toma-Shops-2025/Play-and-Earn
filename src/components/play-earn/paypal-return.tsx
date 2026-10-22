"use client";

import { useEffect, useState } from "react";
import { completePayPalOrder } from "@/lib/paypal-checkout";
import { useWallet } from "@/context/wallet-provider";

export function PayPalReturnHandler() {
  const { refreshWallet } = useWallet();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("paypal");
    const orderId = params.get("token");

    if (status === "cancel") {
      setMessage("PayPal checkout cancelled.");
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (status !== "success" || !orderId) return;

    void (async () => {
      try {
        const result = await completePayPalOrder(orderId);
        await refreshWallet();
        if (result.credited && result.coins) {
          setMessage(`PayPal payment complete — +${result.coins} coins added!`);
        } else if (result.ok) {
          setMessage("PayPal payment already applied to your account.");
        } else {
          setMessage("Payment received. Coins will appear shortly.");
        }
      } catch (e) {
        setMessage(
          e instanceof Error ? e.message : "Could not confirm PayPal payment.",
        );
      } finally {
        window.history.replaceState({}, "", window.location.pathname);
      }
    })();
  }, [refreshWallet]);

  if (!message) return null;

  return (
    <p className="mb-3 rounded-xl bg-sky-50 px-3 py-2 text-center text-sm text-sky-900">
      {message}
    </p>
  );
}
