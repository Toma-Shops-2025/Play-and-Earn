# Where Unity ad IDs go (Android)

**File (only place that matters for the APK):**

`android/app/src/main/res/values/levelplay.xml`

Template (keep outside `res/values`): `android/levelplay.xml.example`

On your PC:

`C:\Users\SexyMimi\.app-store\play-and-earn\android\app\src\main\res\values\levelplay.xml`

## What to paste from Unity

Unity Dashboard → **Play N Earn** → **Unity Ads Monetization** → **Placements** (Android).

| XML string name | Unity dashboard label | Your value |
|----------------|----------------------|------------|
| `levelplay_app_key` | **Android Game ID** (top of Placements) | `6218645` |
| `levelplay_rewarded_ad_unit_id` | **Rewarded** row → **Placement ID** (copy full UUID) | paste from Unity |
| `levelplay_interstitial_ad_unit_id` | **Interstitial** row → **Placement ID** (copy full UUID) | paste from Unity |

Do **not** use project name `29446db95` or Project ID `310b2292-…` as the app key.

## After editing

```powershell
cd C:\Users\SexyMimi\.app-store\play-and-earn
npm run build:mobile
.\build-apk.ps1 -Bundle
```

Install the new APK/AAB on a phone and test **Watch Ad**.
