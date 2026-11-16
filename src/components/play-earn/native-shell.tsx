"use client";

import { useEffect } from "react";
import { preloadRewardedAds } from "@/lib/rewarded-ads";

/** Applies Android status bar styling when running inside Capacitor. */
export function NativeShell() {
  useEffect(() => {
    void preloadRewardedAds();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: "#38bdf8" });
      } catch {
        // Web dev — Capacitor plugins not loaded
      }
    })();
  }, []);

  return null;
}
