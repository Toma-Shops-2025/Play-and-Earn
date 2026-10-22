"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/context/wallet-provider";
import { randomInt } from "@/lib/format";

const SEGMENTS = ["+1", "+2", "+3", "+5", "+1", "+2"];

export function LuckySpin({ onClose }: { onClose: () => void }) {
  const { addCoins } = useWallet();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function spin() {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    const index = randomInt(0, SEGMENTS.length - 1);
    const prize = Number(SEGMENTS[index].replace("+", ""));
    const segmentAngle = 360 / SEGMENTS.length;
    const extraTurns = 4 * 360;
    const target = extraTurns + (SEGMENTS.length - index) * segmentAngle;

    setRotation((prev) => prev + target);
    window.setTimeout(() => {
      addCoins(prize);
      setResult(`You won ${prize} coins!`);
      setSpinning(false);
    }, 2200);
  }

  return (
    <div className="space-y-4">
      <div className="relative mx-auto flex h-48 w-48 items-center justify-center">
        <div
          className="absolute inset-0 rounded-full border-8 border-amber-300 bg-gradient-to-br from-sky-400 to-indigo-500 shadow-inner transition-transform duration-[2200ms] ease-out"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {SEGMENTS.map((label, i) => (
            <div
              key={label + i}
              className="absolute left-1/2 top-2 -translate-x-1/2 text-sm font-bold text-white"
              style={{ transform: `rotate(${i * (360 / SEGMENTS.length)}deg) translateY(70px)` }}
            >
              {label}
            </div>
          ))}
        </div>
        <div className="z-10 h-0 w-0 border-x-8 border-b-[16px] border-x-transparent border-b-rose-500" />
      </div>
      {result ? <p className="text-center font-semibold text-lime-600">{result}</p> : null}
      <div className="flex gap-2">
        <Button type="button" className="flex-1" onClick={spin} disabled={spinning}>
          {spinning ? "Spinning…" : "Spin"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>Done</Button>
      </div>
    </div>
  );
}
