/** Replace supportEmail with your Play Console contact before publishing. */
import { ECONOMY } from "@/lib/economy-config";
import { SITE_URL } from "@/lib/site-url";

export const APP_CONFIG = {
  /** Shown on device home screen, onboarding, PayPal, and store listing. */
  name: "Play N' Earn",
  packageId: "com.playearn.arcade",
  supportEmail: "support@example.com",
  privacyPolicyUrl: `${SITE_URL}/privacy/`,
  termsUrl: `${SITE_URL}/terms/`,
  faqUrl: `${SITE_URL}/faq/`,
  contactUrl: `${SITE_URL}/contact/`,
  rulesUrl: `${SITE_URL}/rules/`,
  siteUrl: SITE_URL,
  githubRepoUrl: "https://github.com/Toma-Shops-2025/Play-and-Earn",
  minAge: 18,
  version: "1.0.0",
  /** Keep false until ad ARPU + IAP cover real payouts in your region. */
  realMoneyPayoutsEnabled: ECONOMY.realMoneyPayoutsEnabled,
  minCashoutVirtualDollars: ECONOMY.minCashoutVirtualDollars,
  firstCashoutMinVirtualDollars: ECONOMY.firstCashoutMinVirtualDollars,
  maxCashBalanceVirtualDollars: ECONOMY.maxCashBalanceVirtualDollars,
} as const;
