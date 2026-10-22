# Data safety form (draft answers)

Use these when filling **Play Console → App content → Data safety** for the current open-source build (no backend, no analytics SDKs).

## Overview

| Question | Answer |
|----------|--------|
| Does your app collect or share any of the required user data types? | **Yes** when cloud auth is enabled — email for account; purchase metadata via PayPal on web |
| Is all of the user data collected by your app encrypted in transit? | N/A — no developer server transmission |
| Do you provide a way for users to request that their data is deleted? | **Yes** — in-app **Profile → Delete all data on device**; also uninstall / clear storage |

## Data types

For each category, select **Not collected** for developer collection/sharing, because balances and progress are stored only in on-device WebView storage and are not transmitted to your servers.

If you add analytics, ads, crash reporting, or a backend API later, **re-file** Data safety.

## Security practices

- Data is not sent to developer servers in this version.
- Users can delete on-device data from the app.

## Privacy policy URL

Must match the live HTTPS URL you host (see `HOSTING_PRIVACY.md`).
