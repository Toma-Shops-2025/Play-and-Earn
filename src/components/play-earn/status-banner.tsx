"use client";

import { ECONOMY } from "@/lib/economy-config";
import { formatCash, formatCountdown } from "@/lib/format";
import { useWallet } from "@/context/wallet-provider";

export function StatusBanner() {
  const {
    coins,
    cashBalance,
    secondsUntilConversion,
    conversionProgress,
    lastPayoutNotice,
  } = useWallet();

  return (
    <section className="space-y-2">
      <div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 px-3 py-3 text-white shadow-md"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,.15) 0 2px, transparent 3px)",
          backgroundSize: "12px 12px",
        }}
      >
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl leading-none" aria-hidden>💵</span>
            <span className="text-sm font-bold tabular-nums">{coins}</span>
          </div>

          <div className="min-w-0 px-1">
            <p className="text-center text-[11px] font-medium leading-tight sm:text-xs">
              Next update in:{" "}
              <span className="font-bold tabular-nums">
                {formatCountdown(secondsUntilConversion)}
              </span>
            </p>
            <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-blue-900/35">
              <div
                className="h-full rounded-full bg-lime-400 transition-[width] duration-1000"
                style={{ width: `${conversionProgress}%` }}
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2 text-[9px] font-bold text-white/90">
                <span>$</span>
                <span>$$</span>
                <span>$$$</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-700/80 text-base">
              💰
            </div>
            <span className="text-sm font-bold text-lime-300 tabular-nums">
              {formatCash(cashBalance)}
            </span>
          </div>
        </div>
      </div>
      {lastPayoutNotice ? (
        <p className="rounded-xl bg-lime-50 px-3 py-2 text-center text-[11px] font-medium text-lime-900 shadow-sm sm:text-xs">
          {lastPayoutNotice}
        </p>
      ) : null}
      <p className="rounded-xl bg-white px-3 py-2 text-center text-[11px] leading-snug text-slate-600 shadow-sm sm:text-xs">
        Coins will be automatically changed into cash every{" "}
        {ECONOMY.conversionIntervalHours} hours (may be delayed, please wait
        patiently). Balances are virtual unless you enable real payouts.
      </p>
    </section>
  );
}
