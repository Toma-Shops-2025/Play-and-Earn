import { registerPlugin } from "@capacitor/core";
import { REWARDED_AD_CONFIG } from "@/lib/ads-config";
import { formatSignedRewardFromCoins } from "@/lib/money";

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
  preloadAds(): Promise<void>;
  showRewardedAd(): Promise<RewardedAdResult>;
  isRewardedAdReady(): Promise<{ ready: boolean; status?: string }>;
  showInterstitialAd(): Promise<InterstitialAdResult>;
  isInterstitialAdReady(): Promise<{ ready: boolean }>;
}

export const RewardedAds = registerPlugin<RewardedAdsPlugin>("RewardedAds", {
  web: () => import("@/lib/rewarded-ads.web").then((m) => new m.RewardedAdsWeb()),
});

function friendlyAdError(message: string | undefined): string {
  if (!message?.trim()) {
    return "Could not show ad. Try again in a few seconds.";
  }
  const lower = message.toLowerCase();
  if (lower.includes("bad request") || /\b400\b/.test(message)) {
    return [
      "Unity Ads rejected the request — use ad unit names (Rewarded_Android / Interstitial_Android),",
      "Game ID 6218645 in levelplay.xml, package com.playearn.arcade in Unity Cloud, then rebuild the APK.",
    ].join(" ");
  }
  return message;
}

/** Warm Unity rewarded (and interstitial) inventory early — call on app open. */
export async function preloadRewardedAds(): Promise<void> {
  try {
    const init = await RewardedAds.initialize();
    if (init.ok) {
      await RewardedAds.preloadAds();
    }
  } catch {
    // Web dev without Capacitor — ignore
  }
}

/** Simulated ad for web dev (15s countdown). */
export async function showRewardedAdWithFallback(): Promise<RewardedAdResult> {
  try {
    const init = await RewardedAds.initialize();
    if (!init.ok) {
      return {
        rewarded: false,
        message: friendlyAdError(init.message ?? "Ads not configured."),
      };
    }
    await RewardedAds.preloadAds();
    const result = await RewardedAds.showRewardedAd();
    if (!result.rewarded) {
      const status = result.message
        ? friendlyAdError(result.message)
        : (await RewardedAds.isRewardedAdReady()).status;
      return {
        rewarded: false,
        message:
          status ??
          "Could not load a rewarded ad. Check your connection and try again in a minute.",
      };
    }
    return {
      ...result,
      message: result.message ? friendlyAdError(result.message) : result.message,
    };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Could not show ad.";
    return {
      rewarded: false,
      message: friendlyAdError(raw),
    };
  }
}

export function formatAdRewardLabel(): string {
  return formatSignedRewardFromCoins(REWARDED_AD_CONFIG.coinsPerAd);
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
