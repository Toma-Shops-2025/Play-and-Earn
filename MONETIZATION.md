# Monetization & profitability

This app makes money from **ads** (Unity LevelPlay) and optional **coin packs** (Stripe web / Play Billing on Android). You lose money if **real cash payouts** or **over-generous free coins** exceed that revenue.

All tunables live in **`src/lib/economy-config.ts`**.

## Default guardrails (already applied)

| Lever | Setting | Why |
|-------|---------|-----|
| Real money payouts | **Off** (`realMoneyPayoutsEnabled: false`) | No PayPal/Connect liability until you prove unit economics |
| Virtual cash conversion | **2,500 coins = $1** virtual | Slows “cash balance” growth vs old 1,000:1 |
| Cashout threshold | **$25 virtual** | Fewer withdrawal requests; more time to monetize with ads |
| Rewarded ads | **10 coins × 25/day** | More impressions; slightly lower coins per view |
| Mini-games | **30 plays/game/day**, max **8** coins/grant | Cuts farming vs unlimited faucet |
| Daily streak | **4…20** coins (7 days) | Login bonus without dominating ad value |

After Supabase migrations, run **`20260322000003_profitable_economy.sql`** so server rules match the client.

## Unit economics (planning)

Rough **rewarded video** revenue (varies by country, fill, season):

```
revenue_per_view ≈ eCPM / 1000
```

Example at **$18 eCPM** → **~$0.018** per completed view.

Virtual value granted per ad (default):

```
10 coins → 10/2500 ≈ $0.004 virtual
```

So **ad revenue per view is ~4× the virtual liability** in planning terms — healthy **as long as you do not pay real dollars 1:1** for virtual balances.

Update `planningRewardedEcpmUsd` monthly from **LevelPlay → Reports**.

## Revenue checklist

1. **Maximize rewarded ads** — “Watch Ad” tab, consider gating daily streak behind an optional ad (future).
2. **Add interstitials** between game sessions (not implemented; high impact — use LevelPlay interstitial ad unit).
3. **Sell coin packs** on Android via **Google Play Billing** (required for in-app digital goods).
4. **Keep Stripe** for web-only packs if you host a web version.
5. **Do not enable real payouts** until:  
   `monthly_ad_revenue + iap_revenue > payouts + store_fees + infra + 30% buffer`

## When to enable real money

Only after:

- 30+ days of LevelPlay data for your GEO mix  
- Legal/tax review for reward apps in target countries  
- Stripe Connect or PayPal Payouts with **manual approval** on `pending` withdrawals  
- Set `realMoneyPayoutsEnabled: true` in `economy-config.ts` and update store copy honestly  

## Red flags (you will lose money)

- Promising PayPal cash while paying more per user than ad ARPU  
- Unlimited game coins without server caps  
- $5 cashout with real money on  
- Buying users with paid ads while eCPM &lt; CPI  

## Tuning

| Goal | Action |
|------|--------|
| More profit | Raise `coinsPerVirtualDollar`, lower `rewardedAd.coinsPerAd`, add interstitials |
| More retention | Slightly raise `coinsPerAd` or daily streak (watch eCPM) |
| Stricter anti-farm | Lower `maxGamePlaysPerDay` in SQL migration + `ECONOMY` |

## Store positioning

List as **free, contains ads**, with **in-app purchases** when packs are live. Virtual currency disclaimers must match behavior (see Terms).
