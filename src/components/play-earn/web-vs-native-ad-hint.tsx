"use client";

import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";

/** Shown on GitHub Pages / mobile browser — real Unity ads run only in the installed APK. */
export function WebVsNativeAdHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    void import("@capacitor/core").then(({ Capacitor }) => {
      setShow(!Capacitor.isNativePlatform());
    });
  }, []);

  if (!show) return null;

  return (
    <p className="flex items-start gap-2 rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-xs leading-snug text-amber-100">
      <Smartphone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>
        You&apos;re in the <strong>mobile browser</strong> (address bar visible). Unity ads only
        run in the <strong>installed Play N&apos; Earn app</strong> — open the app icon, not Chrome.
      </span>
    </p>
  );
}
