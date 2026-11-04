/**
 * Central economy tuning — keep virtual liability below expected ad / IAP revenue.
 * See MONETIZATION.md for how these map to unit economics.
 */
export const ECONOMY = {
  /**
   * JustPlay-style: show money only and allow cashouts every conversion window.
   * PayPal payouts still need Supabase worker + PayPal Payouts configured.
   * Cash App destinations are queued for manual/ops fulfillment (no Cash App API yet).
   */
  realMoneyPayoutsEnabled: true,

  /** Automatic pending → cashable cadence (and auto-payout when destination is saved). */
  conversionIntervalHours: 3,

  /**
   * Internal units still use “coins”; UI shows dollars only.
   * 2500 units ≈ $1.00 — keep liability below typical rewarded eCPM.
   */
  coinsPerVirtualDollar: 2500,

  /**
   * After the first successful cashout request, users can cash out any amount.
   * First cashout uses firstCashoutMinVirtualDollars instead.
   */
  minCashoutVirtualDollars: 0,

  /** First-ever cashout must reach this ready balance ($5 is achievable but filters tiny drains). */
  firstCashoutMinVirtualDollars: 5,

  /**
   * Ready (cashable) balance hard cap. Conversion stops adding past this until they cash out.
   * Leftover pending earnings stay as pending coins.
   */
  maxCashBalanceVirtualDollars: 25,

  /** Auto-create a withdrawal when the 3-hour conversion fires and a destination is saved. */
  autoCashoutOnConversion: true,

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

  /**
   * Y8 / Crazy Games playtime. Portals do not pay us (their ads are theirs),
   * so this is a retention faucet funded by our rewarded ads.
   * 2 coins/min × 40 min/day = 80 coins ≈ $0.032 virtual vs ~250 coins/day from ads.
   */
  portalPlay: {
    coinsPerMinute: 2,
    minMinutesToCredit: 1,
    maxMinutesPerSession: 20,
    maxMinutesPerDay: 40,
    ignoreSessionsLongerThanMs: 2 * 60 * 60 * 1000,
  },
} as const;

export function coinsToVirtualCash(coins: number): number {
  return coins / ECONOMY.coinsPerVirtualDollar;
}

export function virtualCashToCoins(cash: number): number {
  return Math.floor(cash * ECONOMY.coinsPerVirtualDollar + 1e-9);
}

/** True once the user has queued or completed at least one real cashout. */
export function hasCashedOutBefore(
  withdrawals: Array<{ status: string }>,
): boolean {
  return withdrawals.some(
    (w) =>
      w.status === "pending" ||
      w.status === "processing" ||
      w.status === "completed",
  );
}

/** First cashout needs $5; after that any amount. */
export function requiredCashoutMinimum(hasPriorCashout: boolean): number {
  return hasPriorCashout
    ? ECONOMY.minCashoutVirtualDollars
    : ECONOMY.firstCashoutMinVirtualDollars;
}

/** How much more can convert into ready balance before the $25 cap. */
export function cashRoomUnderCap(cashBalance: number): number {
  return Math.max(0, ECONOMY.maxCashBalanceVirtualDollars - cashBalance);
}

/** Estimated gross ad revenue per completed rewarded view at planning eCPM. */
export function estimatedAdRevenueUsd(): number {
  return ECONOMY.planningRewardedEcpmUsd / 1000;
}

/** Virtual $ value we give per ad in coins — should stay below estimatedAdRevenueUsd when payouts are real. */
export function virtualValuePerAdUsd(): number {
  return coinsToVirtualCash(ECONOMY.rewardedAd.coinsPerAd);
}
