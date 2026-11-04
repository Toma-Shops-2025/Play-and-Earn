"use client";

import { Gamepad2, Gift, PlayCircle, UserRound, Wallet } from "lucide-react";
import type { TabId } from "@/context/wallet-provider";
import { useWallet } from "@/context/wallet-provider";

const tabs: { id: TabId; label: string; icon: typeof Wallet }[] = [
  { id: "payouts", label: "Payouts", icon: Wallet },
  { id: "rewards", label: "Daily", icon: Gift },
  { id: "watchAd", label: "Watch Ad", icon: PlayCircle },
  { id: "games", label: "Games", icon: Gamepad2 },
  { id: "custom", label: "Profile", icon: UserRound },
];

export function BottomNav() {
  const { activeTab, setActiveTab } = useWallet();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-fuchsia-400/20 bg-[#0a0818]/95 backdrop-blur-xl"
      aria-label="Main"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[10px] font-medium transition ${
                active
                  ? "text-lime-300 drop-shadow-[0_0_10px_rgba(190,242,100,0.8)]"
                  : "text-violet-200/55 hover:text-cyan-200"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "stroke-[2.4]" : ""}`} />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
