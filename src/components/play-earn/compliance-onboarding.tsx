"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/lib/app-config";
import { saveOnboarding } from "@/lib/compliance";

export function ComplianceOnboarding({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  function handleContinue() {
    if (!ageConfirmed || !termsAccepted) return;
    saveOnboarding({
      acceptedTermsAt: new Date().toISOString(),
      confirmedAge: true,
    });
    onComplete();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-4 sm:items-center">
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
        role="dialog"
        aria-labelledby="onboarding-title"
      >
        <h2 id="onboarding-title" className="text-xl font-extrabold text-slate-900">
          Welcome to {APP_CONFIG.name}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          This app uses <strong>virtual coins and simulated cash balances</strong> for
          entertainment only. You cannot withdraw real money, and we are not affiliated
          with PayPal or any payment provider. No purchase is required to play.
        </p>

        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          <li className="rounded-xl bg-sky-50 px-3 py-2">Mini-games award virtual coins stored on your device.</li>
          <li className="rounded-xl bg-sky-50 px-3 py-2">“Cashout” is a demo flow for testing the UI only.</li>
          <li className="rounded-xl bg-amber-50 px-3 py-2 text-amber-950">
            Not gambling: no real-money wagering or prizes of monetary value.
          </li>
        </ul>

        <label className="mt-5 flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-300"
            checked={ageConfirmed}
            onChange={(e) => setAgeConfirmed(e.target.checked)}
          />
          <span>
            I am at least {APP_CONFIG.minAge} years old and allowed to use this app in my
            country.
          </span>
        </label>

        <label className="mt-3 flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-300"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
          />
          <span>
            I agree to the{" "}
            <Link href="/terms/" className="font-semibold text-sky-700 underline">
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link href="/privacy/" className="font-semibold text-sky-700 underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <Button
          type="button"
          className="mt-6 h-12 w-full rounded-2xl text-base font-bold"
          disabled={!ageConfirmed || !termsAccepted}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
