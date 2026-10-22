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
import { getLocalAdStats, grantLocalAdReward } from "@/lib/ad-rewards-local";
import {
  cloudClaimDailyReward,
  cloudGrantAdReward,
  cloudGrantGameCoins,
  cloudRequestWithdrawal,
  fetchCloudWallet,
} from "@/lib/wallet-api";

const CONVERSION_INTERVAL_SECONDS = 3 * 60 * 60;
const COINS_PER_CENT = 10;
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
  cashout: () => Promise<{ ok: boolean; message: string }>;
  claimDailyReward: (dayIndex: number, coins: number) => Promise<boolean>;
  conversionProgress: number;
  refreshWallet: () => Promise<void>;
};

const defaultState: WalletState = {
  uid: 6268237,
  coins: 10,
  cashBalance: 0.03,
  secondsUntilConversion: 1 * 3600 + 28 * 60 + 54,
  withdrawals: [],
  claimedRewardDays: [0, 1],
};

const WalletContext = createContext<WalletContextValue | null>(null);

function loadLocalState(): WalletState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) } as WalletState;
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

  const refreshWallet = useCallback(async () => {
    if (!cloudActive) return;
    const cloud = await fetchCloudWallet();
    if (!cloud) return;
    setState({
      uid: cloud.uid,
      coins: cloud.coins,
      cashBalance: cloud.cashBalance,
      secondsUntilConversion: cloud.secondsUntilConversion,
      withdrawals: cloud.withdrawals,
      claimedRewardDays: cloud.claimedRewardDays,
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
    if (cloudActive) {
      const id = window.setInterval(() => {
        void refreshWallet();
      }, 3000);
      return () => window.clearInterval(id);
    }

    const id = window.setInterval(() => {
      setState((prev) => {
        if (prev.secondsUntilConversion <= 1) {
          const addedCash = prev.coins / COINS_PER_CENT / 100;
          return {
            ...prev,
            coins: 0,
            cashBalance: prev.cashBalance + addedCash,
            secondsUntilConversion: CONVERSION_INTERVAL_SECONDS,
          };
        }
        return {
          ...prev,
          secondsUntilConversion: prev.secondsUntilConversion - 1,
        };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [hydrated, cloudActive, refreshWallet]);

  useEffect(() => {
    if (!hydrated || !cloudActive) return;
    const id = window.setInterval(() => {
      setState((prev) => ({
        ...prev,
        secondsUntilConversion: Math.max(0, prev.secondsUntilConversion - 1),
      }));
    }, 1000);
    return () => window.clearInterval(id);
  }, [hydrated, cloudActive]);

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

  const cashout = useCallback(async () => {
    if (cloudActive) {
      const result = await cloudRequestWithdrawal();
      await refreshWallet();
      return result;
    }
    if (state.cashBalance < 5) {
      return {
        ok: false,
        message: "Minimum cashout is $5.00. Keep playing to reach the threshold!",
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
      message: `Demo cashout recorded for $${amount.toFixed(2)} (virtual only).`,
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

  const conversionProgress = useMemo(() => {
    const elapsed = CONVERSION_INTERVAL_SECONDS - state.secondsUntilConversion;
    return Math.min(100, (elapsed / CONVERSION_INTERVAL_SECONDS) * 100);
  }, [state.secondsUntilConversion]);

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
