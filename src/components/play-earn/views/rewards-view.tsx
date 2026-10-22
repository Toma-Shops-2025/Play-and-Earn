"use client";

import { Button } from "@/components/ui/button";
import { useWallet } from "@/context/wallet-provider";

const WEEKLY_REWARDS = [5, 8, 10, 12, 15, 20, 30];

export function RewardsView() {
  const { claimedRewardDays, claimDailyReward, coins } = useWallet();

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-gradient-to-br from-fuchsia-500 to-violet-600 p-5 text-white shadow-lg">
        <h2 className="text-xl font-extrabold">Daily rewards</h2>
        <p className="mt-1 text-sm text-white/85">
          Check in each day to stack bonus coins. You have{" "}
          <span className="font-bold">{coins}</span> coins right now.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {WEEKLY_REWARDS.map((reward, index) => {
          const claimed = claimedRewardDays.includes(index);
          const isToday = index === claimedRewardDays.length;
          return (
            <div
              key={index}
              className={`rounded-2xl border p-3 text-center shadow-sm ${
                isToday ? "border-lime-400 bg-lime-50" : "border-slate-200 bg-white"
              }`}
            >
              <p className="text-xs font-medium text-slate-500">Day {index + 1}</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-800">+{reward}</p>
              <Button
                type="button"
                size="sm"
                className="mt-2 w-full"
                disabled={claimed || !isToday}
                onClick={() => claimDailyReward(index, reward)}
              >
                {claimed ? "Claimed" : isToday ? "Claim" : "Locked"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
