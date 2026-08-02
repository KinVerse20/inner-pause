import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.log("Playwright is not installed in this project. Skipping mobile usability smoke test.");
  process.exit(0);
}

const baseUrl = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? undefined;

const viewports = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 1440, height: 900 },
];

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const checkNoHorizontalOverflow = async (page, label) => {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  const overflow = Math.max(metrics.scrollWidth, metrics.bodyScrollWidth) - metrics.clientWidth;
  assert(overflow <= 2, `${label}: horizontal overflow ${overflow}px`);
};

const checkLastActionReachable = async (page, label) => {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(80);
  const result = await page.evaluate(() => {
    const nav = document.querySelector("nav");
    const navTop = nav?.getBoundingClientRect().top ?? window.innerHeight;
    const actions = [...document.querySelectorAll("button, a, input, textarea, select")]
      .filter((item) => {
        const rect = item.getBoundingClientRect();
        const style = window.getComputedStyle(item);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      });
    const last = actions.at(-1);
    if (!last) return { ok: true };
    const rect = last.getBoundingClientRect();
    return {
      ok: rect.bottom <= navTop - 4 || rect.bottom <= window.innerHeight - 4,
      bottom: rect.bottom,
      navTop,
      text: last.textContent?.trim() || last.getAttribute("aria-label") || last.tagName,
    };
  });
  assert(result.ok, `${label}: last action may be hidden behind navigation (${JSON.stringify(result)})`);
};

const checkPage = async (page, label) => {
  await page.waitForLoadState("networkidle");
  await checkNoHorizontalOverflow(page, label);
  await checkLastActionReachable(page, label);
};

for (const viewport of viewports) {
  const browser = await chromium.launch({
    headless: true,
    executablePath,
  });
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  try {
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.clear());

    await page.goto(`${baseUrl}/onboarding`, { waitUntil: "networkidle" });
    await checkPage(page, `onboarding ${viewport.width}x${viewport.height}`);

    await page.goto(`${baseUrl}/auth`, { waitUntil: "networkidle" });
    await checkPage(page, `auth ${viewport.width}x${viewport.height}`);
    await page.getByLabel("Name").fill("Sahil");
    await page.getByLabel("Email").fill("sahil@example.com");
    await page.getByRole("button", { name: "Create Account" }).click();

    await page.waitForURL(`${baseUrl}/`);
    await checkPage(page, `home ${viewport.width}x${viewport.height}`);

    await page.goto(`${baseUrl}/journal`, { waitUntil: "networkidle" });
    await checkPage(page, `journal ${viewport.width}x${viewport.height}`);
    await page.getByPlaceholder("Write about your day...").fill("I felt stretched by work today and want a calmer reset tonight.");
    await page.getByRole("button", { name: "Create Emotional Insight" }).click();
    await page.waitForURL(/\/analysis\?entry=/);
    await checkPage(page, `analysis ${viewport.width}x${viewport.height}`);

    await page.getByRole("button", { name: "Continue to Healing Plan" }).click();
    await page.waitForURL(/\/healing\?entry=/);
    await checkPage(page, `healing plan ${viewport.width}x${viewport.height}`);

    await page.getByRole("button", { name: "Start Healing" }).click();
    await page.waitForURL(/\/healing\/player\?plan=/);
    await checkPage(page, `audio player ${viewport.width}x${viewport.height}`);
    await page.getByRole("button", { name: /Pause|Play/ }).click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Audio settings" }).click();
    await page.getByRole("button", { name: "Exit safely" }).last().click();
    await page.waitForURL(/\/feedback\?plan=/);
    await checkPage(page, `feedback ${viewport.width}x${viewport.height}`);

    await page.goto(`${baseUrl}/history`, { waitUntil: "networkidle" });
    await checkPage(page, `history ${viewport.width}x${viewport.height}`);
    await page.goto(`${baseUrl}/insights`, { waitUntil: "networkidle" });
    await checkPage(page, `insights ${viewport.width}x${viewport.height}`);
    await page.goto(`${baseUrl}/guidance`, { waitUntil: "networkidle" });
    await checkPage(page, `guidance ${viewport.width}x${viewport.height}`);
    await page.goto(`${baseUrl}/premium`, { waitUntil: "networkidle" });
    await checkPage(page, `premium ${viewport.width}x${viewport.height}`);
    await page.goto(`${baseUrl}/profile`, { waitUntil: "networkidle" });
    await checkPage(page, `profile ${viewport.width}x${viewport.height}`);
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL(`${baseUrl}/auth`);

    assert(errors.length === 0, `${viewport.width}x${viewport.height}: browser errors:\n${errors.join("\n")}`);
    console.log(`✓ ${viewport.width}x${viewport.height}`);
  } finally {
    await browser.close();
  }
}
