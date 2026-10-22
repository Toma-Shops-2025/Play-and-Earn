"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/context/wallet-provider";
import { randomInt } from "@/lib/format";

export function FlipCardGame({ onClose }: { onClose: () => void }) {
  const { addCoins } = useWallet();
  const [picked, setPicked] = useState<number | null>(null);
  const prizes = [1, 2, 4, 3];

  function pick(index: number) {
    if (picked !== null) return;
    setPicked(index);
    addCoins(prizes[index]);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {prizes.map((prize, index) => {
          const isPicked = picked === index;
          const flipped = picked !== null;
          return (
            <button
              key={index}
              type="button"
              onClick={() => pick(index)}
              disabled={picked !== null}
              className={`h-24 rounded-2xl border-2 text-lg font-bold transition ${
                flipped
                  ? isPicked
                    ? "border-lime-500 bg-lime-50 text-lime-800"
                    : "border-slate-200 bg-slate-100 text-slate-500"
                  : "border-orange-300 bg-gradient-to-br from-orange-300 to-amber-400 text-orange-950 hover:scale-[1.02]"
              }`}
            >
              {flipped ? `+${prize} coins` : "?"}
            </button>
          );
        })}
      </div>
      {picked !== null ? (
        <p className="text-center font-semibold text-orange-700">
          You picked card {picked + 1} and won {prizes[picked]} coins!
        </p>
      ) : (
        <p className="text-center text-sm text-slate-600">Pick one card to reveal your prize.</p>
      )}
      <Button type="button" variant="outline" className="w-full" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}
