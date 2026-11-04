import Link from "next/link";
import { APP_CONFIG } from "@/lib/app-config";

export function SiteLegalFooter() {
  return (
    <footer className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-3 py-4 text-center">
      <p className="text-[11px] leading-relaxed text-violet-200/70">
        {APP_CONFIG.name} is an entertainment rewards app for users{" "}
        {APP_CONFIG.minAge}+. Not gambling. Rewards and payouts are subject to
        our Terms.
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-semibold">
        <Link href="/rules/" className="text-cyan-300 hover:underline">
          Rules
        </Link>
        <Link href="/faq/" className="text-cyan-300 hover:underline">
          FAQ
        </Link>
        <Link href="/privacy/" className="text-cyan-300 hover:underline">
          Privacy
        </Link>
        <Link href="/terms/" className="text-cyan-300 hover:underline">
          Terms
        </Link>
        <Link href="/contact/" className="text-cyan-300 hover:underline">
          Contact
        </Link>
      </div>
      <p className="mt-2 text-[10px] text-violet-200/45">
        v{APP_CONFIG.version}
      </p>
    </footer>
  );
}
