"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/auth-provider";
import type { GameId } from "@/lib/games";
import type { PortalId } from "@/lib/portals";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { REWARDED_AD_CONFIG } from "@/lib/ads-config";
import {
  ECONOMY,
  cashRoomUnderCap,
  coinsToVirtualCash,
  hasCashedOutBefore,
  requiredCashoutMinimum,
} from "@/lib/economy-config";
import {
  grantLocalPortalPlay,
  noteLocalPortalMinutes,
  type PortalSettleResult,
} from "@/lib/portal-session";
import {
  applyElapsedConversionPayouts,
  conversionProgressPercent,
  getDefaultConversionDueAt,
  secondsUntilConversionDue,
} from "@/lib/conversion";
import { APP_CONFIG } from "@/lib/app-config";
import { getLocalAdStats, grantLocalAdReward } from "@/lib/ad-rewards-local";
import {
  hasClaimedDailyStreakToday,
  markDailyClaimedToday,
} from "@/lib/daily-claim-date";
import { hasDailyAdGateForToday } from "@/lib/daily-ad-gate";
import { formatCash } from "@/lib/money";
import {
  loadPayoutDestination,
  type PayoutMethod,
} from "@/lib/payout-destination";
import {
  cloudClaimDailyReward,
  cloudGrantAdReward,
  cloudGrantGameCoins,
  cloudGrantPortalPlay,
  cloudRequestWithdrawal,
  fetchCloudWallet,
} from "@/lib/wallet-api";

const STORAGE_KEY = "play-earn-wallet-v1";

export type TabId = "payouts" | "rewards" | "watchAd" | "games" | "custom";

export type Withdrawal = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  createdAt: string;
};

type WalletState = {
  uid: number;
  coins: number;
  cashBalance: number;
  secondsUntilConversion: number;
  conversionDueAt: string;
  withdrawals: Withdrawal[];
  claimedRewardDays: number[];
};

type WalletContextValue = WalletState & {
  mode: "local" | "cloud";
  adsWatchedToday: number;
  adsRemainingToday: number;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  addCoins: (gameId: GameId, amount: number) => Promise<void>;
  grantPortalPlay: (portalId: PortalId, minutes: number) => Promise<PortalSettleResult>;
  grantAdReward: () => Promise<{ ok: boolean; message: string }>;
  lastEarnNotice: string | null;
  flashEarnNotice: (message: string) => void;
  cashout: (options?: {
    method?: PayoutMethod;
    destination?: string;
  }) => Promise<{ ok: boolean; message: string }>;
  claimDailyReward: (dayIndex: number, coins: number) => Promise<boolean>;
  conversionProgress: number;
  lastPayoutNotice: string | null;
  pendingCash: number;
  hasPriorCashout: boolean;
  cashoutMinimum: number;
  atCashCap: boolean;
  refreshWallet: () => Promise<void>;
};

const defaultConversionDueAt = getDefaultConversionDueAt(
  Date.now() - (1 * 3600 + 28 * 60 + 54) * 1000,
);

const defaultState: WalletState = {
  uid: 6268237,
  coins: 10,
  cashBalance: 0.03,
  conversionDueAt: defaultConversionDueAt,
  secondsUntilConversion: secondsUntilConversionDue(defaultConversionDueAt),
  withdrawals: [],
  claimedRewardDays: [0, 1],
};

const WalletContext = createContext<WalletContextValue | null>(null);

