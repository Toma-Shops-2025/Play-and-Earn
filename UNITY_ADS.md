# Unity LevelPlay rewarded ads (Android)

This app uses **Unity LevelPlay** (Unity’s mediation SDK) for **rewarded videos** on Android. Web builds show a **simulated** ad for testing UI.

## Reward economy (default)

Configured in `src/lib/ads-config.ts`:

| Setting | Value | Rationale |
|---------|-------|-----------|
| Coins per completed ad | **10** | Balanced vs typical eCPM; see `MONETIZATION.md` |
| Daily limit | **25** | More ad impressions (main revenue) with a daily cap |

When Supabase is enabled, rewards are granted via `grant_ad_reward` RPC **after** the native SDK reports completion.

## 1. Unity dashboard

1. Open [Unity LevelPlay](https://platform.unity.com/) (same Unity account as your other games).
2. **Add app** → Android → package name `com.playearn.arcade` (or your `applicationId`).
3. Copy the **App key** (sometimes labeled LevelPlay app key).
4. **Ad units** → create **Rewarded** and **Interstitial** → copy each **Ad unit ID**.
5. Under **Networks**, enable **Unity Ads** (and any other networks you use).

## 2. Android project

Edit `android/app/src/main/res/values/levelplay.xml`:

```xml
<string name="levelplay_app_key">your_app_key</string>
<string name="levelplay_rewarded_ad_unit_id">your_rewarded_ad_unit_id</string>
<string name="levelplay_interstitial_ad_unit_id">your_interstitial_ad_unit_id</string>
```

Rebuild:

```bash
npm run build:mobile
npm run android:open
```

Test on a **real device** with test ads enabled in the LevelPlay dashboard.

## 3. Supabase (cloud wallets)

Run migrations in order:

- `supabase/migrations/20260322000001_ad_rewards.sql`
- `supabase/migrations/20260322000002_wallet_ad_stats.sql`

Signed-in users must complete an ad before the app calls `grant_ad_reward` (server enforces the daily cap).

## 4. Play Console / privacy

- Declare **Ads** in Play Console (contains ads).
- Update **Data safety** if you use advertising IDs (AD_ID permission is in the manifest).
- Rewarded ads must not mislead users about real-money payouts.

## 5. Troubleshooting

| Issue | Check |
|-------|--------|
| “Set levelplay_app_key…” | Replace placeholders in `levelplay.xml` |
| Ad not ready | Wait for init; ensure network + test mode in LevelPlay |
| No coins after ad | Sign in for cloud mode; check Supabase migration applied |
| Build errors | Android Studio → Sync Gradle; JDK 17+ |

Native bridge: `android/.../RewardedAdsPlugin.java`  
JS API: `src/lib/rewarded-ads.ts`
