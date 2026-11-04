import { LegalDocument } from "@/components/legal/legal-document";
import { APP_CONFIG } from "@/lib/app-config";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Is this gambling?",
    a: "No. You do not wager money to win money. You earn promotional rewards from ads and gameplay.",
  },
  {
    q: "How do cashouts work?",
    a: `Earnings move to a ready balance every 3 hours. First cashout needs $${APP_CONFIG.firstCashoutMinVirtualDollars}. After that you can cash out any ready amount to PayPal or Cash App (when configured).`,
  },
  {
    q: "Why did my balance stop growing?",
    a: `Ready balance caps at $${APP_CONFIG.maxCashBalanceVirtualDollars}. Cash out to unlock more conversions from pending earnings.`,
  },
  {
    q: "Do I need an account?",
    a: "Yes for synced balances and real payouts. Sign in with Google (recommended). Without an account, progress stays on the device only.",
  },
  {
    q: "When will I receive my payout?",
    a: "PayPal can auto-send when payout automation is enabled. Cash App requests are queued for processing. Times vary and requests may be reviewed for fraud.",
  },
  {
    q: "Who can use the app?",
    a: `Users aged ${APP_CONFIG.minAge}+ where the app is lawful. You must accept the Terms and Privacy Policy.`,
  },
  {
    q: "How do I delete my data?",
    a: `Clear on-device data in Profile, or email ${APP_CONFIG.supportEmail} from your account email to request cloud deletion.`,
  },
];

export default function FaqPage() {
  return (
    <LegalDocument title="FAQ">
      <p>
        Quick answers about {APP_CONFIG.name}. For anything else, visit{" "}
        <a href="/contact/">Contact</a>.
      </p>
      <div className="mt-6 space-y-4">
        {FAQS.map((item) => (
          <section
            key={item.q}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <h2 className="text-base font-bold text-lime-300">{item.q}</h2>
            <p className="mt-2 text-sm text-violet-100/90">{item.a}</p>
          </section>
        ))}
      </div>
    </LegalDocument>
  );
}
