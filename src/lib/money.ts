import { coinsToVirtualCash } from "@/lib/economy-config";

/**
 * Format a USD amount for display.
 * Sub-cent values use up to four decimals so mini-game grants stay distinguishable.
 */
function formatCashAmount(amount: number): string {
  const value = Number(amount) || 0;
  if (value === 0) return "0.00";
  const abs = Math.abs(value);
  if (abs >= 0.01) return value.toFixed(2);
  const trimmed = value
    .toFixed(4)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
  return trimmed.length > 0 ? trimmed : "0.00";
}

/** Display wallet / payout amounts as USD. */
export function formatCash(amount: number): string {
  return `$${formatCashAmount(amount)}`;
}

/** Convert internal coin grants into a money label for the UI. */
export function formatRewardFromCoins(coins: number): string {
  return formatCash(coinsToVirtualCash(coins));
}

export function formatSignedRewardFromCoins(coins: number): string {
  const cash = coinsToVirtualCash(coins);
  if (cash <= 0) return "+$0.00";
  return `+${formatCash(cash)}`;
}
