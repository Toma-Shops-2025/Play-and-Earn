const ONBOARDING_KEY = "play-earn-onboarding-v2";

export type OnboardingRecord = {
  acceptedTermsAt: string;
  confirmedAge: boolean;
  seenRulesAt: string;
};

export function getOnboarding(): OnboardingRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnboardingRecord;
    if (!parsed.acceptedTermsAt || !parsed.confirmedAge || !parsed.seenRulesAt) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveOnboarding(record: OnboardingRecord) {
  localStorage.setItem(ONBOARDING_KEY, JSON.stringify(record));
}

export function clearAllAppData() {
  const keys = Object.keys(localStorage).filter((key) =>
    key.startsWith("play-earn-"),
  );
  keys.forEach((key) => localStorage.removeItem(key));
}
