import { LegalDocument } from "@/components/legal/legal-document";
import { APP_CONFIG } from "@/lib/app-config";

export default function DeleteAccountPage() {
  const deleteSubject = encodeURIComponent(`${APP_CONFIG.name} — delete my account`);
  const deleteBody = encodeURIComponent(
    `Please delete my ${APP_CONFIG.name} cloud account and associated data.\n\nAccount email (must match sign-in):\n\nI understand pending payouts may be cancelled and this cannot be undone.\n\nThanks`,
  );

  return (
    <LegalDocument title="Delete your account">
      <p>
        This page explains how to delete your <strong>{APP_CONFIG.name}</strong> account and
        associated data. Package ID: <code>{APP_CONFIG.packageId}</code>. Developer support:{" "}
        <a href={`mailto:${APP_CONFIG.supportEmail}`}>{APP_CONFIG.supportEmail}</a>.
      </p>

      <h2 className="mt-6 text-base font-bold">Delete cloud account (recommended)</h2>
      <p className="mt-2">
        If you signed in with Google or email, your wallet and payout history are stored on our
        backend. To delete that account and server-side data:
      </p>
      <ol className="mt-3 list-decimal space-y-2 pl-5">
        <li>
          Open the app and sign out (Profile / account area), or uninstall after completing the
          steps below.
        </li>
        <li>
          Email{" "}
          <a href={`mailto:${APP_CONFIG.supportEmail}`}>{APP_CONFIG.supportEmail}</a> from the{" "}
          <strong>same email address</strong> tied to your account (Google or email sign-in).
        </li>
        <li>
          Use the subject line <strong>{APP_CONFIG.name} — delete my account</strong> and confirm
          you want permanent deletion.
        </li>
        <li>
          We will verify ownership and delete or anonymize your account within{" "}
          <strong>30 days</strong> (usually sooner). We may email you once to confirm.
        </li>
      </ol>
      <a
        href={`mailto:${APP_CONFIG.supportEmail}?subject=${deleteSubject}&body=${deleteBody}`}
        className="mt-4 block rounded-2xl bg-rose-400/90 px-4 py-3 text-center text-sm font-bold text-slate-950 not-prose hover:bg-rose-300"
      >
        Email request to delete account
      </a>

      <h2 className="mt-8 text-base font-bold">Delete data on your device only</h2>
      <p className="mt-2">
        This removes local progress and preferences on your phone but does{" "}
        <strong>not</strong> delete your cloud account:
      </p>
      <ol className="mt-3 list-decimal space-y-2 pl-5">
        <li>Open {APP_CONFIG.name} → <strong>Profile</strong> (custom tab).</li>
        <li>Tap <strong>Delete all data on device</strong>.</li>
        <li>
          Or: Android <strong>Settings → Apps → {APP_CONFIG.name} → Storage → Clear data</strong>,
          or uninstall the app.
        </li>
      </ol>

      <h2 className="mt-8 text-base font-bold">What we delete</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Account identifier and email (or OAuth link) on our backend</li>
        <li>Wallet balances, reward history, and withdrawal records tied to your account</li>
        <li>Saved PayPal email or Cash App tag for payouts</li>
      </ul>

      <h2 className="mt-6 text-base font-bold">What we may keep</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          Minimal records we must retain for fraud prevention, accounting, or legal compliance
          (for example, aggregated payout logs without personal contact details), for up to{" "}
          <strong>7 years</strong> where required by law
        </li>
        <li>
          Data that ad partners (such as Unity Ads) processed before deletion — see our{" "}
          <a href={`${APP_CONFIG.siteUrl}/privacy/`}>Privacy Policy</a> for ad partners
        </li>
      </ul>

      <h2 className="mt-6 text-base font-bold">Questions</h2>
      <p className="mt-2">
        See <a href={`${APP_CONFIG.siteUrl}/privacy/`}>Privacy Policy</a> or{" "}
        <a href={`${APP_CONFIG.siteUrl}/contact/`}>Contact</a>.
      </p>
    </LegalDocument>
  );
}