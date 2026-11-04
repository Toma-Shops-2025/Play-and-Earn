"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/context/wallet-provider";
import { formatSignedRewardFromCoins, randomInt } from "@/lib/format";

const SYMBOLS = [
  { emoji: "🍒", weight: 4 },
  { emoji: "🍋", weight: 4 },
  { emoji: "⭐", weight: 3 },
  { emoji: "💎", weight: 2 },
  { emoji: "7️⃣", weight: 1 },
] as const;

type Symbol = (typeof SYMBOLS)[number]["emoji"];

function pickSymbol(): Symbol {
  const total = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
  let roll = randomInt(1, total);
  for (const symbol of SYMBOLS) {
    roll -= symbol.weight;
    if (roll <= 0) return symbol.emoji;
  }
  return SYMBOLS[0].emoji;
}

function prizeFor(final: Symbol[]): number {
  const allMatch = final.every((s) => s === final[0]);
  if (allMatch) {
    if (final[0] === "7️⃣") return 8;
    if (final[0] === "💎") return 7;
    return 5;
  }
  const twoMatch =
    final[0] === final[1] || final[1] === final[2] || final[0] === final[2];
  if (twoMatch) return 3;
  return randomInt(0, 1);
}

function Reel({
  symbol,
  spinning,
  delayMs,
}: {
  symbol: Symbol;
  spinning: boolean;
  delayMs: number;
}) {
  const [display, setDisplay] = useState(symbol);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!spinning) {
      if (timer.current) window.clearInterval(timer.current);
      window.setTimeout(() => setDisplay(symbol), delayMs);
      return;
    }
    timer.current = window.setInterval(() => {
      setDisplay(SYMBOLS[randomInt(0, SYMBOLS.length - 1)].emoji);
    }, 70);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [spinning, symbol, delayMs]);

  return (
    <div className="relative flex h-24 flex-1 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-white via-violet-50 to-violet-100 shadow-[inset_0_8px_16px_rgba(15,23,42,0.18)] ring-2 ring-amber-300/80">
      <div
        className={`text-5xl drop-shadow-sm transition-transform duration-150 ${
          spinning ? "scale-110 blur-[0.4px]" : "scale-100"
        }`}
        style={{ transitionDelay: `${delayMs}ms` }}
      >
        {display}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-black/25 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-black/25 to-transparent" />
    </div>
  );
}

export function LuckySlot({ onClose }: { onClose: () => void }) {
  const { addCoins } = useWallet();
  const [reels, setReels] = useState<Symbol[]>(["🍒", "🍋", "⭐"]);
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [jackpotPulse, setJackpotPulse] = useState(false);

  function pull() {
    if (spinning) return;
    setSpinning(true);
    setMessage(null);
    setJackpotPulse(false);

    const final: Symbol[] = [pickSymbol(), pickSymbol(), pickSymbol()];
    window.setTimeout(() => {
      setReels(final);
      setSpinning(false);
      const prize = prizeFor(final);
      if (prize > 0) {
        void addCoins("slot", prize);
        setJackpotPulse(prize >= 5);
        setMessage(
          prize >= 5
            ? `Jackpot! ${formatSignedRewardFromCoins(prize)}`
            : `Nice hit — ${formatSignedRewardFromCoins(prize)}`,
        );
      } else {
        setMessage("No luck this time — try again!");
      }
    }, 1800);
  }

  return (
    <div className="space-y-4">
      <div
        className={`relative overflow-hidden rounded-3xl p-3 shadow-lg ${
          jackpotPulse ? "ring-2 ring-amber-300" : ""
        }`}
        style={{
          background:
            "linear-gradient(160deg, #4c1d95 0%, #2e1065 45%, #1e1b4b 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 15%, rgba(250,204,21,.45), transparent 35%), radial-gradient(circle at 85% 20%, rgba(244,114,182,.35), transparent 30%)",
          }}
        />

        <div className="relative mb-3 flex items-center justify-between px-1">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">
            Lucky Slot
          </p>
          <p className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-bold text-violet-100">
            Match 3 to jackpot
          </p>
        </div>

        <div className="relative rounded-2xl border border-amber-300/50 bg-black/25 p-2.5 shadow-inner">
          <div className="flex gap-2">
            {reels.map((symbol, i) => (
              <Reel
                key={i}
                symbol={symbol}
                spinning={spinning}
                delayMs={i * 180}
              />
            ))}
          </div>
          <div className="pointer-events-none absolute inset-x-4 top-1/2 h-0.5 -translate-y-1/2 bg-amber-300/40" />
        </div>

        <div className="relative mt-3 flex justify-center gap-3 text-lg" aria-hidden>
          <span>🔔</span>
          <span>💰</span>
          <span>🔔</span>
        </div>
      </div>

      {message ? (
        <p
          className={`rounded-xl px-3 py-2 text-center text-sm font-bold ${
            jackpotPulse
              ? "bg-amber-50 text-amber-800"
              : message.startsWith("No")
                ? "bg-slate-100 text-slate-600"
                : "bg-violet-50 text-violet-800"
          }`}
        >
          {message}
        </p>
      ) : (
        <p className="text-center text-xs text-slate-500">
          Pull the lever — 2 match pays {formatSignedRewardFromCoins(3)}, 3 match = jackpot.
        </p>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500"
          onClick={pull}
          disabled={spinning}
        >
          {spinning ? "Spinning…" : "⬇ Pull lever"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
