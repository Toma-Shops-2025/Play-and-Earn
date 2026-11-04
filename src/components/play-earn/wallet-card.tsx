"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCash } from "@/lib/format";
import { APP_CONFIG } from "@/lib/app-config";
import { useWallet } from "@/context/wallet-provider";
import {
  loadPayoutDestination,
  savePayoutDestination,
  validatePayoutDestination,
  type PayoutMethod,
} from "@/lib/payout-destination";

export function WalletCard() {
  const {
    uid,
    cashBalance,
    cashout,
    mode,
    hasPriorCashout,
    cashoutMinimum,
    atCashCap,
  } = useWallet();
  const [message, setMessage] = useState<string | null>(null);
  const [method, setMethod] = useState<PayoutMethod>("paypal");
  const [destination, setDestination] = useState("");
  const [payoutAgreed, setPayoutAgreed] = useState(false);

  useEffect(() => {
    const saved = loadPayoutDestination();
    if (!saved) return;
    setMethod(saved.method);
    setDestination(saved.destination);
  }, []);

  async function handleCashout() {
    if (!payoutAgreed) {
      setMessage("Confirm the payout terms checkbox first.");
      return;
    }
    const checked = validatePayoutDestination(method, destination);
    if (!checked.ok) {
      setMessage(checked.message);
      return;
    }
    savePayoutDestination({ method, destination: checked.destination });
    const result = await cashout({
      method,
      destination: checked.destination,
    });
    setMessage(result.message);
    window.setTimeout(() => setMessage(null), 6000);
  }

  function handleSaveDestination() {
    const checked = validatePayoutDestination(method, destination);
    if (!checked.ok) {
      setMessage(checked.message);
      return;
    }
    savePayoutDestination({ method, destination: checked.destination });
    setDestination(checked.destination);
    setMessage(
      method === "cashapp"
        ? `Cash App ${checked.destination} saved for 3-hour auto payouts.`
        : `PayPal ${checked.destination} saved for 3-hour auto payouts.`,
    );
  }

  return (
    <section className="rounded-3xl border border-fuchsia-400/30 bg-gradient-to-br from-[#2a0a4a] via-[#1a1040] to-[#0b122e] p-4 text-white shadow-[0_0_40px_rgba(236,72,153,0.25)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-400 text-lg text-slate-900">
            💰
          </div>
          <span className="text-xs text-fuchsia-100/80">Cashable balance</span>
        </div>
        <span className="text-xs text-cyan-200/80">UID: {uid}</span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-4xl font-extrabold tracking-tight text-lime-300 tabular-nums drop-shadow-[0_0_12px_rgba(163,230,53,0.55)]">
            {formatCash(cashBalance)}
          </p>
          <p className="mt-1 text-sm text-white/70">
            {APP_CONFIG.realMoneyPayoutsEnabled
              ? hasPriorCashout
                ? "Cash out any amount every 3 hours"
                : `First cashout ${formatCash(cashoutMinimum)} · then any amount`
              : "Demo mode"}
          </p>
          {atCashCap ? (
            <p className="mt-1 text-xs font-medium text-amber-200">
              Cap hit at {formatCash(APP_CONFIG.maxCashBalanceVirtualDollars)} —
              cash out to keep earning.
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0" aria-hidden>
          <span className="h-8 w-8 rounded-full bg-rose-500 opacity-90 shadow-[0_0_16px_rgba(244,63,94,0.7)]" />
          <span className="-ml-4 h-8 w-8 rounded-full bg-amber-300 opacity-90 shadow-[0_0_16px_rgba(252,211,77,0.7)]" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMethod("paypal")}
          className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
            method === "paypal"
              ? "bg-sky-400 text-slate-950 shadow-[0_0_18px_rgba(56,189,248,0.55)]"
              : "bg-white/10 text-white/80"
          }`}
        >
          PayPal
        </button>
        <button
          type="button"
          onClick={() => setMethod("cashapp")}
          className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
            method === "cashapp"
              ? "bg-lime-400 text-slate-950 shadow-[0_0_18px_rgba(163,230,53,0.55)]"
              : "bg-white/10 text-white/80"
          }`}
        >
          Cash App
        </button>
      </div>

      <input
        type={method === "paypal" ? "email" : "text"}
        autoComplete={method === "paypal" ? "email" : "username"}
        placeholder={
          method === "paypal" ? "PayPal email" : "Cash App $Cashtag"
        }
        className="mt-3 h-11 w-full rounded-xl border border-white/20 bg-black/30 px-3 text-sm text-white placeholder:text-white/40"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
      />

      <label className="mt-3 flex items-start gap-2 text-[11px] leading-snug text-violet-100/85">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-violet-400"
          checked={payoutAgreed}
          onChange={(e) => setPayoutAgreed(e.target.checked)}
        />
        <span>
          I confirm this payout destination is mine and I accept the{" "}
          <Link href="/terms/" className="font-semibold text-cyan-300 underline">
            Terms
          </Link>{" "}
          for rewards and withdrawals.
        </span>
      </label>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleSaveDestination}
          className="h-11 rounded-2xl border-cyan-300/40 bg-white/5 text-cyan-100 hover:bg-white/10"
        >
          Save method
        </Button>
        <Button
          type="button"
          onClick={() => void handleCashout()}
          disabled={!payoutAgreed}
          className="h-11 rounded-2xl bg-lime-400 text-base font-bold text-slate-950 hover:bg-lime-300 disabled:opacity-50"
        >
          Cash out now
        </Button>
      </div>

      <p className="mt-2 text-center text-[10px] text-white/55">
        {mode === "cloud"
          ? "When the 3-hour timer hits, ready cash auto-queues to your saved PayPal or Cash App."
          : "Save a destination so the 3-hour timer can auto-queue payouts on this device."}
        {method === "cashapp"
          ? " Cash App payouts are queued for processing (PayPal can auto-send when automation is on)."
          : ""}
      </p>

      {message ? (
        <p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-center text-xs text-lime-200">
          {message}
        </p>
      ) : null}
    </section>
  );
}
