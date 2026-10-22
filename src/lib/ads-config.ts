import { ECONOMY } from "@/lib/economy-config";

/** @deprecated Import ECONOMY.rewardedAd — kept for existing imports */
export const REWARDED_AD_CONFIG = {
  coinsPerAd: ECONOMY.rewardedAd.coinsPerAd,
  dailyLimit: ECONOMY.rewardedAd.dailyLimit,
} as const;
