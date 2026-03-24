/**
 * One-off / CI: build app/icon.png, public/favicon.png, public/logo.png from source logo PNG.
 * Usage: node scripts/build-favicon.mjs [path-to-source.png]
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const defaultSrc = path.join(root, "public", "brand", "guidematch-favicon-source.png");

const src = process.argv[2] || defaultSrc;
const outApp = path.join(root, "app", "icon.png");
const outFavicon = path.join(root, "public", "favicon.png");
const outLogo = path.join(root, "public", "logo.png");

if (!fs.existsSync(src)) {
  console.error("[build-favicon] Source not found:", src);
  process.exit(1);
}

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const w = info.width;
const h = info.height;
const px = new Uint8ClampedArray(data);
for (let i = 0; i < px.length; i += 4) {
  const r = px[i];
  const g = px[i + 1];
  const b = px[i + 2];
  if (r <= 40 && g <= 40 && b <= 40) px[i + 3] = 0;
}

const buf = await sharp(Buffer.from(px), { raw: { width: w, height: h, channels: 4 } })
  .png()
  .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer();

await fs.promises.writeFile(outApp, buf);
await fs.promises.writeFile(outFavicon, buf);
await fs.promises.writeFile(outLogo, buf);
console.log("[build-favicon] wrote", outApp);
console.log("[build-favicon] wrote", outFavicon);
console.log("[build-favicon] wrote", outLogo);
