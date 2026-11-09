# Operator checklist (current product — no coin packs)

**Going live with real ads + PayPal payouts:** **[GO_LIVE_ADS_AND_PAYOUTS.md](./GO_LIVE_ADS_AND_PAYOUTS.md)**

Play N' Earn is **earn → 3-hour conversion → cash out** (PayPal / Cash App). The app does **not** sell coin packs in the UI. Revenue is **ads** (Unity LevelPlay on Android); optional **real PayPal payouts** are ops-only.

Use this before retesting production. Full repo wiring: **[GITHUB_SETUP_CHECKLIST.md](./GITHUB_SETUP_CHECKLIST.md)**.

---

## Must be done (cloud wallet)

| # | Task | Verify |
|---|------|--------|
| 1 | **Supabase DB** — all [10 migrations](./SUPABASE_MIGRATIONS.md) or `supabase/ALL_MIGRATIONS_IN_ORDER.sql` once | Table Editor: `profiles`, `ad_reward_claims`, `withdrawals`, … |
| 2 | **Auth** — Email and/or Google; **Redirect URLs** include `https://toma-shops-2025.github.io/Play-and-Earn/**` and `http://localhost:43123/**` | Sign in on live site; “Cloud sync on” |
| 3 | **GitHub secrets** — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Deploy web** green; Profile not “Add Supabase keys…” |
| 4 | **GitHub secrets** — `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` (function deploys) | **Deploy Supabase backend** green or manual `supabase functions deploy` |

**Edge function required for default product:** `process-pending-payouts` (can stay idle while `PAYPAL_PAYOUTS_ENABLED=false`).

**Not required for current UI:** `create-paypal-order`, `complete-paypal-order`, `paypal-webhook` (legacy coin-pack checkout — safe to deploy, never shown in app).

---

## Only when you enable automatic PayPal payouts

| # | Task |
|---|------|
| 5 | PayPal Developer app → **Client ID + Secret** → Supabase secrets `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE=sandbox` |
| 6 | Same **`CRON_SECRET`** in GitHub Actions and Supabase |
| 7 | GitHub secrets `SUPABASE_URL`, `CRON_SECRET` (cron workflow) |
| 8 | `supabase secrets set PAYPAL_PAYOUTS_ENABLED=true` only when PayPal Business **Payouts** is ready |
| 9 | `economy-config.ts` / ops policy aligned (`MONETIZATION.md`) |

You do **not** need `NEXT_PUBLIC_PAYPAL_CLIENT_ID` on GitHub Pages unless you re-enable coin-pack UI in code.

---

## Retest script (signed in)

1. **Payouts** — balances and timer load (no `get_wallet` errors in browser Network tab).
2. **Watch Ad** — grant or daily limit message.
3. **Games / Daily** — rewards apply when used.
4. **Cash out** — save PayPal email → request when rules allow; check `withdrawals` in Supabase (queued until automation is on).

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| “Add Supabase keys…” | GitHub `NEXT_PUBLIC_*`; redeploy **Deploy web** |
| RPC errors after sign-in | Migrations complete; user has `profiles` row |
| Payouts never send | `PAYPAL_PAYOUTS_ENABLED`, PayPal secrets, `CRON_SECRET` match, cron workflow logs |
| Policy already exists (SQL) | Do not re-run init; see [SUPABASE_MIGRATIONS.md](./SUPABASE_MIGRATIONS.md) |

Legacy coin-pack code: `src/components/play-earn/coin-packs.tsx` (unmounted), `supabase/functions/create-paypal-order` — see **BACKEND_SETUP.md** appendix.
