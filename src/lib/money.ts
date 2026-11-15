import { coinsToVirtualCash } from "@/lib/economy-config";

/**
 * Wallet and reward labels.
 * Amounts under $1 keep up to 4 decimals (the ledger stores numeric(12,4)).
 * At 2,500 coins per dollar, a +1 spin is $0.0004 and a +4 spin is $0.0016.
 * Rounding both to the nearest cent, or collapsing both to "<$0.01", made
 * every grant look identical and left the pending balance stuck on $0.00.
 */
export function formatCash(amount: number): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "$0.00";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs === 0) return "$0.00";
  if (abs >= 1) return `${sign}$${abs.toFixed(2)}`;
  const fixed = abs.toFixed(4);
  const trimmed = fixed.replace(/(\.\d{2,}?)0+$/, "$1");
  return `${sign}$${trimmed}`;
}

/** Convert an internal coin grant into a money label for the UI. */
export function formatRewardFromCoins(coins: number): string {
  return formatCash(coinsToVirtualCash(coins));
}

export function formatSignedRewardFromCoins(coins: number): string {
  const cash = coinsToVirtualCash(coins);
  if (!Number.isFinite(cash) || cash === 0) return "+$0.00";
  if (cash < 0) return `-${formatCash(Math.abs(cash))}`;
  return `+${formatCash(cash)}`;
}
