# Unity ads config (`levelplay.xml`)

The file name is historical; values come from **Unity Ads Monetization** (cloud.unity.com), not the broken **Unity LevelPlay → ironSource** white screen.

Path: `android/app/src/main/res/values/levelplay.xml`

## Your project (Play N Earn)

| XML key | Unity Cloud source | Value |
|---------|-------------------|--------|
| `levelplay_app_key` | Settings → **Game IDs** → Google Play | `6218645` |
| `levelplay_rewarded_ad_unit_id` | Placements → Rewarded → **Placement ID** (full UUID) | `50ffb074-7eca-41d3-9914-28107902521d` |
| `levelplay_interstitial_ad_unit_id` | Placements → Interstitial | `59b948e3-4518-4621-a6d1-792ee491534f` |

## Test ads

Unity Cloud → **Settings** → enable **Test mode** (right sidebar).  
Optional: `android/app/src/main/res/values/unity_ads_config.xml` has `unity_ads_test_mode` (default `true` for debug builds).

## Rebuild

```powershell
cd C:\Users\SexyMimi\.app-store\play-and-earn
.\build-apk.ps1
```

Later you can migrate to full LevelPlay mediation when the dashboard loads.
