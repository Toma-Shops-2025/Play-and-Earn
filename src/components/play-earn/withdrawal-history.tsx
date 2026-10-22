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
      className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3.5 text-left shadow-sm transition hover:bg-slate-50"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <History className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-slate-800">Withdrawal history</p>
          <p className="text-xs text-slate-500">
            {latest
              ? `Latest: ${formatCash(latest.amount)} · ${latest.status}`
              : "No withdrawals yet"}
          </p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-slate-400" />
    </button>
  );
}
