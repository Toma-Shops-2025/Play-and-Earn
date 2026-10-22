/** Recommended rewarded-video economy (tunable). */
export const REWARDED_AD_CONFIG = {
  /** Coins per completed rewarded video — ~2× a strong mini-game spin. */
  coinsPerAd: 15,
  /** Daily cap prevents farming; aligns with typical LevelPlay fill in casual apps. */
  dailyLimit: 12,
} as const;
