"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/context/wallet-provider";
import { randomInt } from "@/lib/format";

export function ScratchCardGame({ onClose }: { onClose: () => void }) {
  const { addCoins } = useWallet();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [prize] = useState(() => randomInt(2, 6));
  const [revealed, setRevealed] = useState(false);
  const [scratchedPixels, setScratchedPixels] = useState(0);

  function initCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("Scratch here", 50, 60);
  }

  function scratch(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] === 0) transparent += 1;
    }
    const ratio = transparent / (canvas.width * canvas.height);
    setScratchedPixels(ratio);
    if (ratio > 0.45) {
      setRevealed(true);
      addCoins(prize);
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative mx-auto h-36 w-full max-w-xs overflow-hidden rounded-2xl bg-gradient-to-br from-pink-200 to-rose-400">
        <p className="absolute inset-0 flex items-center justify-center text-3xl font-extrabold text-rose-900">
          +{prize} 🪙
        </p>
        {!revealed ? (
          <canvas
            ref={(node) => {
              if (node && node.width === 0) {
                node.width = 280;
                node.height = 144;
                initCanvas(node);
              }
            }}
            className="absolute inset-0 h-full w-full touch-none"
            onPointerDown={scratch}
            onPointerMove={(e) => {
              if (e.buttons === 1) scratch(e);
            }}
          />
        ) : null}
      </div>
      <p className="text-center text-sm text-slate-600">
        {revealed
          ? `Prize revealed: ${prize} coins added!`
          : `Scratch ${Math.round(scratchedPixels * 100)}% · reveal ~45% to win`}
      </p>
      <Button type="button" variant="outline" className="w-full" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}
