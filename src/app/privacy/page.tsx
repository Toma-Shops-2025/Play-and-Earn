import { LegalDocument } from "@/components/legal/legal-document";
import { APP_CONFIG } from "@/lib/app-config";

export default function PrivacyPage() {
  return (
    <LegalDocument title="Privacy Policy">
      <p>
        {APP_CONFIG.name} (“we”, “our”, “the app”) is a mobile entertainment rewards
        application. This policy explains what information is processed when you use the
        app on Google Play, the web, or related sites.
      </p>

      <h2 className="mt-6 text-base font-bold">Summary</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>We do not sell your personal information.</li>
        <li>An account is required to sync balances and request real payouts.</li>
        <li>We do not collect precise location.</li>
        <li>Ad partners may process advertising identifiers on Android.</li>
      </ul>

      <h2 className="mt-6 text-base font-bold">Information we process</h2>
      <p className="mt-2">
        <strong>Account:</strong> If you sign in (for example with Google), we process your
        email address, display name/avatar if provided by the provider, and authentication
        tokens through our backend provider (Supabase) to secure your wallet and payouts.
      </p>
      <p className="mt-2">
        <strong>Wallet &amp; activity:</strong> Virtual balances, conversion timers, reward
        claims, withdrawal requests, and related ledger events are stored so we can operate
        the rewards program and detect abuse.
      </p>
      <p className="mt-2">
        <strong>Payout destinations:</strong> If you cash out, we process the PayPal email or
        Cash App $Cashtag you provide to send or queue a payout.
      </p>
      <p className="mt-2">
        <strong>Payments:</strong> Optional coin-pack purchases are processed by PayPal under
        PayPal&apos;s privacy policy. We receive purchase metadata needed to credit virtual
        value.
      </p>
      <p className="mt-2">
        <strong>Support:</strong> If you email us, we receive whatever you choose to send.
      </p>
      <p className="mt-2">
        <strong>On-device data:</strong> Some preferences and local progress may be stored on
        your device when you are not signed in.
      </p>

      <h2 className="mt-6 text-base font-bold">Advertising</h2>
      <p className="mt-2">
        The Android app may show rewarded and interstitial ads through Unity LevelPlay / Unity
        Ads and related partners. Those partners may process advertising identifiers and device
        signals according to their policies. We do not receive your payment card data from ad
        views.
      </p>

      <h2 className="mt-6 text-base font-bold">How we use information</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Operate accounts, wallets, and payouts</li>
        <li>Prevent fraud, multi-accounting, and reward abuse</li>
        <li>Provide support and service announcements</li>
        <li>Comply with law and enforce our Terms</li>
      </ul>

      <h2 className="mt-6 text-base font-bold">Sharing</h2>
      <p className="mt-2">
        We share data with service providers who help run the app (for example Supabase,
        PayPal, Cash App processing partners if used, and ad networks). We may disclose
        information if required by law or to protect users and the service.
      </p>

      <h2 className="mt-6 text-base font-bold">Children</h2>
      <p className="mt-2">
        The app is intended for users aged {APP_CONFIG.minAge}+. We do not knowingly collect
        personal information from children under {APP_CONFIG.minAge}.
      </p>

      <h2 className="mt-6 text-base font-bold">Your choices</h2>
      <p className="mt-2">
        You can sign out, delete on-device data from Profile, clear app storage in Android
        Settings, or uninstall. To request deletion of cloud account data, email{" "}
        <a href={`mailto:${APP_CONFIG.supportEmail}`}>{APP_CONFIG.supportEmail}</a> from your
        account email.
      </p>

      <h2 className="mt-6 text-base font-bold">Contact</h2>
      <p className="mt-2">
        Privacy questions:{" "}
        <a href={`mailto:${APP_CONFIG.supportEmail}`}>{APP_CONFIG.supportEmail}</a>
      </p>
    </LegalDocument>
  );
}
