"use client";

import { useEffect, useState } from "react";
import { PlayCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { REWARDED_AD_CONFIG } from "@/lib/ads-config";
import { formatAdRewardLabel, showRewardedAdWithFallback } from "@/lib/rewarded-ads";
import { useAuth } from "@/context/auth-provider";
import { useWallet } from "@/context/wallet-provider";
import { isSupabaseConfigured } from "@/lib/supabase/env";

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
      <section className="rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <PlayCircle className="h-10 w-10" strokeWidth={2.2} />
          <div>
            <h2 className="text-xl font-extrabold">Watch &amp; earn</h2>
            <p className="text-sm text-white/85">Unity LevelPlay rewarded videos</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-white/90">
          Complete a short video to earn{" "}
          <strong>{formatAdRewardLabel()}</strong> per view (recommended rate). Up to{" "}
          <strong>{REWARDED_AD_CONFIG.dailyLimit}</strong> videos per day.
        </p>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Today&apos;s progress
            </p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900 tabular-nums">
              {adsWatchedToday} / {REWARDED_AD_CONFIG.dailyLimit}
            </p>
          </div>
          <div className="rounded-2xl bg-lime-50 px-4 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase text-lime-800">Per ad</p>
            <p className="text-lg font-extrabold text-lime-700">
              +{REWARDED_AD_CONFIG.coinsPerAd}
            </p>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-violet-500 transition-all"
            style={{
              width: `${(adsWatchedToday / REWARDED_AD_CONFIG.dailyLimit) * 100}%`,
            }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
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
          <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-center text-sm text-slate-700">
            {message}
          </p>
        ) : null}

        {cloudRequired && !user ? (
          <p className="mt-3 flex items-start gap-2 text-xs text-amber-800">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
            Sign in under Profile so ad rewards are saved to your cloud wallet.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
        <p className="font-semibold text-slate-800">Monetization note</p>
        <p className="mt-1">
          Production Android builds use Unity LevelPlay. Configure your app key and rewarded ad
          unit in <code className="text-[10px]">android/.../levelplay.xml</code>. See{" "}
          <code className="text-[10px]">UNITY_ADS.md</code> in the repo.
        </p>
      </section>
    </div>
  );
}
