import { LegalDocument } from "@/components/legal/legal-document";
import { APP_CONFIG } from "@/lib/app-config";

export default function RulesPage() {
  return (
    <LegalDocument title="How it works">
      <p>
        Short rules for earning and cashing out in {APP_CONFIG.name}. Full legal terms live on
        the Terms page.
      </p>

      <ol className="mt-6 list-decimal space-y-4 pl-5">
        <li>
          <strong>Earn.</strong> Watch rewarded ads, claim daily bonuses, play mini-games, and
          visit arcade portals. Progress shows as money (not points).
        </li>
        <li>
          <strong>Wait for the 3-hour window.</strong> Pending earnings convert to a ready
          balance every 3 hours.
        </li>
        <li>
          <strong>First cashout ${APP_CONFIG.firstCashoutMinVirtualDollars}.</strong> After your
          first successful cashout request, you can withdraw any ready amount.
        </li>
        <li>
          <strong>${APP_CONFIG.maxCashBalanceVirtualDollars} ready cap.</strong> Ready balance
          stops growing past ${APP_CONFIG.maxCashBalanceVirtualDollars} until you cash out.
          Pending earnings wait until there is room.
        </li>
        <li>
          <strong>PayPal or Cash App.</strong> Save a destination in Payouts. When the timer
          hits (and minimums are met), payouts can auto-queue.
        </li>
        <li>
          <strong>Play fair.</strong> One account per person. No bots, ad fraud, or multi-accounting.
          Abuse can void rewards.
        </li>
        <li>
          <strong>Age {APP_CONFIG.minAge}+.</strong> Not gambling — entertainment rewards only.
        </li>
      </ol>
    </LegalDocument>
  );
}
