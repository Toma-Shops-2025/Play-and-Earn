import { LegalDocument } from "@/components/legal/legal-document";
import { APP_CONFIG } from "@/lib/app-config";

export default function TermsPage() {
  return (
    <LegalDocument title="Terms of Use">
      <p>
        By installing or using {APP_CONFIG.name}, you agree to these Terms. If you do not
        agree, do not use the app.
      </p>

      <h2 className="mt-6 text-base font-bold">Virtual entertainment only</h2>
      <p className="mt-2">
        All coins, balances, “cashout” actions, and rewards in the app are{" "}
        <strong>simulated for entertainment</strong>. They have no real-world monetary value.
        You cannot exchange virtual balances for real money, gift cards, or goods through this
        app. References to payment brands in the UI are illustrative only; we are not
        affiliated with those companies.
      </p>

      <h2 className="mt-6 text-base font-bold">Eligibility</h2>
      <p className="mt-2">
        You must be at least {APP_CONFIG.minAge} years old and comply with local laws where
        you live. You are responsible for ensuring your use of the app is lawful in your
        jurisdiction.
      </p>

      <h2 className="mt-6 text-base font-bold">Fair play</h2>
      <p className="mt-2">
        Do not attempt to manipulate balances, reverse engineer the app, or use automated
        tools to farm rewards. We may change game odds, rewards, or features at any time.
      </p>

      <h2 className="mt-6 text-base font-bold">Disclaimer</h2>
      <p className="mt-2">
        The app is provided “as is” without warranties. To the fullest extent permitted by
        law, we are not liable for indirect or consequential damages arising from use of the
        app.
      </p>

      <h2 className="mt-6 text-base font-bold">Changes</h2>
      <p className="mt-2">
        We may update these Terms or the app. Continued use after updates constitutes
        acceptance of the revised Terms.
      </p>

      <h2 className="mt-6 text-base font-bold">Contact</h2>
      <p className="mt-2">
        Support:{" "}
        <a className="text-sky-700 underline" href={`mailto:${APP_CONFIG.supportEmail}`}>
          {APP_CONFIG.supportEmail}
        </a>
      </p>
    </LegalDocument>
  );
}
