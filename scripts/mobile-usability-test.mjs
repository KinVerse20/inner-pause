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
        const closedDetails = item.closest("details:not([open])");
        if (closedDetails && item.tagName.toLowerCase() !== "summary") return false;
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

const assertNoPremiumCta = async (page, label) => {
  const visibleText = await page.locator("body").innerText();
  assert(!/(start mock upgrade|upgrade|checkout|pricing|manage subscription|\$9|premium healing)/i.test(visibleText), `${label}: visible premium/subscription CTA found`);
  assert(!/\/premium|\/subscription/i.test(page.url()), `${label}: navigated to a premium/subscription route`);
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
    await assertNoPremiumCta(page, `home ${viewport.width}x${viewport.height}`);

    await page.goto(`${baseUrl}/journal`, { waitUntil: "networkidle" });
    await checkPage(page, `journal ${viewport.width}x${viewport.height}`);
    await page.getByPlaceholder("Write about your day...").fill("I felt ignored during an office meeting today. I wanted to speak up but stayed quiet. Now I feel angry with myself and anxious about tomorrow.");
    await page.getByRole("button", { name: "Create Emotional Insight" }).click();
    await page.waitForURL(/\/analysis\?entry=/, { timeout: 60000 });
    await page.getByText("What you shared").waitFor({ timeout: 20000 });
    await checkPage(page, `analysis ${viewport.width}x${viewport.height}`);
    await assertVisible(page, "What you shared", `analysis shared ${viewport.width}x${viewport.height}`);
    await assertVisible(page, "What I understood", `analysis understood ${viewport.width}x${viewport.height}`);
    await assertVisible(page, "Why it may be involved", `analysis chakra reason ${viewport.width}x${viewport.height}`);
    await assertVisible(page, "How your session will support it", `analysis chakra support ${viewport.width}x${viewport.height}`);
    assert(await page.getByTestId("emotional-insight-artwork").isVisible(), `analysis artwork missing ${viewport.width}x${viewport.height}`);

    await page.getByRole("button", { name: "Continue to Healing Plan" }).click();
    await page.waitForURL(/\/healing\?entry=/);
    await checkPage(page, `healing plan ${viewport.width}x${viewport.height}`);
    await page.getByRole("button", { name: "10 min" }).first().click();
    await assertVisible(page, "10 minutes", `duration summary ${viewport.width}x${viewport.height}`);
    await page.getByText("Customisation").click();
    await page.locator("details").getByRole("button", { name: "None" }).first().click();
    await assertVisible(page, "no voice guidance", `voice summary ${viewport.width}x${viewport.height}`);
    await page.getByRole("button", { name: "Off" }).click();
    await assertVisible(page, "Affirmations off", `affirmations summary ${viewport.width}x${viewport.height}`);

    await page.getByRole("button", { name: "Start Healing" }).click();
    await page.waitForURL(/\/healing\/player\?plan=/);
    await checkPage(page, `audio player ${viewport.width}x${viewport.height}`);
    await assertStoredPlanDuration(page, 10, `player selected duration ${viewport.width}x${viewport.height}`);
    await assertStoredPlanSetting(page, "voiceGuidanceLevel", "none", `player selected voice ${viewport.width}x${viewport.height}`);
    await page.getByRole("button", { name: /Pause|Play/ }).click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Audio settings" }).click();
    await page.getByRole("button", { name: "Exit safely" }).last().click();
    await page.waitForURL(/\/feedback\?plan=/);
    await checkPage(page, `feedback ${viewport.width}x${viewport.height}`);
    await page.getByRole("button", { name: "Save Session" }).click();
    await page.waitForURL(`${baseUrl}/`);
    await assertNoPremiumCta(page, `save session ${viewport.width}x${viewport.height}`);

    await page.goto(`${baseUrl}/history`, { waitUntil: "networkidle" });
    await checkPage(page, `history ${viewport.width}x${viewport.height}`);
    await assertNoPremiumCta(page, `history ${viewport.width}x${viewport.height}`);
    await page.goto(`${baseUrl}/insights`, { waitUntil: "networkidle" });
    await checkPage(page, `insights ${viewport.width}x${viewport.height}`);
    await assertNoPremiumCta(page, `insights ${viewport.width}x${viewport.height}`);
    await page.goto(`${baseUrl}/guidance`, { waitUntil: "networkidle" });
    await checkPage(page, `guidance ${viewport.width}x${viewport.height}`);
    await assertNoPremiumCta(page, `guidance ${viewport.width}x${viewport.height}`);
    await page.goto(`${baseUrl}/profile`, { waitUntil: "networkidle" });
    await checkPage(page, `profile ${viewport.width}x${viewport.height}`);
    await assertNoPremiumCta(page, `profile ${viewport.width}x${viewport.height}`);
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL(`${baseUrl}/auth`);

    assert(errors.length === 0, `${viewport.width}x${viewport.height}: browser errors:\n${errors.join("\n")}`);
    console.log(`✓ ${viewport.width}x${viewport.height}`);
  } finally {
    await browser.close();
  }
}

async function assertVisible(page, text, label) {
  const bodyText = await page.locator("body").innerText();
  assert(bodyText.toLowerCase().includes(text.toLowerCase()), `${label}: expected page text "${text}"`);
}

async function assertStoredPlanDuration(page, minutes, label) {
  const duration = await page.evaluate(() => {
    const raw = localStorage.getItem("chakra-healing-mvp");
    if (!raw) return null;
    const state = JSON.parse(raw);
    const plan = state.entries?.find((entry) => entry.plan)?.plan;
    return plan?.totalDurationMinutes ?? null;
  });
  assert(duration === minutes, `${label}: expected stored plan duration ${minutes}, received ${duration}`);
}

async function assertStoredPlanSetting(page, key, expected, label) {
  const value = await page.evaluate((settingKey) => {
    const raw = localStorage.getItem("chakra-healing-mvp");
    if (!raw) return null;
    const state = JSON.parse(raw);
    const plan = state.entries?.find((entry) => entry.plan)?.plan;
    return plan?.customisation?.[settingKey] ?? null;
  }, key);
  assert(value === expected, `${label}: expected ${key}=${expected}, received ${value}`);
}
