"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/lib/app-config";
import { saveOnboarding } from "@/lib/compliance";

const RULE_STEPS = [
  {
    title: "Earn real cashable balances",
    body: "Watch ads, claim daily rewards, and play games. Everything shows as money — no points.",
  },
  {
    title: "Every 3 hours",
    body: "Pending earnings convert to a ready balance on a 3-hour timer. Save PayPal or Cash App for auto payouts.",
  },
  {
    title: "Cashout rules",
    body: `First cashout needs $${APP_CONFIG.firstCashoutMinVirtualDollars}. After that, any amount. Ready balance caps at $${APP_CONFIG.maxCashBalanceVirtualDollars} until you withdraw.`,
  },
  {
    title: `Play fair · ${APP_CONFIG.minAge}+`,
    body: "One account per person. Not gambling — no wagering. Abuse can void rewards.",
  },
];

export function ComplianceOnboarding({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [step, setStep] = useState(0);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [rulesAck, setRulesAck] = useState(false);

  const onRules = step < RULE_STEPS.length;
  const rule = RULE_STEPS[step];

  function finish() {
    if (!ageConfirmed || !termsAccepted || !rulesAck) return;
    const now = new Date().toISOString();
    saveOnboarding({
      acceptedTermsAt: now,
      confirmedAge: true,
      seenRulesAt: now,
    });
    onComplete();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-4 sm:items-center">
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl border border-fuchsia-400/30 bg-[#120a24] p-6 text-white shadow-[0_0_50px_rgba(217,70,239,0.35)]"
        role="dialog"
        aria-labelledby="onboarding-title"
      >
        {onRules && rule ? (
          <>
            <p className="text-[11px] font-bold uppercase tracking-wide text-cyan-300/80">
              Quick start · {step + 1} / {RULE_STEPS.length}
            </p>
            <h2 id="onboarding-title" className="mt-2 text-xl font-extrabold text-lime-300">
              {rule.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-violet-100/90">{rule.body}</p>
            <div className="mt-5 flex gap-1">
              {RULE_STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${
                    i <= step ? "bg-lime-400" : "bg-white/15"
                  }`}
                />
              ))}
            </div>
            <Button
              type="button"
              className="mt-6 h-12 w-full rounded-2xl text-base font-bold"
              onClick={() => setStep((s) => s + 1)}
            >
              {step === RULE_STEPS.length - 1 ? "Continue to legal" : "Next"}
            </Button>
            <p className="mt-3 text-center text-[11px] text-violet-200/55">
              Full details anytime in{" "}
              <Link href="/rules/" className="text-cyan-300 underline">
                Rules
              </Link>
              .
            </p>
          </>
        ) : (
          <>
            <h2 id="onboarding-title" className="text-xl font-extrabold text-lime-300">
              Almost ready
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-violet-100/85">
              Confirm a few legal items required for rewards apps like {APP_CONFIG.name}.
            </p>

            <label className="mt-5 flex items-start gap-3 text-sm text-violet-100">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-violet-400"
                checked={rulesAck}
                onChange={(e) => setRulesAck(e.target.checked)}
              />
              <span>I understand the earning, 3-hour, first-cashout, and $25 cap rules.</span>
            </label>

            <label className="mt-3 flex items-start gap-3 text-sm text-violet-100">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-violet-400"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
              />
              <span>
                I am at least {APP_CONFIG.minAge} years old and allowed to use this app in my
                country.
              </span>
            </label>

            <label className="mt-3 flex items-start gap-3 text-sm text-violet-100">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-violet-400"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              <span>
                I agree to the{" "}
                <Link href="/terms/" className="font-semibold text-cyan-300 underline">
                  Terms of Use
                </Link>{" "}
                and{" "}
                <Link href="/privacy/" className="font-semibold text-cyan-300 underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
              <Link href="/faq/" className="text-cyan-300 underline">
                FAQ
              </Link>
              <Link href="/contact/" className="text-cyan-300 underline">
                Contact
              </Link>
            </div>

            <Button
              type="button"
              className="mt-6 h-12 w-full rounded-2xl text-base font-bold"
              disabled={!ageConfirmed || !termsAccepted || !rulesAck}
              onClick={finish}
            >
              Enter {APP_CONFIG.name}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
