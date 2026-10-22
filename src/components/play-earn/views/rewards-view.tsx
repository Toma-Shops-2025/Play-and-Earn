"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ECONOMY } from "@/lib/economy-config";
import {
  hasDailyAdGateForToday,
  setDailyAdGateForToday,
} from "@/lib/daily-ad-gate";
import { showRewardedAdWithFallback } from "@/lib/rewarded-ads";
import { useWallet } from "@/context/wallet-provider";

const WEEKLY_REWARDS = ECONOMY.dailyStreakCoins;

export function RewardsView() {
  const { claimedRewardDays, claimDailyReward, coins } = useWallet();
  const [dailyAdUnlocked, setDailyAdUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const requiresAd = ECONOMY.dailyStreakRequiresRewardedAd;
  const todayIndex = claimedRewardDays.length;
  const todayReward = WEEKLY_REWARDS[todayIndex];

  useEffect(() => {
    setDailyAdUnlocked(!requiresAd || hasDailyAdGateForToday());
  }, [requiresAd]);

  async function unlockWithAd() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await showRewardedAdWithFallback();
      if (!result.rewarded) {
        setMessage(result.message ?? "Watch the full video to unlock today’s reward.");
        return;
      }
      setDailyAdGateForToday();
      setDailyAdUnlocked(true);
      setMessage("Unlocked! Tap Claim to collect your streak coins.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-gradient-to-br from-fuchsia-500 to-violet-600 p-5 text-white shadow-lg">
        <h2 className="text-xl font-extrabold">Daily rewards</h2>
        <p className="mt-1 text-sm text-white/85">
          {requiresAd
            ? "Watch one rewarded video, then claim today’s streak bonus."
            : "Check in each day to stack bonus coins."}{" "}
          You have <span className="font-bold">{coins}</span> coins right now.
        </p>
      </section>

      {message ? (
        <p className="rounded-xl bg-white px-3 py-2 text-center text-sm text-slate-700 shadow-sm">
          {message}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {WEEKLY_REWARDS.map((reward, index) => {
          const claimed = claimedRewardDays.includes(index);
          const isToday = index === todayIndex;
          const needsAdFirst = requiresAd && isToday && !dailyAdUnlocked && !claimed;

          return (
            <div
              key={index}
              className={`rounded-2xl border p-3 text-center shadow-sm ${
                isToday ? "border-lime-400 bg-lime-50" : "border-slate-200 bg-white"
              }`}
            >
              <p className="text-xs font-medium text-slate-500">Day {index + 1}</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-800">+{reward}</p>
              {needsAdFirst ? (
                <Button
                  type="button"
                  size="sm"
                  className="mt-2 w-full"
                  disabled={busy}
                  onClick={() => void unlockWithAd()}
                >
                  {busy ? "Loading…" : "Watch ad to unlock"}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="mt-2 w-full"
                  disabled={claimed || !isToday || busy}
                  onClick={() => void claimDailyReward(index, reward)}
                >
                  {claimed ? "Claimed" : isToday ? "Claim" : "Locked"}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {requiresAd && todayReward !== undefined && !claimedRewardDays.includes(todayIndex) ? (
        <p className="text-center text-xs text-slate-500">
          Today’s bonus: +{todayReward} coins after{" "}
          {dailyAdUnlocked ? "claiming" : "watching an ad"}.
        </p>
      ) : null}
    </div>
  );
}
