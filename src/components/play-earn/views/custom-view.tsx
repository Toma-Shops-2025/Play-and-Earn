"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/lib/app-config";
import { clearAllAppData } from "@/lib/compliance";

const THEMES = [
  { id: "ocean", label: "Ocean", className: "from-sky-400 to-blue-600" },
  { id: "sunset", label: "Sunset", className: "from-orange-400 to-rose-500" },
  { id: "mint", label: "Mint", className: "from-emerald-400 to-teal-600" },
];

const AVATARS = ["🦊", "🐼", "🦁", "🐸", "🦄", "🐙"];

export function CustomView() {
  const [avatar, setAvatar] = useState("🦊");
  const [theme, setTheme] = useState(THEMES[0].id);
  const [cleared, setCleared] = useState(false);

  const activeTheme = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  function handleDeleteData() {
    if (
      !window.confirm(
        "Delete all app data on this device? Balances and progress will reset.",
      )
    ) {
      return;
    }
    clearAllAppData();
    setCleared(true);
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      <section
        className={`rounded-3xl bg-gradient-to-br ${activeTheme.className} p-6 text-center text-white shadow-lg`}
      >
        <p className="text-sm font-medium text-white/80">Your profile</p>
        <p className="mt-3 text-6xl">{avatar}</p>
        <p className="mt-2 text-lg font-bold">{activeTheme.label} theme</p>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-slate-800">Avatar</h3>
        <div className="mt-3 grid grid-cols-6 gap-2">
          {AVATARS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setAvatar(item)}
              className={`rounded-xl border py-2 text-2xl ${
                avatar === item ? "border-sky-500 bg-sky-50" : "border-slate-200"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-slate-800">App theme</h3>
        <div className="mt-3 space-y-2">
          {THEMES.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant={theme === item.id ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => setTheme(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-slate-800">Legal &amp; support</h3>
        <div className="mt-3 space-y-2 text-sm">
          <Link
            href="/privacy/"
            className="block rounded-xl border border-slate-200 px-3 py-2 font-medium text-sky-700"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms/"
            className="block rounded-xl border border-slate-200 px-3 py-2 font-medium text-sky-700"
          >
            Terms of Use
          </Link>
          <a
            href={`mailto:${APP_CONFIG.supportEmail}`}
            className="block rounded-xl border border-slate-200 px-3 py-2 font-medium text-slate-700"
          >
            Contact support
          </a>
          <p className="text-xs text-slate-500">
            Version {APP_CONFIG.version} · Package {APP_CONFIG.packageId}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
        <h3 className="font-semibold text-rose-900">Delete app data</h3>
        <p className="mt-1 text-xs text-rose-800/90">
          Removes virtual balances, rewards progress, and compliance choices from this
          device (Google Play data deletion expectation).
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full border-rose-300 text-rose-900 hover:bg-rose-100"
          onClick={handleDeleteData}
        >
          {cleared ? "Reloading…" : "Delete all data on device"}
        </Button>
      </section>
    </div>
  );
}
