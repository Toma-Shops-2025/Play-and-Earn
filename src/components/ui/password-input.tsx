"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "cn";

type PasswordInputProps = Omit<ComponentProps<"input">, "type">;

export function PasswordInput({ className, disabled, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        disabled={disabled}
        className={cn(
          "h-11 w-full rounded-xl border border-white/20 bg-black/30 py-0 pr-11 pl-3 text-sm text-white placeholder:text-white/40",
          className,
        )}
        {...props}
      />
      <button
        type="button"
        disabled={disabled}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-violet-200/80 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-40"
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? (
          <EyeOff className="size-5" aria-hidden />
        ) : (
          <Eye className="size-5" aria-hidden />
        )}
      </button>
    </div>
  );
}