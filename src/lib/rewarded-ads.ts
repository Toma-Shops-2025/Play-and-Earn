import { registerPlugin } from "@capacitor/core";
import { REWARDED_AD_CONFIG } from "@/lib/ads-config";

export type RewardedAdResult = {
  rewarded: boolean;
  message?: string;
};

export type InterstitialAdResult = {
  shown: boolean;
  message?: string;
};

export interface RewardedAdsPlugin {
  initialize(): Promise<{ ok: boolean; message?: string }>;
  showRewardedAd(): Promise<RewardedAdResult>;
  isRewardedAdReady(): Promise<{ ready: boolean }>;
  showInterstitialAd(): Promise<InterstitialAdResult>;
  isInterstitialAdReady(): Promise<{ ready: boolean }>;
}

export const RewardedAds = registerPlugin<RewardedAdsPlugin>("RewardedAds", {
  web: () => import("@/lib/rewarded-ads.web").then((m) => new m.RewardedAdsWeb()),
});

/** Simulated ad for web dev (15s countdown). */
export async function showRewardedAdWithFallback(): Promise<RewardedAdResult> {
  try {
    const init = await RewardedAds.initialize();
    if (!init.ok) {
      return { rewarded: false, message: init.message ?? "Ads not configured." };
    }
    const { ready } = await RewardedAds.isRewardedAdReady();
    if (!ready) {
      await new Promise((r) => setTimeout(r, 800));
    }
    return await RewardedAds.showRewardedAd();
  } catch (e) {
    return {
      rewarded: false,
      message: e instanceof Error ? e.message : "Could not show ad.",
    };
  }
}

export function formatAdRewardLabel(): string {
  return `+${REWARDED_AD_CONFIG.coinsPerAd} coins`;
}

export async function showInterstitialWithFallback(): Promise<InterstitialAdResult> {
  try {
    const init = await RewardedAds.initialize();
    if (!init.ok) {
      return { shown: false, message: init.message };
    }
    const { ready } = await RewardedAds.isInterstitialAdReady();
    if (!ready) {
      return { shown: false, message: "Interstitial not ready" };
    }
    return await RewardedAds.showInterstitialAd();
  } catch (e) {
    return {
      shown: false,
      message: e instanceof Error ? e.message : "Interstitial failed",
    };
  }
}
