import { REWARDED_AD_CONFIG } from "@/lib/ads-config";
import { formatSignedRewardFromCoins } from "@/lib/money";

const STORAGE_KEY = "play-earn-ad-rewards-v1";

type DayRecord = { day: string; count: number };

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function load(): DayRecord {
  if (typeof window === "undefined") return { day: todayUtc(), count: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { day: todayUtc(), count: 0 };
    const parsed = JSON.parse(raw) as DayRecord;
    if (parsed.day !== todayUtc()) return { day: todayUtc(), count: 0 };
    return parsed;
  } catch {
    return { day: todayUtc(), count: 0 };
  }
}

function save(record: DayRecord) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

export function getLocalAdStats() {
  const record = load();
  return {
    adsWatchedToday: record.count,
    adsRemainingToday: Math.max(0, REWARDED_AD_CONFIG.dailyLimit - record.count),
  };
}

export function grantLocalAdReward(): {
  ok: boolean;
  message: string;
  coinsGranted: number;
} {
  const record = load();
  if (record.count >= REWARDED_AD_CONFIG.dailyLimit) {
    return {
      ok: false,
      message: "Daily ad limit reached. Come back tomorrow!",
      coinsGranted: 0,
    };
  }
  record.count += 1;
  save(record);
  return {
    ok: true,
    message: `${formatSignedRewardFromCoins(REWARDED_AD_CONFIG.coinsPerAd)} added for watching an ad.`,
    coinsGranted: REWARDED_AD_CONFIG.coinsPerAd,
  };
}
