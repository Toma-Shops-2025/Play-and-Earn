import type { GameId } from "@/lib/games";
import { REWARDED_AD_CONFIG } from "@/lib/ads-config";
import { APP_CONFIG } from "@/lib/app-config";
import { getSupabase } from "@/lib/supabase/client";
import type { Withdrawal } from "@/context/wallet-provider";

export type CloudWalletPayload = {
  uid: number;
  coins: number;
  cashBalance: number;
  secondsUntilConversion: number;
  claimedRewardDays: number[];
  withdrawals: Withdrawal[];
  adsWatchedToday: number;
  adsRemainingToday: number;
};

export type AdRewardResult = {
  ok: boolean;
  message: string;
  coinsGranted: number;
  adsWatchedToday: number;
  adsRemainingToday: number;
};

export async function fetchCloudWallet(): Promise<CloudWalletPayload | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("get_wallet");
  if (error) throw error;

  const raw = data as {
    uid: number;
    coins: number;
    cashBalance: number | string;
    secondsUntilConversion: number;
    claimedRewardDays: number[];
    withdrawals: Array<{
      id: string;
      amount: number | string;
      status: Withdrawal["status"];
      createdAt: string;
    }>;
  };

  const adsWatchedToday = Number((raw as { adsWatchedToday?: number }).adsWatchedToday ?? 0);
  const adsRemainingToday = Number(
    (raw as { adsRemainingToday?: number }).adsRemainingToday ??
      REWARDED_AD_CONFIG.dailyLimit,
  );

  return {
    uid: raw.uid,
    coins: raw.coins,
    cashBalance: Number(raw.cashBalance),
    secondsUntilConversion: raw.secondsUntilConversion,
    claimedRewardDays: raw.claimedRewardDays ?? [],
    withdrawals: (raw.withdrawals ?? []).map((w) => ({
      id: w.id,
      amount: Number(w.amount),
      status: w.status,
      createdAt: w.createdAt,
    })),
    adsWatchedToday,
    adsRemainingToday,
  };
}

export async function cloudGrantAdReward(): Promise<AdRewardResult> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Sign in to claim ad rewards in the cloud.");
  }
  const { data, error } = await supabase.rpc("grant_ad_reward", {
    p_coins: REWARDED_AD_CONFIG.coinsPerAd,
    p_daily_limit: REWARDED_AD_CONFIG.dailyLimit,
  });
  if (error) throw error;
  const result = data as {
    ok: boolean;
    message: string;
    coinsGranted: number;
    adsWatchedToday: number;
    adsRemainingToday: number;
  };
  return {
    ok: result.ok,
    message: result.message,
    coinsGranted: Number(result.coinsGranted ?? 0),
    adsWatchedToday: Number(result.adsWatchedToday ?? 0),
    adsRemainingToday: Number(result.adsRemainingToday ?? 0),
  };
}

export async function cloudGrantGameCoins(
  gameId: GameId,
  amount: number,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.rpc("grant_game_coins", {
    p_game_id: gameId,
    p_amount: amount,
  });
  if (error) throw error;
}

export async function cloudClaimDailyReward(
  dayIndex: number,
  coins: number,
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("claim_daily_reward", {
    p_day_index: dayIndex,
    p_coins: coins,
  });
  if (error) throw error;
  return Boolean(data);
}

export async function cloudRequestWithdrawal(paypalEmail?: string): Promise<{
  ok: boolean;
  message: string;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, message: "Sign in to request a withdrawal." };
  }
  const { data, error } = await supabase.rpc("request_withdrawal", {
    p_min_amount: APP_CONFIG.minCashoutVirtualDollars,
    p_paypal_email: paypalEmail?.trim() || null,
  });
  if (error) throw error;
  const result = data as { ok: boolean; message: string };
  return result;
}

export type CoinPackId = "coins_100" | "coins_500" | "coins_1200";

export const COIN_PACKS: Record<
  CoinPackId,
  { label: string; coins: number; priceLabel: string }
> = {
  coins_100: { label: "Starter pack", coins: 100, priceLabel: "$0.99" },
  coins_500: { label: "Pro pack", coins: 500, priceLabel: "$3.99" },
  coins_1200: { label: "Mega pack", coins: 1200, priceLabel: "$7.99" },
};

/** @deprecated Use startPayPalCoinPackCheckout from @/lib/paypal-checkout */
export { startPayPalCoinPackCheckout as startCoinPackCheckout } from "@/lib/paypal-checkout";
