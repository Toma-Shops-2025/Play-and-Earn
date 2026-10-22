/** Replace with your Play Console support contact before publishing. */
import { ECONOMY } from "@/lib/economy-config";

export const APP_CONFIG = {
  name: "Play & Earn Arcade",
  packageId: "com.playearn.arcade",
  supportEmail: "support@example.com",
  privacyPolicyUrl: "https://example.com/play-earn-arcade/privacy",
  termsUrl: "https://example.com/play-earn-arcade/terms",
  minAge: 18,
  version: "1.0.0",
  /** Keep false until ad ARPU + IAP cover real payouts in your region. */
  realMoneyPayoutsEnabled: ECONOMY.realMoneyPayoutsEnabled,
  minCashoutVirtualDollars: ECONOMY.minCashoutVirtualDollars,
} as const;
