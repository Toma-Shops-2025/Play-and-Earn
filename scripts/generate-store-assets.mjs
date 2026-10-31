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

await mkdir(assetsDir, { recursive: true });

if (await fileExists(logoSource)) {
  const buf = await loadLogoBuffer();
  await writeIcon1024(buf);
  await writeSplash(buf);
  await writeWebIcons(buf);
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
}

await writeFile(
  path.join(assetsDir, "README.txt"),
  "logo-source.png = master art. Re-run: npm run assets:generate\n",
);
