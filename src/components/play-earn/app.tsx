"use client";

import { useEffect, useState } from "react";
import { AuthDeepLinkHandler } from "@/components/auth/auth-deep-link";
import { AuthProvider } from "@/context/auth-provider";
import { WalletProvider, useWallet } from "@/context/wallet-provider";
import { BottomNav } from "@/components/play-earn/bottom-nav";
import { PayoutsView } from "@/components/play-earn/views/payouts-view";
import { RewardsView } from "@/components/play-earn/views/rewards-view";
import { GamesView } from "@/components/play-earn/views/games-view";
import { CustomView } from "@/components/play-earn/views/custom-view";
import { WatchAdView } from "@/components/play-earn/views/watch-ad-view";
import { PayPalReturnHandler } from "@/components/play-earn/paypal-return";
import { ComplianceOnboarding } from "@/components/play-earn/compliance-onboarding";
import { getOnboarding } from "@/lib/compliance";
import { APP_CONFIG } from "@/lib/app-config";
import { NativeShell } from "@/components/play-earn/native-shell";
import { PortalPlayListener } from "@/components/play-earn/portal-play-listener";

function PlayEarnShell() {
  const { activeTab, mode } = useWallet();
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    setOnboarded(getOnboarding() !== null);
    setReady(true);
  }, []);

  return (
    <div className="min-h-full bg-[#070714] pt-[env(safe-area-inset-top)] text-white">
      <div className="mx-auto min-h-full max-w-md px-3 pb-24 pt-4">
        <PayPalReturnHandler />
        <header className="mb-4 text-center">
          <h1 className="text-lg font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-lime-300 drop-shadow-[0_0_18px_rgba(232,121,249,0.45)]">
            {APP_CONFIG.name}
          </h1>
          <p className="text-xs text-violet-200/70">
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
      <AuthDeepLinkHandler />
      <WalletProvider>
        <NativeShell />
        <PortalPlayListener />
        <PlayEarnShell />
      </WalletProvider>
    </AuthProvider>
  );
}
