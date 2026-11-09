"use client";

import { useEffect, useState } from "react";

type Diag = {
  platform: string;
  native: boolean;
  appId?: string;
  appName?: string;
  build?: string;
};

/** Helps tell installed APK vs Chrome "Add to home screen" (web shows platform: web). */
export function RuntimeDiagnostics() {
  const [diag, setDiag] = useState<Diag | null>(null);

  useEffect(() => {
    void (async () => {
      const { Capacitor } = await import("@capacitor/core");
      const base: Diag = {
        platform: Capacitor.getPlatform(),
        native: Capacitor.isNativePlatform(),
      };
      if (Capacitor.isNativePlatform()) {
        try {
          const { App } = await import("@capacitor/app");
          const info = await App.getInfo();
          base.appId = info.id;
          base.appName = info.name;
          base.build = info.build;
        } catch {
          /* optional */
        }
      }
      setDiag(base);
    })();
  }, []);

  if (!diag) return null;

  const okApk =
    diag.native &&
    diag.platform === "android" &&
    diag.appId === "com.playearn.arcade";

  return (
    <div
      className={`rounded-xl border px-3 py-2 text-[11px] leading-snug ${
        okApk
          ? "border-lime-400/30 bg-lime-400/5 text-lime-100"
          : "border-amber-400/35 bg-amber-500/10 text-amber-100"
      }`}
    >
      <p className="font-semibold">
        {okApk ? "Installed app (real APK)" : "Not the native Android app"}
      </p>
      <p className="mt-1 font-mono text-[10px] opacity-90">
        platform={diag.platform} · native={String(diag.native)}
        {diag.appId ? ` · id=${diag.appId}` : ""}
      </p>
      {!okApk ? (
        <p className="mt-1">
          Unity ads need <strong>com.playearn.arcade</strong> from{" "}
          <code className="text-[10px]">app-debug.apk</code> — not a Chrome shortcut to
          GitHub Pages. In Android Settings → Apps, confirm the package name.
        </p>
      ) : (
        <p className="mt-1">Watch Ad uses Unity LevelPlay (no browser simulate popup).</p>
      )}
    </div>
  );
}
