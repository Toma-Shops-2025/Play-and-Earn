# Supabase database — run migrations

Apply these **ten files in order**. Do not skip ahead or run only the PayPal fix script.

| # | File | What it adds |
|---|------|----------------|
| 1 | `supabase/migrations/20260322000000_init.sql` | `profiles`, wallet, auth trigger, core RPCs |
| 2 | `supabase/migrations/20260322000001_ad_rewards.sql` | Rewarded ad claims + `grant_ad_reward` |
| 3 | `supabase/migrations/20260322000002_wallet_ad_stats.sql` | Ad stats on wallet RPC |
| 4 | `supabase/migrations/20260322000003_profitable_economy.sql` | Economy limits, conversion tuning |
| 5 | `supabase/migrations/20260322000004_three_hour_payout_cycle.sql` | 3-hour coin → cash conversion |
| 6 | `supabase/migrations/20260322000005_paypal_payments.sql` | PayPal fulfillments + `credit_purchased_coins` |
| 7 | `supabase/migrations/20260322000006_payout_automation.sql` | Withdrawal PayPal email + payout fields |
| 8 | `supabase/migrations/20260322000007_portal_play_rewards.sql` | Y8 / Crazy Games per-minute coins + daily cap |
| 9 | `supabase/migrations/20260322000008_justplay_payouts.sql` | PayPal / Cash App destinations |
| 10 | `supabase/migrations/20260322000009_first_cashout_and_cap.sql` | $5 first cashout, then any amount; $25 ready-balance cap |

---

## Option A — Supabase CLI (recommended)

Use this if you have the repo on your computer and want migrations tracked automatically.

### A1. Install CLI

```bash
npm install -g supabase
```

### A2. Log in and link your project

1. Supabase Dashboard → **Project Settings** → **General** → copy **Reference ID** (e.g. `abcdefghijklmnop`).
2. In your repo folder:

```bash
cd Play-and-Earn
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

When prompted for the database password, use the password you set when creating the project.

### A3. Push migrations

```bash
supabase db push
```

Confirm when asked. This runs every file in `supabase/migrations/` that is not already recorded.

### A4. Verify

In **Table Editor**, you should see `profiles`, `coin_ledger`, `payment_fulfillments`, `withdrawals`, etc.

---

## Option B — SQL Editor (no CLI)

Use this if you prefer the Supabase website only.

### B1. Clean slate (new project only)

If you already ran random SQL and got errors:

1. **Project Settings** → **Database** → **Reset database** (only if you have no data to keep).
2. Wait until the project is ready again.

### B2. Run each migration file

1. Open **SQL Editor** → **New query**.
2. For each row in the table above (**1 → 7**):
   - Open that file in GitHub or your local repo.
   - Copy **the entire file**.
   - Paste into SQL Editor → **Run**.
   - Wait for **Success** before opening the next file.

### B3. Verify

Same as A4 — check **Table Editor** for `profiles`.

---

## If something fails

| Error | Fix |
|--------|-----|
| `relation "public.profiles" does not exist` | You skipped **migration 1** or ran files out of order. Reset DB (if safe) and start again from `000000_init.sql`. |
| `cannot change return type of existing function credit_purchased_coins` | Use latest repo (migration 6 includes `DROP FUNCTION` before recreate). If migration 1 already created the old function, run migration **6** again from an updated copy of `20260322000005_paypal_payments.sql`, or run `supabase/scripts/fix-credit-purchased-coins.sql` **after** migration 1 succeeded. |
| `relation already exists` | That migration may already be applied. Skip that file and continue with the next number, or reset DB and run all seven from scratch. |

---

## After migrations

Continue **[GITHUB_SETUP_CHECKLIST.md](./GITHUB_SETUP_CHECKLIST.md)** at **Part B3** (enable Email auth) and deploy Edge Functions (Part B5).

`supabase/FULL_SCHEMA.sql` is the same content as all seven migrations combined — use **either** `db push` / seven files **or** one full schema file, not both on the same database unless you know you need a repair.
