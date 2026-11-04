import { LegalDocument } from "@/components/legal/legal-document";
import { APP_CONFIG } from "@/lib/app-config";

export default function TermsPage() {
  return (
    <LegalDocument title="Terms of Use">
      <p>
        By installing or using {APP_CONFIG.name}, you agree to these Terms. If you do not
        agree, do not use the app.
      </p>

      <h2 className="mt-6 text-base font-bold">What the app is</h2>
      <p className="mt-2">
        {APP_CONFIG.name} is an entertainment rewards program. You can play mini-games, watch
        rewarded ads, and earn promotional balances that may be withdrawn to supported payout
        methods when eligibility rules are met. This is <strong>not gambling</strong>: you do
        not wager money for a chance to win more money.
      </p>

      <h2 className="mt-6 text-base font-bold">Eligibility</h2>
      <p className="mt-2">
        You must be at least {APP_CONFIG.minAge} years old and use the app only where it is
        lawful. You are responsible for complying with local laws, tax rules, and platform
        policies (including Google Play).
      </p>

      <h2 className="mt-6 text-base font-bold">Accounts</h2>
      <p className="mt-2">
        Cloud sign-in is required to sync balances and request payouts. One person may maintain
        only one account. We may suspend accounts that appear abusive, fraudulent, or automated.
      </p>

      <h2 className="mt-6 text-base font-bold">Rewards &amp; payouts</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          Earnings convert to a ready balance on a timer (currently every{" "}
          {APP_CONFIG.realMoneyPayoutsEnabled ? "3 hours" : "configured interval"}).
        </li>
        <li>
          First cashout requires at least ${APP_CONFIG.firstCashoutMinVirtualDollars}. After
          that, you may cash out any ready amount unless we change the rules.
        </li>
        <li>
          Ready balance caps at ${APP_CONFIG.maxCashBalanceVirtualDollars} until you cash out.
        </li>
        <li>
          Payouts may be sent or queued to PayPal or Cash App. Processing times vary. Cash App
          may require manual fulfillment.
        </li>
        <li>
          Rewards are promotional and discretionary. Rates, caps, timers, and availability may
          change at any time.
        </li>
        <li>
          You are responsible for any taxes arising from rewards you receive.
        </li>
      </ul>

      <h2 className="mt-6 text-base font-bold">Fair play</h2>
      <p className="mt-2">
        Do not manipulate ads or games, use bots, emulators for abuse, VPN fraud, multiple
        accounts, or reverse engineer the app. Violations may forfeit balances and lead to
        permanent bans without payout.
      </p>

      <h2 className="mt-6 text-base font-bold">Purchases</h2>
      <p className="mt-2">
        Optional in-app or web purchases (if offered) are subject to the payment provider’s
        terms. Virtual value from purchases is non-refundable except where required by law or
        store policy.
      </p>

      <h2 className="mt-6 text-base font-bold">Disclaimer</h2>
      <p className="mt-2">
        The app is provided “as is” without warranties. To the fullest extent permitted by law,
        we are not liable for indirect, incidental, or consequential damages, lost rewards, or
        payout delays caused by third-party processors, networks, or abuse prevention.
      </p>

      <h2 className="mt-6 text-base font-bold">Changes</h2>
      <p className="mt-2">
        We may update these Terms or the app. Continued use after updates constitutes
        acceptance of the revised Terms.
      </p>

      <h2 className="mt-6 text-base font-bold">Contact</h2>
      <p className="mt-2">
        Support:{" "}
        <a href={`mailto:${APP_CONFIG.supportEmail}`}>{APP_CONFIG.supportEmail}</a>
      </p>
    </LegalDocument>
  );
}
