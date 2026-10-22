import type {
  InterstitialAdResult,
  RewardedAdsPlugin,
  RewardedAdResult,
} from "@/lib/rewarded-ads";

export class RewardedAdsWeb implements RewardedAdsPlugin {
  async initialize(): Promise<{ ok: boolean; message?: string }> {
    return {
      ok: true,
      message: "Web preview uses a short simulated ad (Unity runs on Android builds).",
    };
  }

  async isRewardedAdReady(): Promise<{ ready: boolean }> {
    return { ready: true };
  }

  async showRewardedAd(): Promise<RewardedAdResult> {
    const confirmed = window.confirm(
      "Simulate a rewarded video?\n\nIn the Android app, Unity LevelPlay will show a real ad here.",
    );
    if (!confirmed) {
      return { rewarded: false, message: "Ad cancelled." };
    }
    await new Promise((resolve) => setTimeout(resolve, 2500));
    return { rewarded: true };
  }

  async isInterstitialAdReady(): Promise<{ ready: boolean }> {
    return { ready: true };
  }

  async showInterstitialAd(): Promise<InterstitialAdResult> {
    const ok = window.confirm(
      "Simulate an interstitial ad?\n\nShown between mini-games on Android.",
    );
    if (!ok) return { shown: false, message: "Skipped" };
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return { shown: true };
  }
}
