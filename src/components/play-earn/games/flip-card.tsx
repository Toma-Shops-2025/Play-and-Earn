"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/context/wallet-provider";
import { formatSignedRewardFromCoins, randomInt } from "@/lib/format";

const DECK = [1, 2, 3, 4] as const;

function shuffle<T>(items: readonly T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function FlipFace({
  flipped,
  prize,
  isWinner,
  dimmed,
  onPick,
  disabled,
  index,
}: {
  flipped: boolean;
  prize: number;
  isWinner: boolean;
  dimmed: boolean;
  onPick: () => void;
  disabled: boolean;
  index: number;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      aria-label={
        flipped
          ? isWinner
            ? `You won ${formatSignedRewardFromCoins(prize)}`
            : formatSignedRewardFromCoins(prize)
          : `Mystery card ${index + 1}`
      }
      className={`relative h-28 w-full rounded-2xl transition ${
        dimmed ? "opacity-50" : "hover:scale-[1.02]"
      }`}
      style={{ perspective: "1000px" }}
    >
      <div
        className="relative h-full w-full"
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Back (mystery) */}
        <div
          className="absolute inset-0 overflow-hidden rounded-2xl border-2 border-amber-100 shadow-md"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            background:
              "linear-gradient(145deg, #fdba74 0%, #f97316 48%, #ea580c 100%)",
          }}
          aria-hidden={flipped}
        >
          <div
            className="absolute inset-2 rounded-xl border border-white/30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 28% 22%, rgba(255,255,255,.3), transparent 42%), repeating-linear-gradient(45deg, rgba(255,255,255,.1) 0 7px, transparent 7px 14px)",
            }}
          />
          <div className="relative flex h-full flex-col items-center justify-center">
            <span className="text-4xl font-black text-white drop-shadow">?</span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-50">
              Flip
            </span>
          </div>
        </div>

        {/* Front (prize) */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 shadow-md ${
            isWinner
              ? "border-lime-400 from-lime-100 via-emerald-50 to-teal-100 bg-gradient-to-br"
              : "border-slate-200 from-slate-50 to-slate-100 bg-gradient-to-br"
          }`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
          aria-hidden={!flipped}
        >
          <span className="text-2xl" aria-hidden>
            {isWinner ? "🪙" : "✨"}
          </span>
          <span
            className={`mt-1 text-lg font-black ${
              isWinner ? "text-emerald-800" : "text-slate-600"
            }`}
          >
            {formatSignedRewardFromCoins(prize)}
          </span>
          <span
            className={`text-[10px] font-bold uppercase tracking-wide ${
              isWinner ? "text-emerald-700" : "text-slate-500"
            }`}
          >
            cash
          </span>
        </div>
      </div>
    </button>
  );
}

export function FlipCardGame({ onClose }: { onClose: () => void }) {
  const { addCoins } = useWallet();
  const prizes = useMemo(() => shuffle(DECK), []);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealAll, setRevealAll] = useState(false);

  function pick(index: number) {
    if (picked !== null) return;
    setPicked(index);
    void addCoins("flip", prizes[index]);
    window.setTimeout(() => setRevealAll(true), 500);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {prizes.map((prize, index) => {
          const isPicked = picked === index;
          const flipped = picked !== null && (isPicked || revealAll);
          return (
            <FlipFace
              key={index}
              index={index}
              flipped={flipped}
              prize={prize}
              isWinner={isPicked}
              dimmed={picked !== null && !isPicked}
              disabled={picked !== null}
              onPick={() => pick(index)}
            />
          );
        })}
      </div>

      {picked !== null ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-sm font-bold text-amber-900">
          You flipped {formatSignedRewardFromCoins(prizes[picked])}!
        </p>
      ) : (
        <p className="text-center text-xs text-slate-500">
          Pick one card — prizes are shuffled every round.
        </p>
      )}

      <Button type="button" variant="outline" className="w-full" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}
