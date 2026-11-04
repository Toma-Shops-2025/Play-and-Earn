"use client";

import { ChevronRight, History } from "lucide-react";
import { formatCash } from "@/lib/format";
import { useWallet } from "@/context/wallet-provider";

export function WithdrawalHistory() {
  const { withdrawals } = useWallet();
  const latest = withdrawals[0];

  return (
    <button
      type="button"
      onClick={() =>
        document.getElementById("withdrawal-list")?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        })
      }
      className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-left shadow-sm transition hover:bg-white/10"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/20 text-fuchsia-200">
          <History className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-white">Payout history</p>
          <p className="text-xs text-violet-200/65">
            {latest
              ? `Latest: ${formatCash(latest.amount)} · ${latest.status}`
              : "No payouts yet"}
          </p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-violet-300/50" />
    </button>
  );
}
