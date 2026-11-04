import Link from "next/link";

const LINKS = [
  { href: "/rules/", label: "Rules" },
  { href: "/faq/", label: "FAQ" },
  { href: "/privacy/", label: "Privacy" },
  { href: "/terms/", label: "Terms" },
  { href: "/contact/", label: "Contact" },
] as const;

export function LegalNav({ className = "" }: { className?: string }) {
  return (
    <nav
      aria-label="Legal"
      className={`flex flex-wrap gap-2 ${className}`}
    >
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/20"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
