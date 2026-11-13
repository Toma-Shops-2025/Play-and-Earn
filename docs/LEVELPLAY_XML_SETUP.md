# levelplay.xml — fix “Bad Request 400”

File on your PC:

`android\app\src\main\res\values\levelplay.xml`

---

## Why you get 400

The Android SDK calls `LevelPlay.init(appKey)`. A **400** almost always means **`levelplay_app_key` is wrong**.

| Do NOT use as `levelplay_app_key` | Why |
|-----------------------------------|-----|
| `29446db95` | Cloud **project** suffix, not an app key |
| `6218645` | Unity Ads **Game ID** (Placements page), not LevelPlay App Key |
| `310b2292-...` | Unity **Project ID** UUID |

Use the **LevelPlay App Key** from the Grow / LevelPlay dashboard for app **`com.playearn.arcade`**.

---

## Where to copy the right values

1. [Unity Cloud](https://cloud.unity.com/) → project **Play N Earn**
2. **Grow** → **LevelPlay** (or **Monetization** → LevelPlay)
3. **Apps** → Android → package **`com.playearn.arcade`**
4. Copy **App Key** → `levelplay_app_key`
5. **Ad units** → Rewarded + Interstitial → copy each **Ad unit ID** (long **UUID** with dashes)

If you only see **Game ID** on “Placements”, that page is **Unity Ads**, not the LevelPlay init key. Find **Apps** / **App Key** in LevelPlay.

Your Ad Mob / ironSource account must allow LevelPlay for this app (you were restricted on `platform.ironsrc.com` before — you may need Unity Grow only or support to enable the app).

---

## Example `levelplay.xml` (shape only)

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="levelplay_app_key" translatable="false">YOUR_LEVELPLAY_APP_KEY_HERE</string>
    <string name="levelplay_rewarded_ad_unit_id" translatable="false">50ffb074-7eca-4xxx-xxxx-xxxxxxxxxxxx</string>
    <string name="levelplay_interstitial_ad_unit_id" translatable="false">59b948e3-4518-4xxx-xxxx-xxxxxxxxxxxx</string>
</resources>
```

Ad unit IDs must be **full UUIDs** (36 characters with `-`), not short strings like `q2ac8n0loe6ue45n`.

---

## After editing

```powershell
cd C:\Users\SexyMimi\.app-store\play-and-earn
Remove-Item Env:GITHUB_PAGES_REPOSITORY -ErrorAction SilentlyContinue
.\build-apk.ps1
```

Uninstall old app → install new `app-debug.apk` → Watch Ad on **APK** (not github.io in Chrome).

---

## Quick checklist

- [ ] App Key = LevelPlay **App Key** (not Game ID 6218645)
- [ ] Rewarded + Interstitial IDs = **UUID** ad units from LevelPlay
- [ ] Android package in Unity = **`com.playearn.arcade`**
- [ ] Test mode / test ads on while debugging
- [ ] Rebuilt APK after every `levelplay.xml` change
