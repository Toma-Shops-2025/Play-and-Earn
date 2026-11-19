"use client";

import { useEffect, useRef } from "react";
import { useWallet } from "@/context/wallet-provider";
import {
  clearPortalSession,
  peekPortalSession,
  previewPortalMinutes,
} from "@/lib/portal-session";
import { getPortal } from "@/lib/portals";

const WEB_SETTLE_GRACE_MS = 60_000;

export function PortalPlayListener() {
  const { grantPortalPlay, flashEarnNotice } = useWallet();
  const busy = useRef(false);

  useEffect(() => {
    async function settle(force: boolean) {
      if (busy.current) return;
      const session = peekPortalSession();
      if (!session) return;
      if (!force && Date.now() - session.startedAt < WEB_SETTLE_GRACE_MS) return;

      busy.current = true;
      try {
        const preview = previewPortalMinutes();
        if (preview.reason === "none" || !preview.portalId) return;

        if (preview.reason === "abandoned") {
          clearPortalSession();
          return;
        }
        if (preview.reason === "too_short") {
          flashEarnNotice("Play at least 1 minute in the arcade to earn cash.");
          clearPortalSession();
          return;
        }

        const portal = getPortal(preview.portalId);
        if (!portal) {
          clearPortalSession();
          return;
        }

        const result = await grantPortalPlay(
          preview.portalId,
          preview.minutesRequested,
        );
        if (result.ok && result.coinsGranted > 0) {
          clearPortalSession();
          return;
        }
        if (
          !result.ok &&
          (result.message?.toLowerCase().includes("cap reached") ||
            result.message?.includes("migration"))
        ) {
          clearPortalSession();
        }
        if (
          !result.ok &&
          result.message &&
          !result.message.includes("migration")
        ) {
          flashEarnNotice(result.message);
        }
      } finally {
        busy.current = false;
      }
    }

    let removeNative: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (cancelled) return;

      const { App } = await import("@capacitor/app");
      const resumeHandle = await App.addListener("resume", () => {
        void settle(true);
      });

      if (Capacitor.isNativePlatform()) {
        const { Browser } = await import("@capacitor/browser");
        const browserHandle = await Browser.addListener("browserFinished", () => {
          void settle(true);
        });
        removeNative = () => {
          void resumeHandle.remove();
          void browserHandle.remove();
        };
        return;
      }

      const onVisible = () => {
        if (document.visibilityState === "visible") void settle(false);
      };
      document.addEventListener("visibilitychange", onVisible);
      window.addEventListener("focus", onVisible);
      removeNative = () => {
        void resumeHandle.remove();
        document.removeEventListener("visibilitychange", onVisible);
        window.removeEventListener("focus", onVisible);
      };
    })();

    return () => {
      cancelled = true;
      removeNative?.();
    };
  }, [grantPortalPlay, flashEarnNotice]);

  return null;
}