import {
  ECONOMY,
  cashRoomUnderCap,
  coinsToVirtualCash,
  virtualCashToCoins,
} from "@/lib/economy-config";

export const CONVERSION_INTERVAL_MS =
  ECONOMY.conversionIntervalHours * 60 * 60 * 1000;

export function getDefaultConversionDueAt(from = Date.now()): string {
  return new Date(from + CONVERSION_INTERVAL_MS).toISOString();
}

export function secondsUntilConversionDue(dueAtIso: string, now = Date.now()): number {
  const due = Date.parse(dueAtIso);
  if (Number.isNaN(due)) return CONVERSION_INTERVAL_MS / 1000;
  return Math.max(0, Math.floor((due - now) / 1000));
}

export function conversionProgressPercent(secondsRemaining: number): number {
  const total = CONVERSION_INTERVAL_MS / 1000;
  const elapsed = total - secondsRemaining;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

export type ConversionTickResult = {
  coins: number;
  cashBalance: number;
  conversionDueAt: string;
  cashAdded: number;
  payoutCount: number;
  hitCashCap: boolean;
};

/**
 * Applies every elapsed 3-hour payout window.
 * Converts pending coins into ready cash, but never past maxCashBalanceVirtualDollars.
 * Leftover coins stay pending until the user cashes out and frees room under the cap.
 */
export function applyElapsedConversionPayouts(
  coins: number,
  cashBalance: number,
  conversionDueAt: string,
  now = Date.now(),
): ConversionTickResult {
  let nextCoins = coins;
  let nextCash = cashBalance;
  let dueAt = Date.parse(conversionDueAt);
  if (Number.isNaN(dueAt)) {
    dueAt = now + CONVERSION_INTERVAL_MS;
  }
  let cashAdded = 0;
  let payoutCount = 0;
  let hitCashCap = false;

  while (dueAt <= now) {
    payoutCount += 1;
    const room = cashRoomUnderCap(nextCash);
    if (nextCoins > 0 && room > 0) {
      const roomCoins = virtualCashToCoins(room);
      const convertCoins = Math.min(nextCoins, roomCoins);
      if (convertCoins > 0) {
        const added = coinsToVirtualCash(convertCoins);
        cashAdded += added;
        nextCash += added;
        nextCoins -= convertCoins;
      }
    }
    if (nextCoins > 0 && cashRoomUnderCap(nextCash) <= 0) {
      hitCashCap = true;
    }
    dueAt += CONVERSION_INTERVAL_MS;
  }

  return {
    coins: nextCoins,
    cashBalance: nextCash,
    conversionDueAt: new Date(dueAt).toISOString(),
    cashAdded,
    payoutCount,
    hitCashCap,
  };
}
