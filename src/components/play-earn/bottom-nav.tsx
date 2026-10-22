"use client";

import { Gamepad2, Gift, Shirt, Wallet } from "lucide-react";
import type { TabId } from "@/context/wallet-provider";
import { useWallet } from "@/context/wallet-provider";

const tabs: { id: TabId; label: string; icon: typeof Wallet }[] = [
  { id: "payouts", label: "Payouts", icon: Wallet },
  { id: "rewards", label: "Rewards", icon: Gift },
  { id: "games", label: "Games", icon: Gamepad2 },
  { id: "custom", label: "Profile", icon: Shirt },
];

export function BottomNav() {
  const { activeTab, setActiveTab } = useWallet();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur"
      aria-label="Main"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-medium transition ${
                active ? "text-sky-600" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "fill-sky-100" : ""}`} />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
