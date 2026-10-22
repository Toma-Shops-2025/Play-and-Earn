export type GameId = "spin" | "slot" | "scratch" | "flip";

export type GameConfig = {
  id: GameId;
  title: string;
  subtitle: string;
  gradient: string;
  accent: string;
  emoji: string;
};

export const GAMES: GameConfig[] = [
  {
    id: "spin",
    title: "Lucky Spin",
    subtitle: "Spin the wheel for coins",
    gradient: "from-sky-300 via-sky-400 to-blue-500",
    accent: "bg-sky-500",
    emoji: "🎡",
  },
  {
    id: "slot",
    title: "Lucky Slot",
    subtitle: "Match symbols to win",
    gradient: "from-violet-300 via-purple-400 to-fuchsia-500",
    accent: "bg-violet-500",
    emoji: "🎰",
  },
  {
    id: "scratch",
    title: "Scratch Card",
    subtitle: "Reveal hidden prizes",
    gradient: "from-pink-300 via-rose-400 to-pink-500",
    accent: "bg-pink-500",
    emoji: "🎫",
  },
  {
    id: "flip",
    title: "Flip Card",
    subtitle: "Pick a lucky card",
    gradient: "from-amber-300 via-orange-400 to-orange-500",
    accent: "bg-orange-500",
    emoji: "🃏",
  },
];
