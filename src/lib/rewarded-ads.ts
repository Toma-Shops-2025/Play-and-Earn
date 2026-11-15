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
  showRewardedAd(): Promise<RewardedAdResult>;
  isRewardedAdReady(): Promise<{ ready: boolean; message?: string }>;
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
      "Unity Ads rejected the request — check Game ID 6218645 and placement UUIDs in",
      "android/app/src/main/res/values/levelplay.xml, package com.playearn.arcade in Unity Cloud, rebuild the APK.",
    ].join(" ");
  }
  if (
    lower.includes("placement not found") ||
    lower.includes("52102") ||
    lower.includes("placement id")
  ) {
    return [
      "Unity placement ID not found — in Unity Monetization copy each placement’s Placement ID (UUID)",
      "into levelplay.xml (not Rewarded_Android; that name only works on older apps like BingoX).",
    ].join(" ");
  }
  return message;
}

async function waitForRewardedAdReady(maxMs = 22_000): Promise<{
  ready: boolean;
  message?: string;
}> {
  const started = Date.now();
  let lastMessage: string | undefined;
  while (Date.now() - started < maxMs) {
    const status = await RewardedAds.isRewardedAdReady();
    if (status.message) lastMessage = status.message;
    if (status.ready) return { ready: true };
    await new Promise((r) => setTimeout(r, 600));
  }
  return {
    ready: false,
    message: lastMessage,
  };
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
    const wait = await waitForRewardedAdReady();
    if (!wait.ready) {
      return {
        rewarded: false,
        message: friendlyAdError(
          wait.message ??
            "No rewarded ad loaded yet. Check your connection, wait a few seconds, and try again."
        ),
      };
    }
    const result = await RewardedAds.showRewardedAd();
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
