# Logo handoff — favicon, app icon, splash

When your **Play N' Earn** logo is ready, send it in chat (PNG preferred).

## What to send

1. **Master logo** — square **1024×1024** PNG (transparent background if the icon is not full-bleed).
2. Optional: wide banner for splash (if different from square).
3. Brand colors (hex) if the logo depends on a specific background.

## What we will wire up

| Asset | Location / tool |
|-------|------------------|
| Web favicon | `src/app/favicon.ico` (and/or `icon.png` in `src/app/`) |
| Android launcher | `@capacitor/assets` via `npm run assets:generate` |
| Splash screen | Same pipeline + `capacitor.config.ts` splash color |
| Placeholder generator | `scripts/generate-store-assets.mjs` (replace with your art) |

## After you send the logo

1. Drop source file in `assets/store/logo-1024.png` (or path we agree on).
2. Run:
   ```bash
   npm run assets:generate
   npm run build:mobile
   ```
3. Rebuild APK: `.\build-apk.ps1 -SkipNpmInstall`

Play Console also needs **512×512** hi-res icon — the asset pipeline produces the required sizes.
