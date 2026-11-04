"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthPanel } from "@/components/auth/auth-panel";
import { CoinPacks } from "@/components/play-earn/coin-packs";
import { SiteLegalFooter } from "@/components/legal/site-legal-footer";
import { APP_CONFIG } from "@/lib/app-config";
import { clearAllAppData } from "@/lib/compliance";
import { useAuth } from "@/context/auth-provider";
import { useWallet } from "@/context/wallet-provider";
import { formatCash } from "@/lib/format";

const AVATARS = ["🦊", "🐼", "🦁", "🐸", "🦄", "🐙"];

const LEGAL_LINKS = [
  { href: "/rules/", label: "How it works", hint: "Earning & cashout rules" },
  { href: "/faq/", label: "FAQ", hint: "Common questions" },
  { href: "/privacy/", label: "Privacy Policy", hint: "Data & ads" },
  { href: "/terms/", label: "Terms of Use", hint: "Eligibility & payouts" },
  { href: "/contact/", label: "Contact us", hint: "Support email" },
] as const;

export function CustomView() {
  const { mode, uid, cashBalance, pendingCash, hasPriorCashout } = useWallet();
  const { user } = useAuth();
  const [avatar, setAvatar] = useState("🦊");
  const [cleared, setCleared] = useState(false);

  const displayName = useMemo(() => {
    if (user?.user_metadata?.full_name) return String(user.user_metadata.full_name);
    if (user?.user_metadata?.name) return String(user.user_metadata.name);
    if (user?.email) return user.email.split("@")[0];
    return "Guest player";
  }, [user]);

  function handleDeleteData() {
    if (
      !window.confirm(
        "Delete all app data on this device? Balances and progress will reset.",
      )
    ) {
      return;
    }
    clearAllAppData();
    setCleared(true);
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-3xl border border-fuchsia-400/30 bg-gradient-to-br from-[#2a0a4a] via-[#14102e] to-[#0b122e] p-5 shadow-[0_0_36px_rgba(236,72,153,0.2)]">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-black/30 text-4xl">
            {avatar}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-fuchsia-200/70">
              Profile
            </p>
            <h2 className="truncate text-xl font-extrabold text-white">{displayName}</h2>
            <p className="mt-0.5 text-xs text-violet-200/70">
              UID {uid} · {mode === "cloud" ? "Cloud sync on" : "On-device only"}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-lime-400/20 bg-lime-400/10 px-3 py-2">
            <p className="text-[10px] font-bold uppercase text-lime-200/70">Ready</p>
            <p className="text-lg font-extrabold tabular-nums text-lime-300">
              {formatCash(cashBalance)}
            </p>
          </div>
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2">
            <p className="text-[10px] font-bold uppercase text-cyan-200/70">Pending</p>
            <p className="text-lg font-extrabold tabular-nums text-cyan-200">
              {formatCash(pendingCash)}
            </p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-violet-200/65">
          {hasPriorCashout
            ? "Any-amount cashouts unlocked after your first payout."
            : `First cashout needs ${formatCash(APP_CONFIG.firstCashoutMinVirtualDollars)}.`}
        </p>
      </section>

      <AuthPanel />
      <CoinPacks />

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h3 className="text-sm font-bold text-cyan-100">Legal &amp; help</h3>
        <div className="mt-3 space-y-2">
          {LEGAL_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
            >
              <span>
                <span className="block text-sm font-semibold text-white">{item.label}</span>
                <span className="block text-[11px] text-violet-200/60">{item.hint}</span>
              </span>
              <span className="text-cyan-300">→</span>
            </Link>
          ))}
          <a
            href={`mailto:${APP_CONFIG.supportEmail}`}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2.5"
          >
            <span>
              <span className="block text-sm font-semibold text-white">Email support</span>
              <span className="block text-[11px] text-violet-200/60">
                {APP_CONFIG.supportEmail}
              </span>
            </span>
            <span className="text-cyan-300">→</span>
          </a>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h3 className="text-sm font-bold text-cyan-100">Avatar</h3>
        <div className="mt-3 grid grid-cols-6 gap-2">
          {AVATARS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setAvatar(item)}
              className={`rounded-xl border py-2 text-2xl ${
                avatar === item
                  ? "border-lime-400 bg-lime-400/15"
                  : "border-white/15 bg-black/20"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4">
        <h3 className="font-semibold text-rose-200">Delete app data</h3>
        <p className="mt-1 text-xs text-rose-100/80">
          Clears on-device data
          {mode === "cloud"
            ? " (cloud balances stay until you request account deletion via support)"
            : ""}
          .
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full border-rose-300/40 text-rose-100 hover:bg-rose-500/20"
          onClick={handleDeleteData}
        >
          {cleared ? "Reloading…" : "Delete all data on device"}
        </Button>
        <p className="mt-2 text-[10px] text-violet-200/50">
          Version {APP_CONFIG.version} · {APP_CONFIG.packageId}
        </p>
      </section>

      <SiteLegalFooter />
    </div>
  );
}
