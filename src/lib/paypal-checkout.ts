"use client";

import { getSupabase } from "@/lib/supabase/client";
import type { CoinPackId } from "@/lib/wallet-api";

export async function startPayPalCoinPackCheckout(
  packId: CoinPackId,
): Promise<{ url: string; orderId: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Sign in and configure Supabase to purchase coin packs.");
  }
  const { data, error } = await supabase.functions.invoke("create-paypal-order", {
    body: { packId },
  });
  if (error) throw error;
  const payload = data as { url?: string; orderId?: string; error?: string };
  if (payload.error) throw new Error(payload.error);
  if (!payload.url || !payload.orderId) {
    throw new Error("PayPal checkout could not be started.");
  }
  return { url: payload.url, orderId: payload.orderId };
}

export async function completePayPalOrder(orderId: string): Promise<{
  ok: boolean;
  credited: boolean;
  coins?: number;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Not signed in.");
  }
  const { data, error } = await supabase.functions.invoke("complete-paypal-order", {
    body: { orderId },
  });
  if (error) throw error;
  const payload = data as {
    ok?: boolean;
    credited?: boolean;
    coins?: number;
    error?: string;
  };
  if (payload.error) throw new Error(payload.error);
  return {
    ok: Boolean(payload.ok),
    credited: Boolean(payload.credited),
    coins: payload.coins,
  };
}
