"use client";

import { StatusBanner } from "@/components/play-earn/status-banner";
import { WalletCard } from "@/components/play-earn/wallet-card";
import { WithdrawalHistory } from "@/components/play-earn/withdrawal-history";
import { GameGrid } from "@/components/play-earn/game-grid";
import { SiteLegalFooter } from "@/components/legal/site-legal-footer";
import { useWallet } from "@/context/wallet-provider";
import { formatCash } from "@/lib/format";

export function PayoutsView() {
  const { withdrawals } = useWallet();

  return (
    <div className="space-y-4">
      <StatusBanner />
      <WalletCard />
      <WithdrawalHistory />
      <GameGrid compact />

      {withdrawals.length > 0 ? (
        <section
          id="withdrawal-list"
          className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-cyan-100">Recent payouts</h2>
          <ul className="mt-2 space-y-2">
            {withdrawals.slice(0, 5).map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-xl bg-black/30 px-3 py-2 text-sm"
              >
                <span className="font-medium text-lime-300">
                  {formatCash(item.amount)}
                </span>
                <span className="text-xs capitalize text-violet-200/70">{item.status}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <SiteLegalFooter />
    </div>
  );
}
