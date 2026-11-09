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
import {
  formatCash,
  formatSignedStreakReward,
  formatStreakRewardSubtitle,
} from "@/lib/format";
import { WebVsNativeAdHint } from "@/components/play-earn/web-vs-native-ad-hint";

const WEEKLY_REWARDS = ECONOMY.dailyStreakCoins;

export function RewardsView() {
  const { claimedRewardDays, claimDailyReward, pendingCash } = useWallet();
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
      setMessage("Unlocked! Tap Claim to collect today’s cash bonus.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-600 via-violet-700 to-indigo-800 p-5 text-white shadow-[0_0_36px_rgba(217,70,239,0.35)]">
        <h2 className="text-xl font-extrabold">Daily rewards</h2>
        <p className="mt-1 text-sm text-fuchsia-50/90">
          {requiresAd
            ? "Watch one rewarded video, then claim today’s streak cash."
            : "Check in each day to stack bonus cash."}{" "}
          Pending: <span className="font-bold text-lime-300">{formatCash(pendingCash)}</span>
        </p>
        <p className="mt-2 text-xs text-fuchsia-100/75">
          Streak grows through Day 7 — later days pay more pending earnings.
        </p>
      </section>

      <WebVsNativeAdHint />

      {message ? (
        <p className="rounded-xl border border-cyan-400/20 bg-white/5 px-3 py-2 text-center text-sm text-cyan-100">
          {message}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {WEEKLY_REWARDS.map((reward, index) => {
          const claimed = claimedRewardDays.includes(index);
          const isToday = index === todayIndex;
          const needsAdFirst = requiresAd && isToday && !dailyAdUnlocked && !claimed;
          const isFinale = index === WEEKLY_REWARDS.length - 1;

          return (
            <div
              key={index}
              className={`rounded-2xl border p-3 text-center shadow-sm ${
                isToday
                  ? "border-lime-400/60 bg-lime-400/10 shadow-[0_0_20px_rgba(163,230,53,0.25)]"
                  : isFinale
                    ? "border-amber-400/40 bg-amber-400/5"
                    : "border-white/10 bg-white/5"
              }`}
            >
              <p className="text-xs font-medium text-violet-200/70">
                Day {index + 1}
                {isFinale ? (
                  <span className="ml-1 text-[10px] font-bold uppercase text-amber-300">
                    Best
                  </span>
                ) : null}
              </p>
              <p
                className={`mt-1 font-extrabold tabular-nums text-lime-300 ${
                  isFinale ? "text-xl" : "text-lg"
                }`}
              >
                {formatSignedStreakReward(reward)}
              </p>
              <p className="text-[10px] text-violet-200/60">
                {formatStreakRewardSubtitle(reward)}
              </p>
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
        <p className="text-center text-xs text-violet-200/70">
          Today’s bonus: {formatSignedStreakReward(todayReward)} (
          {formatStreakRewardSubtitle(todayReward)}) after{" "}
          {dailyAdUnlocked ? "claiming" : "watching an ad"}.
        </p>
      ) : null}
    </div>
  );
}
