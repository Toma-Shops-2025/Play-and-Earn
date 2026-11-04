import { LegalDocument } from "@/components/legal/legal-document";
import { APP_CONFIG } from "@/lib/app-config";

export default function ContactPage() {
  const subject = encodeURIComponent(`${APP_CONFIG.name} support`);
  const body = encodeURIComponent(
    `Hi ${APP_CONFIG.name} team,\n\nUID / account email:\nIssue:\n\nThanks`,
  );

  return (
    <LegalDocument title="Contact us">
      <p>
        We’re here for account, payout, and privacy questions. Replace{" "}
        <code>{APP_CONFIG.supportEmail}</code> in app config with your real support inbox
        before publishing.
      </p>

      <div className="mt-6 space-y-3 not-prose">
        <a
          href={`mailto:${APP_CONFIG.supportEmail}?subject=${subject}&body=${body}`}
          className="block rounded-2xl bg-lime-400 px-4 py-3 text-center text-sm font-bold text-slate-950"
        >
          Email {APP_CONFIG.supportEmail}
        </a>
        <p className="text-center text-xs text-violet-200/70">
          Include your account email and a short description. Do not send passwords.
        </p>
      </div>

      <h2 className="mt-8 text-base font-bold">Before you write</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Check the FAQ for cashout timing and the $25 ready-balance cap.</li>
        <li>Confirm your PayPal email or Cash App $Cashtag is saved correctly.</li>
        <li>For Play Store listing issues, use the same support email in Play Console.</li>
      </ul>
    </LegalDocument>
  );
}
