"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const THEMES = [
  { id: "ocean", label: "Ocean", className: "from-sky-400 to-blue-600" },
  { id: "sunset", label: "Sunset", className: "from-orange-400 to-rose-500" },
  { id: "mint", label: "Mint", className: "from-emerald-400 to-teal-600" },
];

const AVATARS = ["🦊", "🐼", "🦁", "🐸", "🦄", "🐙"];

export function CustomView() {
  const [avatar, setAvatar] = useState("🦊");
  const [theme, setTheme] = useState(THEMES[0].id);

  const activeTheme = THEMES.find((t) => t.id === theme) ?? THEMES[0];

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
    </div>
  );
}
