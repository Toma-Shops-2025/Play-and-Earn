# Rewards, payouts, and keeping the house profitable

This doc answers: **PayPal vs gift cards**, **coins vs dollars in the UI**, and **how much to pay users** so ad revenue stays ahead of withdrawals.

Tunables live in **`src/lib/economy-config.ts`**. Planning math is in **`MONETIZATION.md`**.

---

## Coins vs showing dollars (recommendation)

**Keep coins internally; show dollars where it helps UX.**

| Approach | Pros | Cons |
|----------|------|------|
| **Coins only** | Easy to tune conversion rate without rewriting copy | Users compare poorly to “$0.03” reference apps |
| **Dollars only in UI** | Feels like the reference app | Hard to rebalance economy; users feel cheated if rate changes |
| **Coins + “≈ $X.XX” labels** (recommended) | Flexible backend; familiar UI | Slightly more UI work |

**How this app works today**

1. Users earn **coins** (games, ads, daily streak) — UI shows **money only**.
2. Every **3 hours**, coins convert to **ready balance** using `coinsPerVirtualDollar` (default **2,500 coins = $1.00**), capped at **`$25`** until they cash out.
3. **First cashout** needs **`$5`**; after that, **any amount**. With a saved PayPal / Cash App destination, conversion can auto-queue a payout.

The **3-hour timer** moves earnings to ready balance; **real PayPal** (when automation is on) sends when a withdrawal is queued.

---

## Payout methods (recommendation)

### PayPal (primary — already built)

- Best fit for **variable amounts** (whatever balance they cash out).
- Automated via **`process-pending-payouts`** + user’s PayPal email.
- Fees and fraud review are on you; first-cashout **$5** + **$25** ready-balance cap help limit drain — keep payouts off until you have data if needed.

### Cash App

- **Not integrated** today. Would need Cash App API / partner program (eligibility varies).
- **Recommendation:** Launch with **PayPal only**. Add Cash App only if a large share of users ask and you have legal clearance.

### Gift cards (Amazon, Visa, etc.)

Your instinct is right:

- **Do not** tie gift cards to the **3-hour conversion tick** (weird amounts, API limits, fraud).
- **Do** use gift cards for **fixed tiers** if you add them later, e.g. **$25 / $50 / $100** after manual or automated review.
- Requires a **gift-card API** (Tango, Tremendous, etc.) — new build, not a config toggle.

**Suggested product shape**

| Event | What user gets |
|--------|----------------|
| Every 3 hours | Coins → **in-app $ balance** (not a gift card) |
| User taps **Withdraw** | **PayPal** for full balance (≥ minimum) |
| Optional future | **Redeem $50 Amazon** (exact tier, separate button) |

---

## Default reward amounts (starting point)

These defaults target **~25–40% of ad revenue** returned as *virtual* liability, and **much less** when you pay **real** dollars 1:1.

| Action | Coins | ≈ virtual $ (at 2500:1) | Notes |
|--------|-------|-------------------------|--------|
| Rewarded ad | **10** | **$0.004** | Main revenue; keep below eCPM/1000 |
| Mini-game win | **4–8** (server cap **8**) | **$0.0016–0.0032** | Max **30** plays/game/day |
| Daily streak (7 days) | **4…20** | **$0.0016…0.008** | Optional: require 1 ad first (on) |
| 3-hour conversion | all eligible coins | batch to balance | Matches reference **timer**, not PayPal |

**Planning check** (rewarded ad at **$18 eCPM**):

- Gross ad revenue per view ≈ **$0.018**
- Virtual granted ≈ **$0.004**
- **Headroom ≈ $0.014/view** before costs — healthy **if payouts stay virtual** or real pay is **≤ ~40%** of that headroom.

Update `planningRewardedEcpmUsd` monthly from LevelPlay reports.

---

## When to turn on **real** money

Keep `realMoneyPayoutsEnabled: false` until ALL of:

1. **30+ days** of LevelPlay data for your countries.
2. **Supabase auth** live (no local-only farming).
3. Legal/tax review for reward apps in your markets.
4. Spreadsheet proves: **(ads + IAP) − (PayPal fees + payouts + Play fee) > 30% margin**.

Then enable PayPal payouts (see **`docs/GITHUB_SETUP_CHECKLIST.md` Part F**).

---

## Tuning over time (you + me)

After closed testing, send:

- LevelPlay **eCPM** (rewarded + interstitial)
- **DAU** and average **ads/user/day**
- Any **withdrawal** attempts (even virtual)

We adjust **`coinsPerAd`**, **`coinsPerVirtualDollar`**, **`minCashoutVirtualDollars`**, and game caps so the house stays ahead.

**Do not** promise reference-app dollar amounts while paying real 1:1 unless your ad ARPU proves it.
