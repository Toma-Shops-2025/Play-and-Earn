"use client";

import { ECONOMY, estimatedAdRevenueUsd, virtualValuePerAdUsd } from "@/lib/economy-config";
import { APP_CONFIG } from "@/lib/app-config";

export function MonetizationHint() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }
  const rev = estimatedAdRevenueUsd();
  const grant = virtualValuePerAdUsd();
  const healthy = grant <= rev * 0.6;

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-950">
      <p className="font-semibold">Operator note (profitability)</p>
      <p className="mt-1">
        Rewarded ads earn roughly ~${rev.toFixed(3)} each at ${ECONOMY.planningRewardedEcpmUsd}{" "}
        eCPM planning. Each ad grants ~${grant.toFixed(3)} virtual value in coins —{" "}
        {healthy ? "within a safe band" : "tune ECONOMY in economy-config.ts"}.
        {!APP_CONFIG.realMoneyPayoutsEnabled
          ? " Real-money payouts are off; enable only when LevelPlay + IAP revenue exceed liabilities."
          : " Real payouts enabled — monitor daily."}
      </p>
    </section>
  );
}
