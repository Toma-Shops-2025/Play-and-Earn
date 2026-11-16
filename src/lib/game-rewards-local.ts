import type { GameId } from "@/lib/games";
import { ECONOMY } from "@/lib/economy-config";

const STORAGE_KEY = "play-earn-game-plays-v1";

type DayRecord = {
  day: string;
  counts: Partial<Record<GameId, number>>;
};

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function load(): DayRecord {
  if (typeof window === "undefined") {
    return { day: todayUtc(), counts: {} };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { day: todayUtc(), counts: {} };
    const parsed = JSON.parse(raw) as DayRecord;
    if (parsed.day !== todayUtc()) return { day: todayUtc(), counts: {} };
    return {
      day: parsed.day,
      counts: parsed.counts ?? {},
    };
  } catch {
    return { day: todayUtc(), counts: {} };
  }
}

function save(record: DayRecord) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

export function getGamePlaysToday(gameId: GameId): number {
  const record = load();
  return record.counts[gameId] ?? 0;
}

export function getGamePlaysRemaining(gameId: GameId): number {
  return Math.max(0, ECONOMY.maxGamePlaysPerDay - getGamePlaysToday(gameId));
}

export function recordGamePlay(gameId: GameId) {
  const record = load();
  const next = (record.counts[gameId] ?? 0) + 1;
  record.counts[gameId] = next;
  save(record);
}

export function assertCanPlayGame(gameId: GameId): void {
  if (getGamePlaysRemaining(gameId) <= 0) {
    throw new Error(
      `Daily limit reached for this game (${ECONOMY.maxGamePlaysPerDay} plays per UTC day). Come back tomorrow.`,
    );
  }
}