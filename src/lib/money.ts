import { coinsToVirtualCash } from "@/lib/economy-config";

/** Display wallet / payout amounts like normal cash (always two decimals). */
export function formatCash(amount: number): string {
  const value = Number(amount) || 0;
  return `$${value.toFixed(2)}`;
}

/** Convert internal coin grants into a money label for the UI. */
export function formatRewardFromCoins(coins: number): string {
  const cash = coinsToVirtualCash(coins);
  if (cash > 0 && cash < 0.01) return "<$0.01";
  return formatCash(cash);
}

export function formatSignedRewardFromCoins(coins: number): string {
  const cash = coinsToVirtualCash(coins);
  if (cash > 0 && cash < 0.01) return "+<$0.01";
  return `+${formatCash(cash)}`;
}

/** Daily streak tiles — show real progression (4→20 coins) instead of identical "+<$0.01". */
export function formatSignedStreakReward(coins: number): string {
  const cash = coinsToVirtualCash(coins);
  if (cash >= 0.01) return `+${formatCash(cash)}`;
  return `+$${cash.toFixed(3)}`;
}

export function formatStreakRewardSubtitle(coins: number): string {
  return `${coins} bonus coins`;
}
