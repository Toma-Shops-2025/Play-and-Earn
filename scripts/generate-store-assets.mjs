import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.join(import.meta.dirname, "..");
const assetsDir = path.join(root, "assets", "store");
const logoSource = path.join(assetsDir, "logo-source.png");

async function fileExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/** Deep background matching the logo art. */
const BRAND_BG = { r: 12, g: 14, b: 32, alpha: 1 };

async function loadLogoBuffer() {
  return sharp(logoSource).png().toBuffer();
}

async function writeIcon1024(buf) {
  const out = path.join(assetsDir, "icon-only.png");
  await sharp(buf)
    .resize(1024, 1024, {
      fit: "contain",
      background: BRAND_BG,
      position: "centre",
    })
    .png()
    .toFile(out);
  console.log("wrote", out);
  await sharp(out).toFile(path.join(root, "assets", "icon-only.png"));
}

async function writeSplash(buf) {
  const out = path.join(assetsDir, "splash.png");
  await sharp(buf)
    .resize(2732, 2732, {
      fit: "contain",
      background: BRAND_BG,
      position: "centre",
    })
    .png()
    .toFile(out);
  console.log("wrote", out);
  await sharp(out).toFile(path.join(root, "assets", "splash.png"));
}

async function writeWebIcons(buf) {
  const appDir = path.join(root, "src", "app");
  await mkdir(appDir, { recursive: true });
  await sharp(buf)
    .resize(512, 512, { fit: "contain", background: BRAND_BG })
    .png()
    .toFile(path.join(appDir, "icon.png"));
  await sharp(buf)
    .resize(32, 32, { fit: "contain", background: BRAND_BG })
    .png()
    .toFile(path.join(appDir, "favicon.png"));
  console.log("wrote src/app/icon.png and favicon.png");
}

/** Google Play feature graphic: 1024×500 PNG. */
async function writeFeatureGraphic(buf) {
  const logo = await sharp(buf)
    .resize(460, 460, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  const out = path.join(assetsDir, "feature-graphic.png");
  await sharp({
    create: {
      width: 1024,
      height: 500,
      channels: 4,
      background: BRAND_BG,
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toFile(out);
  const playStoreDir = path.join(root, "play-store");
  await mkdir(playStoreDir, { recursive: true });
  await sharp(out).toFile(path.join(playStoreDir, "feature-graphic.png"));
  await sharp(buf)
    .resize(512, 512, { fit: "contain", background: BRAND_BG })
    .png()
    .toFile(path.join(playStoreDir, "icon-512.png"));
  console.log("wrote", out);
  console.log("wrote", path.join(playStoreDir, "icon-512.png"));
}

async function gradientPng(size, filename) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#4f46e5"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" rx="${size * 0.18}" fill="url(#g)"/>
      <text x="50%" y="54%" text-anchor="middle" font-size="${size * 0.22}" font-family="Arial, sans-serif" font-weight="700" fill="#ffffff">PLAY</text>
      <text x="50%" y="72%" text-anchor="middle" font-size="${size * 0.1}" font-family="Arial, sans-serif" fill="#e0f2fe">EARN</text>
    </svg>`;
  const out = path.join(assetsDir, filename);
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log("wrote", out);
}

/** Adaptive-icon foreground sizes (108dp). Android 8+ uses these, not ic_launcher.png. */
const LAUNCHER_FOREGROUND = {
  "mipmap-ldpi": 81,
  "mipmap-mdpi": 108,
  "mipmap-hdpi": 162,
  "mipmap-xhdpi": 216,
  "mipmap-xxhdpi": 324,
  "mipmap-xxxhdpi": 432,
};

async function writeAndroidLauncherIcons() {
  const icon = path.join(root, "assets", "icon-only.png");
  if (!(await fileExists(icon))) {
    console.warn("No assets/icon-only.png — skipping Android launcher foregrounds.");
    return;
  }
  const res = path.join(root, "android", "app", "src", "main", "res");
  for (const [folder, size] of Object.entries(LAUNCHER_FOREGROUND)) {
    const dir = path.join(res, folder);
    await mkdir(dir, { recursive: true });
    const out = path.join(dir, "ic_launcher_foreground.png");
    await sharp(icon).resize(size, size, { fit: "cover" }).png().toFile(out);
    console.log("wrote", out);
  }
  const colors = path.join(res, "values", "ic_launcher_background.xml");
  await writeFile(
    colors,
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0C0E20</color>
</resources>
`,
  );
  console.log("wrote", colors);
}

if (process.argv.includes("--android-icons")) {
  await writeAndroidLauncherIcons();
  process.exit(0);
}

await mkdir(assetsDir, { recursive: true });

if (await fileExists(logoSource)) {
  const buf = await loadLogoBuffer();
  await writeIcon1024(buf);
  await writeSplash(buf);
  await writeWebIcons(buf);
  await writeFeatureGraphic(buf);
} else {
  console.warn("No assets/store/logo-source.png — using placeholder gradient.");
  await gradientPng(1024, "icon-only.png");
  await gradientPng(2732, "splash.png");
  await sharp(path.join(assetsDir, "icon-only.png")).toFile(
    path.join(root, "assets", "icon-only.png"),
  );
  await sharp(path.join(assetsDir, "splash.png")).toFile(
    path.join(root, "assets", "splash.png"),
  );
  const fallback = await sharp(path.join(assetsDir, "icon-only.png")).png().toBuffer();
  await writeFeatureGraphic(fallback);
}

await writeFile(
  path.join(assetsDir, "README.txt"),
  "logo-source.png = master art. Re-run: npm run assets:generate\n",
);

await writeAndroidLauncherIcons();
