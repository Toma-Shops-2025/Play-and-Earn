"use client";

import { useEffect, useRef } from "react";
import { useWallet } from "@/context/wallet-provider";
import {
  consumePortalMinutes,
  peekPortalSession,
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
        const consumed = consumePortalMinutes();
        if (consumed.reason === "none" || !consumed.portalId) return;
        if (consumed.reason === "abandoned") return;
        if (consumed.reason === "too_short") {
          flashEarnNotice("Play at least 1 minute in the arcade to earn cash.");
          return;
        }
        const portal = getPortal(consumed.portalId);
        if (!portal) return;
        await grantPortalPlay(consumed.portalId, consumed.minutesRequested);
      } finally {
        busy.current = false;
      }
    }

    let removeNative: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (cancelled) return;
      if (Capacitor.isNativePlatform()) {
        const { Browser } = await import("@capacitor/browser");
        const handle = await Browser.addListener("browserFinished", () => {
          void settle(true);
        });
        removeNative = () => {
          void handle.remove();
        };
        return;
      }

      const onVisible = () => {
        if (document.visibilityState === "visible") void settle(false);
      };
      document.addEventListener("visibilitychange", onVisible);
      window.addEventListener("focus", onVisible);
      removeNative = () => {
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
