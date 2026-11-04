"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/context/wallet-provider";
import { formatSignedRewardFromCoins, randomInt } from "@/lib/format";

const SEGMENTS = [
  { label: "+1", coins: 1, color: "#38bdf8" },
  { label: "+2", coins: 2, color: "#a78bfa" },
  { label: "+3", coins: 3, color: "#f472b6" },
  { label: "+2", coins: 2, color: "#fbbf24" },
  { label: "+1", coins: 1, color: "#34d399" },
  { label: "+4", coins: 4, color: "#fb7185" },
  { label: "+2", coins: 2, color: "#60a5fa" },
  { label: "+1", coins: 1, color: "#c084fc" },
] as const;

const SIZE = 220;
const CX = SIZE / 2;
const CY = SIZE / 2;
const OUTER_R = 104;
const INNER_R = 28;
const LABEL_R = 68;
const SPIN_MS = 3200;

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function segmentPath(index: number, total: number) {
  const sweep = 360 / total;
  const start = index * sweep;
  const end = start + sweep;
  const large = sweep > 180 ? 1 : 0;
  const p1 = polar(CX, CY, OUTER_R, start);
  const p2 = polar(CX, CY, OUTER_R, end);
  const p3 = polar(CX, CY, INNER_R, end);
  const p4 = polar(CX, CY, INNER_R, start);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${large} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${INNER_R} ${INNER_R} 0 ${large} 0 ${p4.x} ${p4.y}`,
    "Z",
  ].join(" ");
}

export function LuckySpin({ onClose }: { onClose: () => void }) {
  const { addCoins } = useWallet();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const paths = useMemo(
    () => SEGMENTS.map((_, i) => segmentPath(i, SEGMENTS.length)),
    [],
  );

  function spin() {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    const index = randomInt(0, SEGMENTS.length - 1);
    const prize = SEGMENTS[index].coins;
    const sweep = 360 / SEGMENTS.length;
    // Pointer sits at top (12 o'clock). Align winning segment center under it.
    const segmentCenter = index * sweep + sweep / 2;
    const extraTurns = (4 + randomInt(0, 2)) * 360;
    setRotation((prev) => {
      const normalized = ((prev % 360) + 360) % 360;
      const delta = (360 - segmentCenter - normalized + 360) % 360;
      return prev + extraTurns + delta;
    });

    window.setTimeout(() => {
      void addCoins("spin", prize);
      setResult(`You won ${formatSignedRewardFromCoins(prize)}!`);
      setSpinning(false);
    }, SPIN_MS);
  }

  return (
    <div className="space-y-4">
      <div className="relative mx-auto flex w-full max-w-[260px] flex-col items-center">
        {/* Pointer at top */}
        <div
          className="relative z-20 mb-[-10px] h-0 w-0 border-x-[10px] border-t-[18px] border-x-transparent border-t-rose-500 drop-shadow"
          aria-hidden
        />

        <div className="relative">
          <div
            className="rounded-full p-1.5 shadow-[0_10px_30px_rgba(15,23,42,0.25)]"
            style={{
              background:
                "conic-gradient(from 0deg, #fbbf24, #f59e0b, #fde68a, #f59e0b, #fbbf24)",
            }}
          >
            <div
              className="rounded-full bg-slate-900 p-1"
              style={{
                transition: `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.75, 0.12, 1)`,
                transform: `rotate(${rotation}deg)`,
              }}
            >
              <svg
                width={SIZE}
                height={SIZE}
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                className="block overflow-visible"
                aria-hidden
              >
                <defs>
                  <filter id="spin-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25" />
                  </filter>
                </defs>
                {SEGMENTS.map((seg, i) => {
                  const mid = i * (360 / SEGMENTS.length) + 360 / SEGMENTS.length / 2;
                  const label = polar(CX, CY, LABEL_R, mid);
                  return (
                    <g key={`${seg.label}-${i}`}>
                      <path
                        d={paths[i]}
                        fill={seg.color}
                        stroke="#0f172a"
                        strokeWidth="1.5"
                        filter="url(#spin-shadow)"
                      />
                      <text
                        x={label.x}
                        y={label.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#0f172a"
                        fontSize="16"
                        fontWeight="800"
                        transform={`rotate(${mid}, ${label.x}, ${label.y})`}
                      >
                        {seg.label}
                      </text>
                    </g>
                  );
                })}
                <circle cx={CX} cy={CY} r={INNER_R} fill="#0f172a" />
                <circle cx={CX} cy={CY} r={INNER_R - 6} fill="#1e293b" stroke="#fbbf24" strokeWidth="3" />
                <text
                  x={CX}
                  y={CY + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fde68a"
                  fontSize="11"
                  fontWeight="800"
                >
                  SPIN
                </text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {result ? (
        <p className="rounded-xl bg-lime-50 px-3 py-2 text-center text-sm font-bold text-lime-700">
          {result}
        </p>
      ) : (
        <p className="text-center text-xs text-slate-500">
          Tap Spin — land on a slice to win cash.
        </p>
      )}

      <div className="flex gap-2">
        <Button type="button" className="flex-1" onClick={spin} disabled={spinning}>
          {spinning ? "Spinning…" : "Spin"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
