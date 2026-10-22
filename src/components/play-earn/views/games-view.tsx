import { GameGrid } from "@/components/play-earn/game-grid";

export function GamesView() {
  return (
    <div className="space-y-3">
      <header>
        <h2 className="text-xl font-extrabold text-slate-900">Play &amp; earn</h2>
        <p className="text-sm text-slate-600">
          Mini-games add coins to your balance. Coins convert to cash on the timer.
        </p>
      </header>
      <GameGrid />
    </div>
  );
}
