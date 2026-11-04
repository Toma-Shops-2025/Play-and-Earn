import { ECONOMY } from "@/lib/economy-config";
import { formatSignedRewardFromCoins } from "@/lib/money";
import { type PortalId, getPortal } from "@/lib/portals";

const SESSION_KEY = "play-earn-portal-session-v1";
const DAY_KEY = "play-earn-portal-day-v1";
export const PORTAL_UPDATED_EVENT = "play-earn-portal-updated";

type PortalSession = {
  portalId: PortalId;
  startedAt: number;
};

type DayRecord = {
  day: string;
  minutes: number;
};

export type PortalSettleResult = {
  ok: boolean;
  portalId: PortalId | null;
  minutesGranted: number;
  coinsGranted: number;
  minutesRemainingToday: number;
  message: string;
};

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function emitUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PORTAL_UPDATED_EVENT));
}

function loadDay(): DayRecord {
  if (typeof window === "undefined") return { day: todayUtc(), minutes: 0 };
  try {
    const raw = localStorage.getItem(DAY_KEY);
    if (!raw) return { day: todayUtc(), minutes: 0 };
    const parsed = JSON.parse(raw) as DayRecord;
    if (parsed.day !== todayUtc()) return { day: todayUtc(), minutes: 0 };
    return { day: parsed.day, minutes: Number(parsed.minutes) || 0 };
  } catch {
    return { day: todayUtc(), minutes: 0 };
  }
}

function saveDay(record: DayRecord) {
  localStorage.setItem(DAY_KEY, JSON.stringify(record));
}

export function getPortalMinutesUsedToday(): number {
  return loadDay().minutes;
}

export function remainingPortalMinutesToday(): number {
  return Math.max(0, ECONOMY.portalPlay.maxMinutesPerDay - getPortalMinutesUsedToday());
}

export function startPortalSession(portalId: PortalId) {
  const session: PortalSession = { portalId, startedAt: Date.now() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function peekPortalSession(): PortalSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PortalSession;
    if (!getPortal(parsed.portalId) || !Number.isFinite(parsed.startedAt)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPortalSession() {
  localStorage.removeItem(SESSION_KEY);
}

function consumeSession(): PortalSession | null {
  const session = peekPortalSession();
  if (!session) return null;
  localStorage.removeItem(SESSION_KEY);
  return session;
}

export function consumePortalMinutes(): {
  portalId: PortalId | null;
  minutesRequested: number;
  reason: "none" | "too_short" | "abandoned" | "ok";
} {
  const session = consumeSession();
  if (!session) {
    return { portalId: null, minutesRequested: 0, reason: "none" };
  }

  const elapsed = Date.now() - session.startedAt;
  if (elapsed > ECONOMY.portalPlay.ignoreSessionsLongerThanMs) {
    return { portalId: session.portalId, minutesRequested: 0, reason: "abandoned" };
  }

  const minutesRaw = Math.floor(elapsed / 60_000);
  if (minutesRaw < ECONOMY.portalPlay.minMinutesToCredit) {
    return { portalId: session.portalId, minutesRequested: 0, reason: "too_short" };
  }

  const minutesRequested = Math.min(minutesRaw, ECONOMY.portalPlay.maxMinutesPerSession);
  return { portalId: session.portalId, minutesRequested, reason: "ok" };
}

/** Apply the local daily cap and return coins for local (unsigned) wallets. */
export function grantLocalPortalPlay(
  portalId: PortalId,
  minutesRequested: number,
): PortalSettleResult {
  const remaining = remainingPortalMinutesToday();
  const minutesGranted = Math.min(
    Math.max(0, Math.floor(minutesRequested)),
    remaining,
    ECONOMY.portalPlay.maxMinutesPerSession,
  );
  const coinsGranted = minutesGranted * ECONOMY.portalPlay.coinsPerMinute;
  const portal = getPortal(portalId);

  if (minutesGranted <= 0) {
    const message =
      remaining <= 0
        ? "Daily arcade-portal cap reached. Watch ads or come back tomorrow."
        : "Play at least 1 minute to earn cash.";
    return {
      ok: false,
      portalId,
      minutesGranted: 0,
      coinsGranted: 0,
      minutesRemainingToday: remaining,
      message,
    };
  }

  const record = loadDay();
  record.minutes += minutesGranted;
  saveDay(record);
  emitUpdated();

  return {
    ok: true,
    portalId,
    minutesGranted,
    coinsGranted,
    minutesRemainingToday: remainingPortalMinutesToday(),
    message: `${formatSignedRewardFromCoins(coinsGranted)} for ${minutesGranted} min in ${portal?.title ?? "arcade"}`,
  };
}

export function noteLocalPortalMinutes(minutesGranted: number) {
  if (minutesGranted <= 0) return;
  const record = loadDay();
  record.minutes += minutesGranted;
  saveDay(record);
  emitUpdated();
}
