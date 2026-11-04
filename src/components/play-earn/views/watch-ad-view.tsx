"use client";

import { useEffect, useState } from "react";
import { PlayCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { REWARDED_AD_CONFIG } from "@/lib/ads-config";
import { formatAdRewardLabel, showRewardedAdWithFallback } from "@/lib/rewarded-ads";
import { useAuth } from "@/context/auth-provider";
import { useWallet } from "@/context/wallet-provider";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { MonetizationHint } from "@/components/play-earn/monetization-hint";
import { ECONOMY } from "@/lib/economy-config";

export function WatchAdView() {
  const { user } = useAuth();
  const { mode, grantAdReward, adsWatchedToday, adsRemainingToday } = useWallet();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const cloudRequired = isSupabaseConfigured();

  useEffect(() => {
    void import("@/lib/rewarded-ads").then(({ RewardedAds }) => RewardedAds.initialize());
  }, []);

  async function watchAd() {
    if (cloudRequired && mode !== "cloud") {
      setMessage("Sign in to sync ad rewards to your account.");
      return;
    }
    if (adsRemainingToday <= 0) {
      setMessage("You have reached today’s ad limit. Check back tomorrow!");
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const result = await showRewardedAdWithFallback();
      if (!result.rewarded) {
        setMessage(result.message ?? "Ad was not completed.");
        return;
      }
      const grant = await grantAdReward();
      setMessage(grant.message);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-violet-400/30 bg-gradient-to-br from-indigo-600 via-violet-700 to-fuchsia-700 p-6 text-white shadow-[0_0_40px_rgba(139,92,246,0.4)]">
        <div className="flex items-center gap-3">
          <PlayCircle className="h-10 w-10 text-lime-300" strokeWidth={2.2} />
          <div>
            <h2 className="text-xl font-extrabold">Watch &amp; earn</h2>
            <p className="text-sm text-fuchsia-100/85">Unity LevelPlay rewarded videos</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-white/90">
          Complete a short video to earn{" "}
          <strong className="text-lime-300">{formatAdRewardLabel()}</strong> per view. Up to{" "}
          <strong>{ECONOMY.rewardedAd.dailyLimit}</strong> videos per day — main cash engine.
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-violet-200/70">
              Today&apos;s progress
            </p>
            <p className="mt-1 text-2xl font-extrabold text-white tabular-nums">
              {adsWatchedToday} / {REWARDED_AD_CONFIG.dailyLimit}
            </p>
          </div>
          <div className="rounded-2xl border border-lime-400/40 bg-lime-400/10 px-4 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase text-lime-200">Per ad</p>
            <p className="text-lg font-extrabold text-lime-300">
              {formatAdRewardLabel()}
            </p>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400 transition-all"
            style={{
              width: `${(adsWatchedToday / REWARDED_AD_CONFIG.dailyLimit) * 100}%`,
            }}
          />
        </div>
        <p className="mt-2 text-xs text-violet-200/65">
          {adsRemainingToday} rewarded {adsRemainingToday === 1 ? "video" : "videos"} left today
        </p>

        <Button
          type="button"
          className="mt-5 h-12 w-full rounded-2xl text-base font-bold"
          disabled={busy || adsRemainingToday <= 0}
          onClick={() => void watchAd()}
        >
          {busy ? "Loading ad…" : adsRemainingToday > 0 ? "Watch rewarded video" : "Limit reached"}
        </Button>

        {message ? (
          <p className="mt-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-center text-sm text-cyan-100">
            {message}
          </p>
        ) : null}

        {cloudRequired && !user ? (
          <p className="mt-3 flex items-start gap-2 text-xs text-amber-200">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
            Sign in under Profile so ad rewards are saved to your cloud wallet.
          </p>
        ) : null}
      </section>

      <MonetizationHint />
    </div>
  );
}
