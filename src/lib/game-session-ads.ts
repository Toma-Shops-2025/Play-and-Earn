import { ECONOMY } from "@/lib/economy-config";

const STORAGE_KEY = "play-earn-game-sessions-v1";

function loadCount(): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(STORAGE_KEY);
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

function saveCount(count: number) {
  localStorage.setItem(STORAGE_KEY, String(count));
}

/** Call when the user taps Play — returns whether an interstitial should run first. */
export function registerGameOpen(): boolean {
  const next = loadCount() + 1;
  saveCount(next);
  const interval = ECONOMY.gamesBetweenInterstitials;
  return interval > 0 && next % interval === 0;
}

export function getGameOpensThisSession(): number {
  return loadCount();
}
