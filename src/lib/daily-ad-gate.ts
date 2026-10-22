const STORAGE_PREFIX = "play-earn-daily-ad-gate-";

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function hasDailyAdGateForToday(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_PREFIX + todayUtc()) === "1";
}

export function setDailyAdGateForToday(): void {
  localStorage.setItem(STORAGE_PREFIX + todayUtc(), "1");
}
