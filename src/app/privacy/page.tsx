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
        <strong>On-device app data:</strong> Virtual coin balance, simulated cash balance,
        mini-game progress, daily reward check-ins, customization choices, and compliance
        acknowledgements are saved in your device storage (for example, browser or WebView
        local storage). This data stays on your device unless you clear app storage or
        uninstall the app.
      </p>
      <p className="mt-2">
        <strong>Diagnostics:</strong> If you email support, we receive the information you
        choose to send (such as your email address and message content).
      </p>

      <h2 className="mt-6 text-base font-bold">Information we do not collect</h2>
      <p className="mt-2">
        The app does not transmit gameplay balances to our servers. We do not use advertising
        SDKs, analytics SDKs, or payment SDKs in this version.
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
