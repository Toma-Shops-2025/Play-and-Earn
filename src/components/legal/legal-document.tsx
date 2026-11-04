import Link from "next/link";
import { APP_CONFIG } from "@/lib/app-config";
import { LegalNav } from "@/components/legal/legal-nav";

export function LegalDocument({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-[#070714] px-4 py-8 text-violet-50">
      <div className="mx-auto max-w-2xl rounded-3xl border border-fuchsia-400/25 bg-[#120a24] p-6 shadow-[0_0_40px_rgba(217,70,239,0.2)]">
        <Link
          href="/"
          className="text-sm font-medium text-cyan-300 hover:underline"
        >
          ← Back to app
        </Link>
        <h1 className="mt-4 text-2xl font-extrabold text-lime-300">{title}</h1>
        <p className="mt-1 text-xs text-violet-200/60">
          Last updated: November 2, 2026 · {APP_CONFIG.name}
        </p>
        <LegalNav className="mt-4" />
        <div className="prose prose-invert mt-6 max-w-none text-sm leading-relaxed prose-headings:text-cyan-100 prose-a:text-cyan-300 prose-strong:text-white">
          {children}
        </div>
        <LegalNav className="mt-8 border-t border-white/10 pt-4" />
        <p className="mt-4 text-center text-[11px] text-violet-200/50">
          Questions?{" "}
          <a
            className="text-cyan-300 underline"
            href={`mailto:${APP_CONFIG.supportEmail}`}
          >
            {APP_CONFIG.supportEmail}
          </a>
        </p>
      </div>
    </div>
  );
}
