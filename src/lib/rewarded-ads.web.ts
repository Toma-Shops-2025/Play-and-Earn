import type { RewardedAdsPlugin, RewardedAdResult } from "@/lib/rewarded-ads";

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
}
