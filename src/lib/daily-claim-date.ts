const STORAGE_KEY = "play-earn-last-daily-claim-utc";

/** UTC calendar date `YYYY-MM-DD` — matches daily ad gate. */
export function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function lastDailyClaimUtcDate(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function markDailyClaimedToday(): void {
  localStorage.setItem(STORAGE_KEY, todayUtcDate());
}

/** True if the user already claimed today’s streak slot (guest / local wallet). */
export function hasClaimedDailyStreakToday(): boolean {
  return lastDailyClaimUtcDate() === todayUtcDate();
}
