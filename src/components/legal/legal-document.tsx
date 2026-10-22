import Link from "next/link";
import { APP_CONFIG } from "@/lib/app-config";

export function LegalDocument({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-sm">
        <Link href="/" className="text-sm font-medium text-sky-700 hover:underline">
          ← Back to app
        </Link>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900">{title}</h1>
        <p className="mt-1 text-xs text-slate-500">
          Last updated: October 22, 2026 · {APP_CONFIG.name}
        </p>
        <div className="prose prose-slate mt-6 max-w-none text-sm leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}
