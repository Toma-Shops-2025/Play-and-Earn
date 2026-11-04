"use client";

import { ECONOMY } from "@/lib/economy-config";
import { formatCash, formatCountdown } from "@/lib/format";
import { useWallet } from "@/context/wallet-provider";

export function StatusBanner() {
  const {
    pendingCash,
    cashBalance,
    secondsUntilConversion,
    conversionProgress,
    lastPayoutNotice,
    hasPriorCashout,
    cashoutMinimum,
    atCashCap,
  } = useWallet();

  return (
    <section className="space-y-2">
      <div
        className="relative overflow-hidden rounded-2xl border border-cyan-400/30 px-3 py-3 text-white shadow-[0_0_30px_rgba(34,211,238,0.25)]"
        style={{
          background:
            "linear-gradient(120deg, #0891b2 0%, #7c3aed 48%, #db2777 100%)",
        }}
      >
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-cyan-50/80">
              Pending
            </span>
            <span className="text-sm font-bold tabular-nums text-lime-200">
              {formatCash(pendingCash)}
            </span>
          </div>

          <div className="min-w-0 px-1">
            <p className="text-center text-[11px] font-medium leading-tight sm:text-xs">
              Next cashout in:{" "}
              <span className="font-bold tabular-nums">
                {formatCountdown(secondsUntilConversion)}
              </span>
            </p>
            <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-black/35">
              <div
                className="h-full rounded-full bg-lime-300 shadow-[0_0_12px_rgba(190,242,100,0.8)] transition-[width] duration-1000"
                style={{ width: `${conversionProgress}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-fuchsia-50/80">
              Ready
            </span>
            <span className="text-sm font-bold text-lime-300 tabular-nums">
              {formatCash(cashBalance)}
            </span>
          </div>
        </div>
      </div>
      {lastPayoutNotice ? (
        <p className="rounded-xl border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-center text-[11px] font-medium text-lime-200 shadow-sm sm:text-xs">
          {lastPayoutNotice}
        </p>
      ) : null}
      <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-[11px] leading-snug text-cyan-100/80 shadow-sm sm:text-xs">
        Earnings convert every {ECONOMY.conversionIntervalHours} hours to PayPal or
        Cash App.
        {hasPriorCashout
          ? " Cash out any amount."
          : ` First cashout needs ${formatCash(cashoutMinimum)}; after that, any amount.`}{" "}
        Ready balance caps at {formatCash(ECONOMY.maxCashBalanceVirtualDollars)}
        until you cash out.
        {atCashCap ? " You’re at the cap — cash out to keep stacking." : ""}
      </p>
    </section>
  );
}
