# Data safety form (draft answers)

Use these when filling **Play Console → App content → Data safety** for the closed-testing build with Unity LevelPlay ads.

## Overview

| Question | Answer |
|----------|--------|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (HTTPS to Unity / Google ad SDKs; HTTPS to Supabase if the user signs in) |
| Do you provide a way for users to request that their data is deleted? | **Yes** — in-app **Profile → Delete all data on device**; also uninstall / clear storage |

## Data types (this Play Android build)

### Collected / shared by ad SDKs (required)

Unity LevelPlay + Unity Ads (and Google advertising-ID libraries) process:

| Type | Collected? | Shared? | Purpose |
|------|------------|---------|---------|
| Device or other IDs (**Advertising ID**) | **Yes** | **Yes** (ad partners) | Advertising or marketing |
| App activity (ad interactions) | **Yes** (SDK) | **Yes** (ad partners) | Advertising or marketing |

Play Console → App content also needs **Ads** declared separately because the app contains ads.

The app already requests `com.google.android.gms.permission.AD_ID`.

### Optional — only if the user creates an account

| Type | Collected? | Shared? | Purpose |
|------|------------|---------|---------|
| Email address | **Yes** | **No** (processed by Supabase as your backend) | App functionality (account sync) |

If closed testing ships **without** sign-in/Supabase, you can mark email as **Not collected**. Re-file if you enable accounts later.

### Not collected in this Android build

- Precise location
- Financial info / payout destination (PayPal email or Cash App tag) stored on device and sent to our backend when you cash out; no in-app purchase store
- Contacts, photos, files, health, messages

## Security practices

- Data in transit to ad / backend providers uses HTTPS.
- Users can delete on-device data from the app.
- You do **not** sell user data.

## Privacy policy URL

Must match the live HTTPS URL (see `HOSTING_PRIVACY.md`):

`https://toma-shops-2025.github.io/Play-and-Earn/privacy/`
