import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.join(import.meta.dirname, "..");
const assetsDir = path.join(root, "assets", "store");

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
await gradientPng(1024, "icon-only.png");
await gradientPng(2732, "splash.png");
await sharp(path.join(assetsDir, "icon-only.png")).toFile(path.join(root, "assets", "icon-only.png"));
await sharp(path.join(assetsDir, "splash.png")).toFile(path.join(root, "assets", "splash.png"));
await writeFile(
  path.join(root, "assets", "store", "README.txt"),
  "Generated launcher art. Re-run: npm run assets:generate\n",
);
