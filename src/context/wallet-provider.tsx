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

const CONVERSION_INTERVAL_SECONDS = 3 * 60 * 60;
const COINS_PER_CENT = 10;
const STORAGE_KEY = "play-earn-wallet-v1";

export type TabId = "payouts" | "rewards" | "games" | "custom";

export type Withdrawal = {
  id: string;
  amount: number;
  status: "pending" | "completed";
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
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  addCoins: (amount: number) => void;
  cashout: () => { ok: boolean; message: string };
  claimDailyReward: (dayIndex: number, coins: number) => boolean;
  conversionProgress: number;
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

function loadState(): WalletState {
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
  const [state, setState] = useState<WalletState>(defaultState);
  const [activeTab, setActiveTab] = useState<TabId>("payouts");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
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
  }, [hydrated]);

  const addCoins = useCallback((amount: number) => {
    if (amount <= 0) return;
    setState((prev) => ({ ...prev, coins: prev.coins + amount }));
  }, []);

  const cashout = useCallback(() => {
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
  }, [state.cashBalance]);

  const claimDailyReward = useCallback((dayIndex: number, coins: number) => {
    if (state.claimedRewardDays.includes(dayIndex)) return false;
    setState((prev) => ({
      ...prev,
      coins: prev.coins + coins,
      claimedRewardDays: [...prev.claimedRewardDays, dayIndex],
    }));
    return true;
  }, [state.claimedRewardDays]);

  const conversionProgress = useMemo(() => {
    const elapsed = CONVERSION_INTERVAL_SECONDS - state.secondsUntilConversion;
    return Math.min(100, (elapsed / CONVERSION_INTERVAL_SECONDS) * 100);
  }, [state.secondsUntilConversion]);

  const value = useMemo(
    () => ({
      ...state,
      activeTab,
      setActiveTab,
      addCoins,
      cashout,
      claimDailyReward,
      conversionProgress,
    }),
    [
      state,
      activeTab,
      addCoins,
      cashout,
      claimDailyReward,
      conversionProgress,
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
