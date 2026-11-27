// Renders the ads to PNG at exact Instagram sizes:  node marketing/ads/render.mjs
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, "../../frontend/package.json"));
const { chromium } = require("playwright-core");

const ADS = ["ad-1-three-minutes", "ad-2-a-pause-for-that"];
const SIZES = [
  { name: "feed", width: 1080, height: 1350 },
  { name: "story", width: 1080, height: 1920 },
];

const browser = await chromium.launch({ channel: "chrome" });
for (const ad of ADS) {
  for (const size of SIZES) {
    const page = await browser.newPage({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1 });
    await page.goto(`file://${join(here, `${ad}.html`)}#${size.name}`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    const out = join(here, `${ad}-${size.name}-${size.width}x${size.height}.png`);
    await page.screenshot({ path: out });
    console.log(out);
    await page.close();
  }
}
await browser.close();
