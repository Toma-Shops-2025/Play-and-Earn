"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/auth-provider";
import type { GameId } from "@/lib/games";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { REWARDED_AD_CONFIG } from "@/lib/ads-config";
import { ECONOMY } from "@/lib/economy-config";
import {
  applyElapsedConversionPayouts,
  conversionProgressPercent,
  getDefaultConversionDueAt,
  secondsUntilConversionDue,
} from "@/lib/conversion";
import { APP_CONFIG } from "@/lib/app-config";
import { getLocalAdStats, grantLocalAdReward } from "@/lib/ad-rewards-local";
import {
  cloudClaimDailyReward,
  cloudGrantAdReward,
  cloudGrantGameCoins,
  cloudRequestWithdrawal,
  fetchCloudWallet,
} from "@/lib/wallet-api";

const STORAGE_KEY = "play-earn-wallet-v1";
const MIN_CASHOUT = APP_CONFIG.minCashoutVirtualDollars;

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
  grantAdReward: () => Promise<{ ok: boolean; message: string }>;
  cashout: (paypalEmail?: string) => Promise<{ ok: boolean; message: string }>;
  claimDailyReward: (dayIndex: number, coins: number) => Promise<boolean>;
  conversionProgress: number;
  lastPayoutNotice: string | null;
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
            void refreshWallet();
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
            `3-hour payout: +${applied.cashAdded.toFixed(2)} added to your balance`,
          );
        }
        return {
          ...prev,
          coins: applied.coins,
          cashBalance: applied.cashBalance,
          conversionDueAt: applied.conversionDueAt,
          secondsUntilConversion: secondsUntilConversionDue(applied.conversionDueAt),
        };
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

  const cashout = useCallback(async (paypalEmail?: string) => {
    if (cloudActive) {
      const result = await cloudRequestWithdrawal(paypalEmail);
      await refreshWallet();
      return result;
    }
    if (state.cashBalance < MIN_CASHOUT) {
      return {
        ok: false,
        message: `Minimum balance is $${MIN_CASHOUT.toFixed(2)} virtual. Watch ads or play games to earn more!`,
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
    return {
      ok: true,
      message: APP_CONFIG.realMoneyPayoutsEnabled
        ? `Withdrawal of $${amount.toFixed(2)} submitted for processing.`
        : `Virtual ledger entry for $${amount.toFixed(2)} (not real money).`,
    };
  }, [cloudActive, refreshWallet, state.cashBalance]);

  const claimDailyReward = useCallback(
    async (dayIndex: number, coins: number) => {
      if (cloudActive) {
        const ok = await cloudClaimDailyReward(dayIndex, coins);
        if (ok) await refreshWallet();
        return ok;
      }
      if (state.claimedRewardDays.includes(dayIndex)) return false;
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

  const value = useMemo(
    () => ({
      ...state,
      ...adStats,
      mode,
      activeTab,
      setActiveTab,
      addCoins,
      grantAdReward,
      cashout,
      claimDailyReward,
      conversionProgress,
      lastPayoutNotice,
      refreshWallet,
    }),
    [
      state,
      adStats,
      mode,
      activeTab,
      addCoins,
      grantAdReward,
      cashout,
      claimDailyReward,
      conversionProgress,
      lastPayoutNotice,
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
