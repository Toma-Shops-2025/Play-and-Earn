"use client";

import { useState } from "react";
import { GAMES, type GameId } from "@/lib/games";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LuckySpin } from "@/components/play-earn/games/lucky-spin";
import { LuckySlot } from "@/components/play-earn/games/lucky-slot";
import { ScratchCardGame } from "@/components/play-earn/games/scratch-card";
import { FlipCardGame } from "@/components/play-earn/games/flip-card";

export function GameGrid({ compact = false }: { compact?: boolean }) {
  const [openGame, setOpenGame] = useState<GameId | null>(null);

  const active = GAMES.find((g) => g.id === openGame);

  return (
    <>
      <div
        className={
          compact
            ? "grid grid-cols-2 gap-3"
            : "grid grid-cols-1 gap-3 sm:grid-cols-2"
        }
      >
        {GAMES.map((game) => (
          <article
            key={game.id}
            className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${game.gradient} p-3 shadow-md`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-white drop-shadow">
                  {game.title}
                </h3>
                <p className="text-xs text-white/85">{game.subtitle}</p>
              </div>
              <span className="text-3xl" aria-hidden>{game.emoji}</span>
            </div>
            <div className="mt-8 flex justify-center text-5xl" aria-hidden>
              {game.emoji}
            </div>
            <Button
              type="button"
              onClick={() => setOpenGame(game.id)}
              className="mt-4 h-10 w-full rounded-xl bg-lime-500 font-bold text-slate-900 hover:bg-lime-400"
            >
              Play &amp; Earn
            </Button>
          </article>
        ))}
      </div>

      <Dialog open={openGame !== null} onOpenChange={() => setOpenGame(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>{active?.title ?? "Mini game"}</DialogTitle>
          </DialogHeader>
          {openGame === "spin" ? <LuckySpin onClose={() => setOpenGame(null)} /> : null}
          {openGame === "slot" ? <LuckySlot onClose={() => setOpenGame(null)} /> : null}
          {openGame === "scratch" ? (
            <ScratchCardGame onClose={() => setOpenGame(null)} />
          ) : null}
          {openGame === "flip" ? <FlipCardGame onClose={() => setOpenGame(null)} /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
