/**
 * Central economy tuning — keep virtual liability below expected ad / IAP revenue.
 * See MONETIZATION.md for how these map to unit economics.
 */
export const ECONOMY = {
  /** Virtual cash is NOT real money unless you explicitly enable payouts in ops. */
  realMoneyPayoutsEnabled: false,

  /** Automatic coin → cash “payout” cadence (matches reference app UI). */
  conversionIntervalHours: 3,

  /**
   * Simulated dollars earned per coin when the conversion timer fires.
   * Higher = users reach “cashout” faster (more liability in copy/UX).
   * 2500 coins ≈ $1.00 virtual (was 1000).
   */
  coinsPerVirtualDollar: 2500,

  /** Minimum virtual balance before cashout / withdrawal UI (not real funds by default). */
  minCashoutVirtualDollars: 25,

  /** Server + client: max mini-game reward grants per game per UTC day. */
  maxGamePlaysPerDay: 30,

  /** Max coins a single game RPC may grant (anti-cheat). */
  maxCoinsPerGameGrant: 8,

  /** Daily login streak rewards (day 1 → day 7). Kept modest vs ad revenue. */
  dailyStreakCoins: [4, 6, 8, 10, 12, 15, 20] as const,

  /** Rewarded video — favor more views at slightly lower coin rate. */
  rewardedAd: {
    coinsPerAd: 10,
    dailyLimit: 25,
  },

  /**
   * Rough planning eCPM (USD) for rewarded video — used for dev-only hints, not billing.
   * Update with your LevelPlay revenue reports.
   */
  planningRewardedEcpmUsd: 18,

  /** Show a LevelPlay interstitial every N mini-game opens (Android). */
  gamesBetweenInterstitials: 3,

  /** User must complete a rewarded video before claiming that day's streak reward. */
  dailyStreakRequiresRewardedAd: true,
} as const;

export function coinsToVirtualCash(coins: number): number {
  return coins / ECONOMY.coinsPerVirtualDollar;
}

/** Estimated gross ad revenue per completed rewarded view at planning eCPM. */
export function estimatedAdRevenueUsd(): number {
  return ECONOMY.planningRewardedEcpmUsd / 1000;
}

/** Virtual $ value we give per ad in coins — should stay below estimatedAdRevenueUsd when payouts are real. */
export function virtualValuePerAdUsd(): number {
  return coinsToVirtualCash(ECONOMY.rewardedAd.coinsPerAd);
}
