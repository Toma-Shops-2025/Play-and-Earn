import { GameGrid } from "@/components/play-earn/game-grid";
import { GamePortals } from "@/components/play-earn/game-portals";
import { APP_CONFIG } from "@/lib/app-config";
import { ECONOMY } from "@/lib/economy-config";
import { formatSignedRewardFromCoins } from "@/lib/format";

export function GamesView() {
  return (
    <div className="space-y-3">
      <header>
        <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-lime-300">
          {APP_CONFIG.name}
        </h2>
        <p className="text-sm text-violet-200/75">
          Arcade portals pay {formatSignedRewardFromCoins(ECONOMY.portalPlay.coinsPerMinute)}{" "}
          per minute. Mini-games add extra cash. Everything cashes out on the 3-hour timer.
        </p>
      </header>
      <GamePortals />
      <h3 className="pt-1 text-sm font-extrabold text-fuchsia-200">Mini-games</h3>
      <GameGrid />
    </div>
  );
}
