"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/context/wallet-provider";
import { formatSignedRewardFromCoins, randomInt } from "@/lib/format";

const CANVAS_W = 320;
const CANVAS_H = 168;
const BRUSH = 22;
const REVEAL_AT = 0.42;

function paintCover(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H);
  gradient.addColorStop(0, "#94a3b8");
  gradient.addColorStop(0.5, "#cbd5e1");
  gradient.addColorStop(1, "#64748b");
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Foil speckles
  for (let i = 0; i < 90; i += 1) {
    ctx.fillStyle = `rgba(255,255,255,${0.08 + Math.random() * 0.18})`;
    ctx.beginPath();
    ctx.arc(
      Math.random() * CANVAS_W,
      Math.random() * CANVAS_H,
      1 + Math.random() * 2.5,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  ctx.fillStyle = "#334155";
  ctx.font = "800 18px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SCRATCH HERE", CANVAS_W / 2, CANVAS_H / 2 - 8);
  ctx.font = "600 12px system-ui, sans-serif";
  ctx.fillStyle = "#475569";
  ctx.fillText("Drag to reveal your prize", CANVAS_W / 2, CANVAS_H / 2 + 16);
}

export function ScratchCardGame({ onClose }: { onClose: () => void }) {
  const { addCoins } = useWallet();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scratching = useRef(false);
  const credited = useRef(false);
  const [prize] = useState(() => randomInt(2, 6));
  const [revealed, setRevealed] = useState(false);
  const [scratchedPct, setScratchedPct] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    paintCover(ctx);
    setReady(true);
  }, []);

  function pointerToCanvas(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  }

  function eraseAt(x: number, y: number) {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, BRUSH, 0, Math.PI * 2);
    ctx.fill();

    // Sample every other pixel for speed
    const data = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H).data;
    let transparent = 0;
    const total = CANVAS_W * CANVAS_H;
    for (let i = 3; i < data.length; i += 16) {
      if (data[i] < 40) transparent += 1;
    }
    const sampled = Math.ceil(total / 4);
    const ratio = transparent / sampled;
    setScratchedPct(Math.min(100, Math.round(ratio * 100)));

    if (ratio >= REVEAL_AT && !credited.current) {
      credited.current = true;
      setRevealed(true);
      void addCoins("scratch", prize);
    }
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (revealed) return;
    scratching.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = pointerToCanvas(e);
    if (pt) eraseAt(pt.x, pt.y);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!scratching.current || revealed) return;
    const pt = pointerToCanvas(e);
    if (pt) eraseAt(pt.x, pt.y);
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    scratching.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // already released
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative mx-auto h-40 w-full max-w-xs overflow-hidden rounded-2xl border border-rose-200 bg-gradient-to-br from-pink-200 via-rose-300 to-fuchsia-400 shadow-inner">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <p className="text-3xl font-black text-rose-950 drop-shadow-sm">
            {formatSignedRewardFromCoins(prize)}
          </p>
          <p className="text-sm font-bold text-rose-900/80">cash</p>
        </div>
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full touch-none ${
            revealed ? "pointer-events-none opacity-0 transition-opacity duration-500" : ""
          }`}
          style={{ cursor: revealed ? "default" : "crosshair" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        {!ready ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-300 text-sm font-bold text-slate-600">
            Loading card…
          </div>
        ) : null}
      </div>

      <p className="text-center text-sm text-slate-600">
        {revealed
          ? `Prize revealed: ${formatSignedRewardFromCoins(prize)} added!`
          : `Scratch ${scratchedPct}% · uncover ~${Math.round(REVEAL_AT * 100)}% to claim`}
      </p>
      <Button type="button" variant="outline" className="w-full" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}
