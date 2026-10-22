"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/context/wallet-provider";
import { randomInt } from "@/lib/format";

const SYMBOLS = ["🍒", "🍋", "⭐", "💎", "7️⃣"];

export function LuckySlot({ onClose }: { onClose: () => void }) {
  const { addCoins } = useWallet();
  const [reels, setReels] = useState(["🍒", "🍋", "⭐"]);
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function pull() {
    if (spinning) return;
    setSpinning(true);
    setMessage(null);
    let ticks = 0;
    const id = window.setInterval(() => {
      setReels([
        SYMBOLS[randomInt(0, SYMBOLS.length - 1)],
        SYMBOLS[randomInt(0, SYMBOLS.length - 1)],
        SYMBOLS[randomInt(0, SYMBOLS.length - 1)],
      ]);
      ticks += 1;
      if (ticks >= 12) {
        window.clearInterval(id);
        const final = [
          SYMBOLS[randomInt(0, SYMBOLS.length - 1)],
          SYMBOLS[randomInt(0, SYMBOLS.length - 1)],
          SYMBOLS[randomInt(0, SYMBOLS.length - 1)],
        ];
        setReels(final);
        const allMatch = final.every((s) => s === final[0]);
        const twoMatch = final[0] === final[1] || final[1] === final[2];
        const prize = allMatch ? 8 : twoMatch ? 3 : randomInt(0, 1);
        if (prize > 0) void addCoins("slot", prize);
        setMessage(
          prize > 0 ? `You won ${prize} coins!` : "No luck this time — try again!",
        );
        setSpinning(false);
      }
    }, 120);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-violet-900 p-4 text-center text-4xl">
        {reels.map((symbol, i) => (
          <div
            key={i}
            className="rounded-xl bg-white/95 py-4 shadow-inner"
          >
            {symbol}
          </div>
        ))}
      </div>
      {message ? <p className="text-center font-semibold text-violet-700">{message}</p> : null}
      <div className="flex gap-2">
        <Button type="button" className="flex-1" onClick={pull} disabled={spinning}>
          {spinning ? "Rolling…" : "Pull lever"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>Done</Button>
      </div>
    </div>
  );
}
