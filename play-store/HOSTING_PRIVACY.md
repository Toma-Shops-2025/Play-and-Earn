# Host your privacy policy (required by Google Play)

Play Console requires a **public HTTPS privacy policy URL**. The policy text is already in the app at `/privacy/` and in `src/app/privacy/page.tsx`.

## Option A — Deploy static export (recommended)

```bash
npm run build
```

Upload the contents of the `out/` folder to any static host:

- **Vercel / Netlify / Cloudflare Pages** — connect the repo, build command `npm run build`, output directory `out`
- **GitHub Pages** — deploy `out/` with an action or manual upload

Then set URLs in `src/lib/app-config.ts`:

```ts
privacyPolicyUrl: "https://your-domain.com/privacy/",
termsUrl: "https://your-domain.com/terms/",
```

Rebuild the Android app so the Profile tab links match (optional but good for consistency).

## Option B — Privacy-only subdomain

If the game ships only on Play, you can host just:

- `out/privacy/index.html`
- `out/terms/index.html`

on a simple static bucket + HTTPS.

## Play Console

Paste the privacy URL under **App content → Privacy policy**.
