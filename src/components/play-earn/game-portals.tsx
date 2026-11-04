"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ECONOMY } from "@/lib/economy-config";
import { PORTALS, type PortalId } from "@/lib/portals";
import {
  PORTAL_UPDATED_EVENT,
  remainingPortalMinutesToday,
  startPortalSession,
} from "@/lib/portal-session";
import { registerGameOpen } from "@/lib/game-session-ads";
import { showInterstitialWithFallback } from "@/lib/rewarded-ads";
import { useWallet } from "@/context/wallet-provider";
import { formatSignedRewardFromCoins } from "@/lib/format";

export function GamePortals() {
  const { lastEarnNotice } = useWallet();
  const [remaining, setRemaining] = useState(ECONOMY.portalPlay.maxMinutesPerDay);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function refresh() {
      setRemaining(remainingPortalMinutesToday());
    }
    refresh();
    window.addEventListener(PORTAL_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(PORTAL_UPDATED_EVENT, refresh);
  }, [lastEarnNotice]);

  async function openPortal(portalId: PortalId, url: string) {
    if (busy) return;
    if (remaining < ECONOMY.portalPlay.minMinutesToCredit) {
      return;
    }
    setBusy(true);
    try {
      const showInterstitial = registerGameOpen();
      if (showInterstitial) {
        await showInterstitialWithFallback();
      }
      startPortalSession(portalId);
      const { Capacitor } = await import("@capacitor/core");
      if (Capacitor.isNativePlatform()) {
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url, toolbarColor: "#0e0e20" });
      } else {
        const popup = window.open(url, "_blank", "noopener,noreferrer");
        if (!popup) {
          window.alert(
            "Allow pop-ups to open the arcade. Keep it open, then return here after at least 1 minute to collect cash.",
          );
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-2">
      <div>
        <h3 className="text-sm font-extrabold text-cyan-200">Arcade portals</h3>
        <p className="text-[11px] text-violet-200/70">
          {formatSignedRewardFromCoins(ECONOMY.portalPlay.coinsPerMinute)} / min · max{" "}
          {ECONOMY.portalPlay.maxMinutesPerSession} min/session · {remaining} min left today
        </p>
      </div>
      {lastEarnNotice ? (
        <p className="rounded-xl border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-center text-[11px] font-medium text-lime-200">
          {lastEarnNotice}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        {PORTALS.map((portal) => (
          <article
            key={portal.id}
            className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${portal.gradient} p-3 shadow-md`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white drop-shadow">
                  {portal.title}
                </h3>
                <p className="text-[11px] text-white/85">{portal.subtitle}</p>
              </div>
              <span className="text-2xl" aria-hidden>
                {portal.emoji}
              </span>
            </div>
            <Button
              type="button"
              disabled={busy || remaining < 1}
              onClick={() => void openPortal(portal.id, portal.url)}
              className="mt-6 h-10 w-full rounded-xl bg-lime-500 font-bold text-slate-900 hover:bg-lime-400"
            >
              {busy ? "Opening…" : remaining < 1 ? "Cap reached" : "Play"}
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}
