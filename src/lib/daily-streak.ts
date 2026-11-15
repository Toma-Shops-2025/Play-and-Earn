import { ECONOMY } from "@/lib/economy-config";

/** One streak reward per 24 hours, in order, for the 7-day list. */
export const DAILY_STREAK_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function msUntilNextDailyClaim(
  lastClaimAt: string | null | undefined,
  now = Date.now(),
): number {
  if (!lastClaimAt) return 0;
  const claimedAt = Date.parse(lastClaimAt);
  if (Number.isNaN(claimedAt)) return 0;
  return Math.max(0, claimedAt + DAILY_STREAK_COOLDOWN_MS - now);
}

export function nextDailyStreakIndex(claimedRewardDays: readonly number[]): number {
  return claimedRewardDays.length;
}

/** True only for the next unclaimed day, and only after the 24-hour wait. */
export function canClaimDailyStreak(input: {
  claimedRewardDays: readonly number[];
  dayIndex: number;
  lastDailyClaimAt: string | null | undefined;
  coins: number;
  now?: number;
}): boolean {
  const { claimedRewardDays, dayIndex, lastDailyClaimAt, coins, now } = input;
  if (dayIndex !== nextDailyStreakIndex(claimedRewardDays)) return false;
  const expected = ECONOMY.dailyStreakCoins[dayIndex];
  if (expected === undefined || expected !== coins) return false;
  return msUntilNextDailyClaim(lastDailyClaimAt, now) === 0;
}
