"use client";

import { useEffect, useState } from "react";
import { AuthProvider } from "@/context/auth-provider";
import { WalletProvider, useWallet } from "@/context/wallet-provider";
import { BottomNav } from "@/components/play-earn/bottom-nav";
import { PayoutsView } from "@/components/play-earn/views/payouts-view";
import { RewardsView } from "@/components/play-earn/views/rewards-view";
import { GamesView } from "@/components/play-earn/views/games-view";
import { CustomView } from "@/components/play-earn/views/custom-view";
import { WatchAdView } from "@/components/play-earn/views/watch-ad-view";
import { ComplianceOnboarding } from "@/components/play-earn/compliance-onboarding";
import { getOnboarding } from "@/lib/compliance";
import { APP_CONFIG } from "@/lib/app-config";
import { NativeShell } from "@/components/play-earn/native-shell";

function PlayEarnShell() {
  const { activeTab, mode } = useWallet();
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    setOnboarded(getOnboarding() !== null);
    setReady(true);
  }, []);

  return (
    <div className="min-h-full bg-gradient-to-b from-sky-100 via-slate-50 to-slate-100 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto min-h-full max-w-md px-3 pb-24 pt-4">
        <header className="mb-4 text-center">
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
            {APP_CONFIG.name}
          </h1>
          <p className="text-xs text-slate-600">
            {mode === "cloud" ? "Cloud save · signed in" : "On-device save · sign in to sync"}
          </p>
        </header>

        {activeTab === "payouts" ? <PayoutsView /> : null}
        {activeTab === "rewards" ? <RewardsView /> : null}
        {activeTab === "watchAd" ? <WatchAdView /> : null}
        {activeTab === "games" ? <GamesView /> : null}
        {activeTab === "custom" ? <CustomView /> : null}
      </div>
      <BottomNav />
      {ready && !onboarded ? (
        <ComplianceOnboarding onComplete={() => setOnboarded(true)} />
      ) : null}
    </div>
  );
}

export function PlayEarnApp() {
  return (
    <AuthProvider>
      <WalletProvider>
        <NativeShell />
        <PlayEarnShell />
      </WalletProvider>
    </AuthProvider>
  );
}
