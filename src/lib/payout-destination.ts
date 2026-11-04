export type PayoutMethod = "paypal" | "cashapp";

export type PayoutDestination = {
  method: PayoutMethod;
  destination: string;
};

const STORAGE_KEY = "play-earn-payout-destination-v1";

export function loadPayoutDestination(): PayoutDestination | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PayoutDestination;
    if (
      (parsed.method !== "paypal" && parsed.method !== "cashapp") ||
      !parsed.destination?.trim()
    ) {
      return null;
    }
    return {
      method: parsed.method,
      destination: parsed.destination.trim(),
    };
  } catch {
    return null;
  }
}

export function savePayoutDestination(value: PayoutDestination) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      method: value.method,
      destination: value.destination.trim(),
    }),
  );
}

export function clearPayoutDestination() {
  localStorage.removeItem(STORAGE_KEY);
}

export function normalizeCashAppTag(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("$") ? trimmed : `$${trimmed}`;
}

export function validatePayoutDestination(
  method: PayoutMethod,
  destination: string,
): { ok: true; destination: string } | { ok: false; message: string } {
  const raw = destination.trim();
  if (!raw) {
    return {
      ok: false,
      message:
        method === "paypal"
          ? "Enter your PayPal email."
          : "Enter your Cash App $Cashtag.",
    };
  }
  if (method === "paypal") {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(raw)) {
      return { ok: false, message: "Enter a valid PayPal email." };
    }
    return { ok: true, destination: raw.toLowerCase() };
  }
  const tag = normalizeCashAppTag(raw);
  if (!/^\$[A-Za-z][A-Za-z0-9_]{2,20}$/.test(tag)) {
    return {
      ok: false,
      message: "Cash App tags look like $YourName (letters/numbers).",
    };
  }
  return { ok: true, destination: tag };
}
