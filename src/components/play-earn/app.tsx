"use client";

import { WalletProvider, useWallet } from "@/context/wallet-provider";
import { BottomNav } from "@/components/play-earn/bottom-nav";
import { PayoutsView } from "@/components/play-earn/views/payouts-view";
import { RewardsView } from "@/components/play-earn/views/rewards-view";
import { GamesView } from "@/components/play-earn/views/games-view";
import { CustomView } from "@/components/play-earn/views/custom-view";

function PlayEarnShell() {
  const { activeTab } = useWallet();

  return (
    <div className="min-h-full bg-gradient-to-b from-sky-100 via-slate-50 to-slate-100">
      <div className="mx-auto min-h-full max-w-md px-3 pb-24 pt-4">
        <header className="mb-4 text-center">
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
            Play &amp; Earn Arcade
          </h1>
          <p className="text-xs text-slate-600">Demo rewards app — not real money</p>
        </header>

        {activeTab === "payouts" ? <PayoutsView /> : null}
        {activeTab === "rewards" ? <RewardsView /> : null}
        {activeTab === "games" ? <GamesView /> : null}
        {activeTab === "custom" ? <CustomView /> : null}
      </div>
      <BottomNav />
    </div>
  );
}

export function PlayEarnApp() {
  return (
    <WalletProvider>
      <PlayEarnShell />
    </WalletProvider>
  );
}
