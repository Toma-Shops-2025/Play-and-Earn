"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCash } from "@/lib/format";
import { useWallet } from "@/context/wallet-provider";

export function WalletCard() {
  const { uid, cashBalance, cashout } = useWallet();
  const [message, setMessage] = useState<string | null>(null);

  function handleCashout() {
    const result = cashout();
    setMessage(result.message);
    window.setTimeout(() => setMessage(null), 4000);
  }

  return (
    <section className="rounded-3xl bg-gradient-to-br from-[#1a2f6b] via-[#15285f] to-[#0f1f4d] p-4 text-white shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold">
            PP
          </div>
          <span className="text-xs text-white/70">PayPal wallet</span>
        </div>
        <span className="text-xs text-white/80">UID: {uid}</span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-4xl font-extrabold tracking-tight text-lime-400 tabular-nums">
            {formatCash(cashBalance)}
          </p>
          <p className="mt-1 text-sm text-white/75">Keep playing to earn more!</p>
        </div>
        <div className="flex shrink-0" aria-hidden>
          <span className="h-8 w-8 rounded-full bg-red-500 opacity-90" />
          <span className="-ml-4 h-8 w-8 rounded-full bg-amber-400 opacity-90" />
        </div>
      </div>

      <Button
        type="button"
        onClick={handleCashout}
        className="mt-5 h-12 w-full rounded-2xl bg-lime-500 text-base font-bold text-slate-900 hover:bg-lime-400"
      >
        Cashout
      </Button>

      {message ? (
        <p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-center text-xs text-white/90">
          {message}
        </p>
      ) : null}
    </section>
  );
}