function loadLocalState(): WalletState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = { ...defaultState, ...JSON.parse(raw) } as WalletState;
    if (!parsed.conversionDueAt) {
      parsed.conversionDueAt = getDefaultConversionDueAt(
        Date.now() - (parsed.secondsUntilConversion ?? 0) * 1000,
      );
    }
    const applied = applyElapsedConversionPayouts(
      parsed.coins,
      parsed.cashBalance,
      parsed.conversionDueAt,
    );
    return {
      ...parsed,
      coins: applied.coins,
      cashBalance: applied.cashBalance,
      conversionDueAt: applied.conversionDueAt,
      secondsUntilConversion: secondsUntilConversionDue(applied.conversionDueAt),
    };
  } catch {
    return defaultState;
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user, enabled: authEnabled } = useAuth();
  const cloudActive = authEnabled && isSupabaseConfigured() && Boolean(user);
  const mode: "local" | "cloud" = cloudActive ? "cloud" : "local";

  const [state, setState] = useState<WalletState>(defaultState);
  const [adStats, setAdStats] = useState<{
    adsWatchedToday: number;
    adsRemainingToday: number;
  }>({
    adsWatchedToday: 0,
    adsRemainingToday: REWARDED_AD_CONFIG.dailyLimit,
  });
  const [activeTab, setActiveTab] = useState<TabId>("payouts");
  const [hydrated, setHydrated] = useState(false);
  const [lastPayoutNotice, setLastPayoutNotice] = useState<string | null>(null);
  const [lastEarnNotice, setLastEarnNotice] = useState<string | null>(null);
  const cashoutRef = useRef<(() => Promise<{ ok: boolean; message: string }>) | null>(
    null,
  );

  const refreshWallet = useCallback(async () => {
    if (!cloudActive) return;
    const cloud = await fetchCloudWallet();
    if (!cloud) return;
    setState((prev) => {
      const dueAt = new Date(
        Date.now() + cloud.secondsUntilConversion * 1000,
      ).toISOString();
      if (cloud.cashBalance > prev.cashBalance + 0.0001) {
        const delta = cloud.cashBalance - prev.cashBalance;
        setLastPayoutNotice(
          `3-hour payout: +$${delta.toFixed(2)} added to your balance`,
        );
      }
      return {
        uid: cloud.uid,
        coins: cloud.coins,
        cashBalance: cloud.cashBalance,
        secondsUntilConversion: cloud.secondsUntilConversion,
        conversionDueAt: dueAt,
        withdrawals: cloud.withdrawals,
        claimedRewardDays: cloud.claimedRewardDays,
      };
    });
    setAdStats({
      adsWatchedToday: cloud.adsWatchedToday,
      adsRemainingToday: cloud.adsRemainingToday,
    });
  }, [cloudActive]);

  useEffect(() => {
    if (cloudActive) {
      void refreshWallet();
    } else {
      setState(loadLocalState());
      setAdStats(getLocalAdStats());
    }
    setHydrated(true);
  }, [cloudActive, refreshWallet]);

  useEffect(() => {
    if (!hydrated || cloudActive) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated, cloudActive]);

  useEffect(() => {
    if (!hydrated) return;
    const id = window.setInterval(() => {
      if (cloudActive) {
        setState((prev) => {
          const remaining = secondsUntilConversionDue(prev.conversionDueAt);
          if (remaining <= 0) {
            void (async () => {
              await refreshWallet();
              if (ECONOMY.autoCashoutOnConversion && loadPayoutDestination()) {
                await cashoutRef.current?.();
              }
            })();
          }
          return { ...prev, secondsUntilConversion: remaining };
        });
        return;
      }

      setState((prev) => {
        const remaining = secondsUntilConversionDue(prev.conversionDueAt);
        if (remaining > 0) {
          return { ...prev, secondsUntilConversion: remaining };
        }
        const applied = applyElapsedConversionPayouts(
          prev.coins,
          prev.cashBalance,
          prev.conversionDueAt,
        );
        if (applied.cashAdded > 0) {
          setLastPayoutNotice(
            applied.hitCashCap
              ? `3-hour window: ${formatCash(applied.cashAdded)} ready. Balance capped at ${formatCash(ECONOMY.maxCashBalanceVirtualDollars)} — cash out to keep earning.`
              : `3-hour window: ${formatCash(applied.cashAdded)} is ready to cash out`,
          );
        } else if (applied.hitCashCap) {
          setLastPayoutNotice(
            `Ready balance is capped at ${formatCash(ECONOMY.maxCashBalanceVirtualDollars)}. Cash out to unlock more earnings.`,
          );
        }
        const nextState = {
          ...prev,
          coins: applied.coins,
          cashBalance: applied.cashBalance,
          conversionDueAt: applied.conversionDueAt,
          secondsUntilConversion: secondsUntilConversionDue(applied.conversionDueAt),
        };
        const minNeeded = requiredCashoutMinimum(
          hasCashedOutBefore(prev.withdrawals),
        );
        if (
          ECONOMY.autoCashoutOnConversion &&
          applied.cashBalance >= Math.max(minNeeded, 0.0001) &&
          loadPayoutDestination()
        ) {
          window.setTimeout(() => {
            void cashoutRef.current?.();
          }, 0);
        }
        return nextState;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [hydrated, cloudActive, refreshWallet]);

  useEffect(() => {
    if (!hydrated || !cloudActive) return;
    const id = window.setInterval(() => {
      void refreshWallet();
    }, 15_000);
    return () => window.clearInterval(id);
  }, [hydrated, cloudActive, refreshWallet]);

  const grantAdReward = useCallback(async () => {
    if (cloudActive) {
      const result = await cloudGrantAdReward();
      await refreshWallet();
      return { ok: result.ok, message: result.message };
    }
    const result = grantLocalAdReward();
    if (result.ok) {
      setState((prev) => ({
        ...prev,
        coins: prev.coins + result.coinsGranted,
      }));
      setAdStats(getLocalAdStats());
    }
    return { ok: result.ok, message: result.message };
  }, [cloudActive, refreshWallet]);

  const addCoins = useCallback(
    async (gameId: GameId, amount: number) => {
      if (amount <= 0) return;
      if (cloudActive) {
        await cloudGrantGameCoins(gameId, amount);
        await refreshWallet();
        return;
      }
      setState((prev) => ({ ...prev, coins: prev.coins + amount }));
    },
    [cloudActive, refreshWallet],
  );

  const grantPortalPlay = useCallback(
    async (portalId: PortalId, minutes: number): Promise<PortalSettleResult> => {
      if (cloudActive) {
        try {
          const result = await cloudGrantPortalPlay(portalId, minutes);
          if (result.ok && result.minutesGranted > 0) {
            noteLocalPortalMinutes(result.minutesGranted);
          }
          await refreshWallet();
          if (result.message) setLastEarnNotice(result.message);
          return result;
        } catch {
          const failed: PortalSettleResult = {
            ok: false,
            portalId,
            minutesGranted: 0,
            coinsGranted: 0,
            minutesRemainingToday: 0,
            message:
              "Arcade portal rewards need a database update. Coins were not added.",
          };
          setLastEarnNotice(failed.message);
          return failed;
        }
      }
      const result = grantLocalPortalPlay(portalId, minutes);
      if (result.ok && result.coinsGranted > 0) {
        setState((prev) => ({ ...prev, coins: prev.coins + result.coinsGranted }));
      }
      setLastEarnNotice(result.message);
      return result;
    },
    [cloudActive, refreshWallet],
  );

  const cashout = useCallback(
    async (options?: { method?: PayoutMethod; destination?: string }) => {
      const saved = loadPayoutDestination();
      const method = options?.method ?? saved?.method ?? "paypal";
      const destination = (options?.destination ?? saved?.destination ?? "").trim();

      if (!destination) {
        return {
          ok: false,
          message: "Add a PayPal email or Cash App $Cashtag first.",
        };
      }

      const priorCashout = hasCashedOutBefore(state.withdrawals);
      const minCashout = requiredCashoutMinimum(priorCashout);

      if (cloudActive) {
        const result = await cloudRequestWithdrawal({
          method,
          destination,
          minAmount: minCashout,
        });
        await refreshWallet();
        if (result.ok) setLastPayoutNotice(result.message);
        return result;
      }

      if (state.cashBalance <= 0) {
        return {
          ok: false,
          message: "No cashable balance yet. Earn until the next 3-hour window.",
        };
      }
      if (state.cashBalance < minCashout) {
        return {
          ok: false,
          message: priorCashout
            ? `Minimum balance is ${formatCash(minCashout)}.`
            : `First cashout needs ${formatCash(minCashout)}. After that, any amount is fine.`,
        };
      }

      const amount = state.cashBalance;
      setState((prev) => ({
        ...prev,
        cashBalance: 0,
        withdrawals: [
          {
            id: crypto.randomUUID(),
            amount,
            status: "pending",
            createdAt: new Date().toISOString(),
          },
          ...prev.withdrawals,
        ],
      }));
      const label = method === "cashapp" ? "Cash App" : "PayPal";
      const message = APP_CONFIG.realMoneyPayoutsEnabled
        ? `Payout of ${formatCash(amount)} queued to ${label} (${destination}).`
        : `Demo payout of ${formatCash(amount)} to ${label} (${destination}).`;
      setLastPayoutNotice(message);
      return { ok: true, message };
    },
    [cloudActive, refreshWallet, state.cashBalance, state.withdrawals],
  );

  useEffect(() => {
    cashoutRef.current = () => cashout();
  }, [cashout]);

  const claimDailyReward = useCallback(
    async (dayIndex: number, coins: number) => {
      const nextIndex = state.claimedRewardDays.length;
      if (dayIndex !== nextIndex) return false;
      if (hasClaimedDailyStreakToday()) return false;
      if (
        ECONOMY.dailyStreakRequiresRewardedAd &&
        !hasDailyAdGateForToday()
      ) {
        return false;
      }

      if (cloudActive) {
        try {
          const ok = await cloudClaimDailyReward(dayIndex, coins);
          if (ok) {
            markDailyClaimedToday();
            await refreshWallet();
          }
          return ok;
        } catch {
          return false;
        }
      }
      if (state.claimedRewardDays.includes(dayIndex)) return false;
      markDailyClaimedToday();
      setState((prev) => ({
        ...prev,
        coins: prev.coins + coins,
        claimedRewardDays: [...prev.claimedRewardDays, dayIndex],
      }));
      return true;
    },
    [cloudActive, refreshWallet, state.claimedRewardDays],
  );

  const conversionProgress = useMemo(
    () => conversionProgressPercent(state.secondsUntilConversion),
    [state.secondsUntilConversion],
  );

  const pendingCash = useMemo(
    () => coinsToVirtualCash(state.coins),
    [state.coins],
  );

  const hasPriorCashout = useMemo(
    () => hasCashedOutBefore(state.withdrawals),
    [state.withdrawals],
  );

  const cashoutMinimum = useMemo(
    () => requiredCashoutMinimum(hasPriorCashout),
    [hasPriorCashout],
  );

  const atCashCap = useMemo(
    () => cashRoomUnderCap(state.cashBalance) <= 0,
    [state.cashBalance],
  );

  const value = useMemo(
    () => ({
      ...state,
      ...adStats,
      mode,
      activeTab,
      setActiveTab,
      addCoins,
      grantPortalPlay,
      grantAdReward,
      cashout,
      claimDailyReward,
      conversionProgress,
      lastPayoutNotice,
      lastEarnNotice,
      flashEarnNotice: setLastEarnNotice,
      pendingCash,
      hasPriorCashout,
      cashoutMinimum,
      atCashCap,
      refreshWallet,
    }),
    [
      state,
      adStats,
      mode,
      activeTab,
      addCoins,
      grantPortalPlay,
      grantAdReward,
      cashout,
      claimDailyReward,
      conversionProgress,
      lastPayoutNotice,
      lastEarnNotice,
      pendingCash,
      hasPriorCashout,
      cashoutMinimum,
      atCashCap,
      refreshWallet,
    ],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return ctx;
}
