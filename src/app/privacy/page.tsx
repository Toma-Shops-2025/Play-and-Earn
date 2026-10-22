import { LegalDocument } from "@/components/legal/legal-document";
import { APP_CONFIG } from "@/lib/app-config";

export default function PrivacyPage() {
  return (
    <LegalDocument title="Privacy Policy">
      <p>
        {APP_CONFIG.name} (“we”, “our”, “the app”) is an entertainment application with
        virtual rewards. This policy explains what information is processed when you use
        the Android app distributed on Google Play.
      </p>

      <h2 className="mt-6 text-base font-bold">Summary</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>We do not sell your personal information.</li>
        <li>Gameplay progress is stored locally on your device by default.</li>
        <li>We do not require an account, email, or phone number to play.</li>
        <li>We do not collect precise location.</li>
      </ul>

      <h2 className="mt-6 text-base font-bold">Information we process</h2>
      <p className="mt-2">
        <strong>Account (optional):</strong> If you create an account, we process your email
        address and authentication tokens through our database provider (Supabase) to sync
        your virtual balances and purchase history.
      </p>
      <p className="mt-2">
        <strong>On-device app data:</strong> When you are not signed in, virtual balances and
        progress may be stored only on your device. Signed-in users also store gameplay state
        in the cloud.
      </p>
      <p className="mt-2">
        <strong>Payments:</strong> If you buy coin packs, PayPal processes payment according to
        PayPal&apos;s privacy policy. We receive purchase metadata (pack size, amount, user id)
        to credit virtual coins.
      </p>
      <p className="mt-2">
        <strong>Support:</strong> If you email support, we receive what you choose to send.
      </p>

      <h2 className="mt-6 text-base font-bold">Advertising</h2>
      <p className="mt-2">
        The Android app may show rewarded video ads through Unity LevelPlay. Ad partners may
        process advertising identifiers according to their policies. We do not receive your
        payment card data from ad views.
      </p>

      <h2 className="mt-6 text-base font-bold">Information we do not collect</h2>
      <p className="mt-2">
        Without a cloud account, gameplay balances are not transmitted to our servers. We do
        not use third-party analytics SDKs in this project.
      </p>

      <h2 className="mt-6 text-base font-bold">Children</h2>
      <p className="mt-2">
        The app is intended for users aged {APP_CONFIG.minAge}+. We do not knowingly collect
        personal information from children under {APP_CONFIG.minAge}.
      </p>

      <h2 className="mt-6 text-base font-bold">Your choices</h2>
      <p className="mt-2">
        You can delete on-device data at any time from the Custom tab → “Delete app data”, or
        by clearing storage for the app in Android Settings, or by uninstalling the app.
      </p>

      <h2 className="mt-6 text-base font-bold">Contact</h2>
      <p className="mt-2">
        Questions about this policy:{" "}
        <a className="text-sky-700 underline" href={`mailto:${APP_CONFIG.supportEmail}`}>
          {APP_CONFIG.supportEmail}
        </a>
      </p>
    </LegalDocument>
  );
}
