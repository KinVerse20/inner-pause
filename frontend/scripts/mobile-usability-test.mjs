// npm run test:ui: the whole app on a phone, light and dark, the way a
// person uses it. Every screen is checked for what breaks on phones, and
// every flow is walked end to end.
//
// Needs the app running (npm run dev, or next start) and Google Chrome.
//   TEST_BASE_URL=http://localhost:3000   where the app is (default)
//   TEST_SCREENSHOTS=some/folder          save a screenshot of every screen
//   TEST_SIGN_IN=1                        sign in first (/local-test-sign-in, dev only)
//   PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH   a browser other than Chrome
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { chromium } from "playwright-core";

const BASE = (process.env.TEST_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const SHOTS = process.env.TEST_SCREENSHOTS;
const SIGN_IN = process.env.TEST_SIGN_IN === "1";
const PHONE = { width: 390, height: 844 };
const THEMES = ["light", "dark"];

// Every screen people can reach. `full` screens are checked closely.
const ROUTES = [
  "/", "/moments", "/practice", "/practice/anxiety", "/practice/confidence", "/practice/focus", "/practice/reactivity", "/practice/sleep",
  "/journey", "/profile", "/profile/account", "/profile/calendar", "/profile/help", "/profile/notifications", "/profile/pass",
  "/profile/preferences", "/profile/privacy", "/about", "/chakras", "/chakras/heart", "/chakras/root", "/tell", "/tell?mode=speak",
  "/entry", "/offline", "/privacy-policy", "/terms", "/refund-policy", "/auth", "/auth/reset-password", "/pause/calm",
  "/install", "/profile/report-bug", "/admin",
  // Empty, missing and not found.
  "/no-such-page", "/pause/player?session=missing", "/tell/recommended?entry=missing", "/chakras/not-a-centre",
];
const NARROW = [{ width: 320, height: 568 }, { width: 768, height: 1024 }];

const failures = [];
let checks = 0;
const check = (ok, label) => {
  checks += 1;
  if (!ok) failures.push(label);
};

async function launch() {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  try {
    return await chromium.launch(executablePath ? { executablePath } : { channel: "chrome" });
  } catch (error) {
    console.error("Couldn't start Chrome. Install Google Chrome, or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.\n", error.message);
    process.exit(1);
  }
}

// A fresh visitor: past the Entry gate, signed in if asked. Page errors are failures.
// They hold a Pass (as the server would report it), so Pauses play; the trial
// gate has its own flow with `pass: false` (docs/COMMERCIAL_PLAN.md C2).
async function visitor(browser, { theme = "light", viewport = PHONE, reducedMotion = "no-preference", pass = true } = {}) {
  const context = await browser.newContext({ viewport, colorScheme: theme, reducedMotion, deviceScaleFactor: 2 });
  // The Next.js dev badge sits over the tab bar; it isn't part of the app.
  await context.addInitScript(() =>
    addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "nextjs-portal{display:none!important}";
      document.head.append(style);
    }),
  );
  const page = await context.newPage();
  page.errors = [];
  page.on("pageerror", (error) => {
    const message = error.message.split("\n")[0];
    // React's development-only performance tracks throw this on a page that
    // calls notFound(); production is clean. Not the app's error.
    if (/Failed to execute 'measure' on 'Performance'.*negative time stamp/.test(message)) return;
    page.errors.push(message);
  });
  await page.goto(`${BASE}/entry`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  await page.waitForTimeout(500);
  if (pass && !SIGN_IN) await signedInAs(page, { status: "active", lifetime: true, expiresAt: null, trial: { used: 0, limit: 2, pauseIds: [] } });
  if (SIGN_IN) {
    await page.goto(`${BASE}/local-test-sign-in`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Enter as test listener/ }).click();
    await page.waitForTimeout(1200);
  }
  return { context, page };
}

// The app asks the server who is signed in on every load (auth-session-sync).
// Answer for it: a signed-in listener whose account holds `pass`.
async function signedInAs(page, pass) {
  await page.unroute("**/api/auth/me").catch(() => {});
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ json: { user: { id: "walk-through", email: "walk@test.local", fullName: "Walk Through", phone: "", pass } } }),
  );
}

async function settle(page, ms = 450) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(ms);
}

async function shot(page, name) {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home"}.png`) });
}

// What breaks on phones, on the screen as it is now.
const inspect = (page) =>
  page.evaluate(() => {
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      if (rect.width < 1 || rect.height < 1 || style.visibility === "hidden" || style.display === "none") return false;
      if (element.closest("[aria-hidden='true'], .sr-only, details:not([open]) > :not(summary)")) return false;
      for (let node = element; node; node = node.parentElement) if (Number(getComputedStyle(node).opacity) === 0) return false;
      return true;
    };

    // Sideways scroll.
    const overflow = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth;

    // Dashes in what people read (DESIGN_SYSTEM.md §14).
    const dashes = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement;
      if (!parent || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName) || !visible(parent)) continue;
      if (/[—–]|\s-\s/.test(node.textContent)) dashes.push(node.textContent.trim().slice(0, 60));
    }

    // Controls with no name for a screen reader.
    const unnamed = [...document.querySelectorAll("button, a[href], [role='button'], [role='radio'], input, textarea, select")]
      .filter(visible)
      .filter((element) => {
        const name = element.getAttribute("aria-label") || element.getAttribute("aria-labelledby") || element.getAttribute("title") || element.textContent.trim() || element.getAttribute("placeholder");
        const labelled = element.id && document.querySelector(`label[for="${element.id}"]`);
        return !name && !labelled && !element.closest("label") && element.type !== "hidden";
      })
      .map((element) => element.outerHTML.slice(0, 80));

    // Images that didn't load.
    const brokenImages = [...document.images].filter((image) => visible(image) && image.complete && image.naturalWidth === 0).map((image) => image.src);

    // Text contrast against what's behind it (WCAG AA: 4.5, or 3 for large text).
    // Chrome writes colours as rgb(…), or as color(srgb …) for color-mix().
    const COLOUR = /rgba?\([^)]+\)|color\(srgb [^)]+\)/g;
    const parse = (value) => {
      const match = /rgba?\(([^)]+)\)|color\(srgb ([^)]+)\)/.exec(value ?? "");
      if (!match) return null;
      if (match[1]) {
        const [r, g, b, a = 1] = match[1].split(/[ ,/]+/).filter(Boolean).map(Number);
        return { r, g, b, a };
      }
      const [r, g, b, a = 1] = match[2].split(/[ /]+/).filter(Boolean).map(Number);
      return { r: r * 255, g: g * 255, b: b * 255, a };
    };
    const over = (top, bottom) => ({ r: top.r * top.a + bottom.r * (1 - top.a), g: top.g * top.a + bottom.g * (1 - top.a), b: top.b * top.a + bottom.b * (1 - top.a), a: 1 });
    const luminance = ({ r, g, b }) => {
      const channel = (value) => {
        const c = value / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };
    const ratio = (a, b) => {
      const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (light + 0.05) / (dark + 0.05);
    };
    // Every colour that can sit behind an element: solid fills and gradient stops, down to something opaque.
    // Also returns the element that paints the nearest backdrop: opacity on
    // it or above fades text and backdrop together, so it doesn't count.
    const backdrops = (element) => {
      const layers = [];
      let painter = null;
      for (let node = element; node; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.backgroundImage.includes("url(")) return null;
        const stops = (style.backgroundImage.match(COLOUR) ?? []).map(parse);
        const fill = parse(style.backgroundColor);
        const solid = [...stops.filter((stop) => stop.a === 1), ...(fill && fill.a === 1 ? [fill] : [])];
        const clear = [...stops.filter((stop) => stop.a < 1 && stop.a > 0), ...(fill && fill.a > 0 && fill.a < 1 ? [fill] : [])];
        if (solid.length || clear.length) painter ??= node;
        // See-through stops sit over the same element's solid ones when it has any.
        if (solid.length) {
          layers.push(solid.flatMap((base) => [base, ...clear.map((top) => over(top, base))]));
          break;
        }
        if (clear.length) layers.push(clear);
      }
      let behind = [{ r: 255, g: 255, b: 255, a: 1 }];
      for (const colours of layers.reverse()) behind = colours.flatMap((colour) => behind.map((under) => over(colour, under)));
      return { behind, painter };
    };
    const lowContrast = [];
    const seen = new Set();
    const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = textWalker.nextNode(); node; node = textWalker.nextNode()) {
      const element = node.parentElement;
      if (!node.textContent.trim() || !element || seen.has(element) || !visible(element)) continue;
      seen.add(element);
      if (element.closest("[disabled], [aria-disabled='true'], input::placeholder, [data-dev], [aria-label^='Dev']")) continue;
      const style = getComputedStyle(element);
      const colour = parse(style.color);
      const found = backdrops(element);
      if (!colour || !found) continue;
      const { behind, painter } = found;
      let opacity = 1;
      for (let n = element; n && n !== painter; n = n.parentElement) opacity *= Number(getComputedStyle(n).opacity);
      const size = parseFloat(style.fontSize);
      const large = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700);
      const needed = large ? 3 : 4.5;
      const worst = Math.min(...behind.map((back) => ratio(over({ ...colour, a: colour.a * opacity }, back), back)));
      if (worst < needed) lowContrast.push(`${worst.toFixed(2)} < ${needed}: "${node.textContent.trim().slice(0, 40)}"`);
    }

    return { overflow, dashes, unnamed, brokenImages, lowContrast };
  });

// Scroll to the very end with the wheel: the page moves, and the last control isn't stuck under the tab bar.
async function reachesBottom(page) {
  await page.mouse.move(PHONE.width / 2, PHONE.height / 2);
  for (let i = 0; i < 30; i++) {
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(60);
    if (await page.evaluate(() => scrollY >= document.documentElement.scrollHeight - innerHeight - 2)) break;
  }
  await page.waitForTimeout(300);
  return page.evaluate(() => {
    const atBottom = scrollY >= document.documentElement.scrollHeight - innerHeight - 2;
    const nav = document.querySelector("nav.ds-nav");
    const navTop = nav ? nav.getBoundingClientRect().top : innerHeight;
    const controls = [...document.querySelectorAll("main button, main a[href], main textarea, main input")].filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== "hidden";
    });
    const last = controls.at(-1);
    return { atBottom, lastClear: !last || last.getBoundingClientRect().bottom <= navTop + 1 };
  });
}

async function checkScreen(page, label) {
  const found = await inspect(page);
  check(found.overflow <= 1, `${label}: scrolls sideways by ${found.overflow}px`);
  check(found.dashes.length === 0, `${label}: dashes in copy: ${found.dashes.join(" | ")}`);
  check(found.unnamed.length === 0, `${label}: controls with no name: ${found.unnamed.join(" | ")}`);
  check(found.brokenImages.length === 0, `${label}: images didn't load: ${found.brokenImages.join(" | ")}`);
  check(found.lowContrast.length === 0, `${label}: low contrast: ${found.lowContrast.slice(0, 4).join(" | ")}`);
  check(page.errors.length === 0, `${label}: page errors: ${[...new Set(page.errors)].join(" | ")}`);
  page.errors.length = 0;
}

async function screens(browser, theme) {
  const { context, page } = await visitor(browser, { theme });
  for (const route of ROUTES) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    await settle(page);
    const label = `${theme} ${route}`;
    await checkScreen(page, label);
    await shot(page, `${theme}-${route}`);
    const { atBottom, lastClear } = await reachesBottom(page);
    check(atBottom, `${label}: the wheel doesn't reach the bottom`);
    check(lastClear, `${label}: the last control is under the tab bar`);
  }
  // 404s and missing things say so plainly.
  await page.goto(`${BASE}/no-such-page`, { waitUntil: "networkidle" });
  check((await page.locator("main, body").first().innerText()).length > 20, `${theme} 404: blank`);
  await page.goto(`${BASE}/pause/player?session=missing`, { waitUntil: "networkidle" });
  await settle(page);
  check(await page.getByText("We couldn’t find that Pause.").isVisible(), `${theme} missing Pause: no message`);
  await page.goto(`${BASE}/tell/recommended?entry=missing`, { waitUntil: "networkidle" });
  await settle(page);
  check(await page.getByText("That entry isn’t here").isVisible(), `${theme} missing entry: no message`);
  await context.close();
}

async function narrowAndWide(browser) {
  for (const viewport of NARROW) {
    const { context, page } = await visitor(browser, { viewport });
    for (const route of ROUTES) {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
      await settle(page, 300);
      const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth);
      check(overflow <= 1, `${viewport.width}px ${route}: scrolls sideways by ${overflow}px`);
    }
    await context.close();
  }
}

// The flows, end to end.
async function flows(browser, theme) {
  const step = async (name, run, options = {}) => {
    const { context, page } = await visitor(browser, { theme, ...options });
    try {
      await run(page);
      check(page.errors.length === 0, `${theme} ${name}: page errors: ${[...new Set(page.errors)].join(" | ")}`);
    } catch (error) {
      check(false, `${theme} ${name}: ${error.message.split("\n")[0]}`);
      await shot(page, `${theme}-FAILED-${name}`);
    }
    await context.close();
  };
  const expect = async (page, text, label) => check(await page.getByText(text).first().isVisible().catch(() => false), `${theme} ${label}: "${text}" not shown`);

  await step("home tile, minimise, mini player, check in", async (page) => {
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    // A Home tile opens its Pause (or first its sounds, when the card has several).
    await page.locator("main").getByRole("button", { name: /Calm/ }).first().click();
    await page.waitForURL(/pause\//);
    if (!page.url().includes("/pause/player")) await page.getByRole("button", { name: /^(Start|Begin)/ }).first().click();
    await page.waitForURL(/pause\/player/);
    await page.getByRole("button", { name: /ready/i }).click({ timeout: 8000 });
    await page.waitForTimeout(2500);
    await checkScreen(page, `${theme} player`);
    await shot(page, `${theme}-flow-player`);
    check(await page.getByRole("button", { name: /Skip frequency/ }).isVisible(), `${theme} player: no Skip frequency`);
    check(await page.getByRole("button", { name: "End session" }).isVisible(), `${theme} player: no End session`);
    check((await page.getByText(/^DEV/).count()) === 0, `${theme} player: a DEV panel is showing`);
    await page.getByRole("button", { name: "Sound", exact: true }).click();
    await page.waitForTimeout(500);
    await checkScreen(page, `${theme} sound sheet`);
    await shot(page, `${theme}-flow-sound-sheet`);
    // The six sounds on top; Binaural and Frequency only have Soft, Balanced and Clear, no Off.
    const sheet = page.getByRole("dialog");
    for (const name of ["Rain", "Rainforest", "Ocean", "Wind", "Deep ambient", "Binaural"]) {
      check(await sheet.getByRole("radio", { name, exact: true }).isVisible(), `${theme} sound sheet: "${name}" not on top`);
    }
    for (const name of ["Forest", "Piano", "Gong"]) {
      check((await sheet.getByRole("radio", { name, exact: true }).count()) === 0, `${theme} sound sheet: "${name}" still offered`);
    }
    await sheet.getByRole("radio", { name: "Binaural", exact: true }).click();
    check((await sheet.getByRole("radio", { name: "Off", exact: true }).count()) === 0, `${theme} Binaural: Off offered`);
    await checkScreen(page, `${theme} sound sheet Binaural`);
    await sheet.getByRole("radio", { name: "Rain", exact: true }).click();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page.getByRole("button", { name: "Keep playing and go back" }).click();
    await page.waitForTimeout(800);
    check(await page.locator(".mini-player").isVisible(), `${theme} mini player: not shown after minimising`);
    await checkScreen(page, `${theme} with mini player`);
    await page.getByRole("navigation").last().getByRole("link", { name: "Practice" }).click();
    await page.waitForTimeout(800);
    check(await page.locator(".mini-player").isVisible(), `${theme} mini player: gone after changing tab`);
    await page.locator(".mini-player").getByRole("button", { name: /Open your Pause/ }).click();
    await page.waitForURL(/pause\/player/);
    await page.getByRole("button", { name: "End Pause" }).click();
    await page.waitForTimeout(600);
    await expect(page, "How do you feel now?", "check in");
    await checkScreen(page, `${theme} check in`);
    await page.getByRole("button", { name: "Better", exact: true }).click();
    await page.waitForTimeout(2200);
    check(!(await page.locator(".mini-player").count()), `${theme} mini player: still there after the check in`);
  });

  await step("tell, two feelings, Your Pause", async (page) => {
    await page.goto(`${BASE}/tell`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Anxiety", exact: true }).click();
    await page.getByRole("button", { name: "Loneliness", exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL(/tell\/recommended/);
    await settle(page);
    await expect(page, "Root · 396 Hz", "Your Pause");
    await expect(page, "Heart · 639 Hz", "Your Pause");
    await checkScreen(page, `${theme} Your Pause`);
    await shot(page, `${theme}-flow-your-pause`);
    await page.getByRole("button", { name: /^Sound/ }).click();
    await page.waitForTimeout(400);
    await checkScreen(page, `${theme} Your Pause sound sheet`);
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page.getByRole("button", { name: "Begin my Pause" }).click();
    await page.waitForURL(/pause\/player/);
    await settle(page);
    await page.getByRole("button", { name: /ready/i }).click();
    await page.waitForTimeout(1500);
    await expect(page, "for: Anxiety", "player with stops");
  });

  await step("tell, text only", async (page) => {
    await page.goto(`${BASE}/tell`, { waitUntil: "networkidle" });
    await page.locator("textarea").fill("I can't sleep, my mind is racing at night");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL(/tell\/recommended/);
    await settle(page);
    await expect(page, "Sleep Pause", "text routing");
    await checkScreen(page, `${theme} Tell recommended`);
  });

  await step("moments, let it out inside the Pause", async (page) => {
    await page.goto(`${BASE}/moments`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Just happened/ }).click();
    await settle(page, 400);
    await checkScreen(page, `${theme} Moments mode`);
    await page.getByRole("button", { name: /Made a mistake/ }).click();
    await page.waitForURL(/pause\/player/);
    await page.waitForTimeout(1500);
    await page.locator('section[aria-label="Let it out"]').getByRole("button", { name: "Write" }).click();
    await page.getByRole("textbox", { name: "Let it out" }).fill("I sent the wrong file.");
    await checkScreen(page, `${theme} let it out panel`);
    await shot(page, `${theme}-flow-let-it-out`);
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page.waitForTimeout(400);
    await page.goto(`${BASE}/journey`, { waitUntil: "networkidle" });
    await settle(page);
    await expect(page, "I sent the wrong file.", "Journey polaroid");
  });

  await step("practice, start and check in", async (page) => {
    await page.goto(`${BASE}/practice/confidence`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Start Confidence", exact: true }).click();
    await page.getByRole("button", { name: /Begin today/ }).click();
    await settle(page, 400);
    await checkScreen(page, `${theme} Practice check in`);
    await shot(page, `${theme}-flow-practice-check-in`);
    await page.getByRole("button", { name: "Okay", exact: true }).click();
    await page.getByRole("button", { name: "Begin my Pause" }).click();
    await page.waitForURL(/pause\/player/);
    await settle(page);
    await page.getByRole("button", { name: /ready/i }).click();
    await page.waitForTimeout(1200);
    await page.getByRole("button", { name: "End Pause" }).click();
    await page.getByRole("button", { name: "Skip for now" }).click();
    await page.waitForURL(/practice\/confidence/);
    await settle(page);
    await expect(page, "Pick up where you left off", "Practice part way");
    await page.getByText("How this path is built").click();
    await checkScreen(page, `${theme} Practice dashboard`);
  });

  await step("journey: stamp and entry", async (page) => {
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Start a Pause" }).click();
    await page.waitForURL(/pause\/player/);
    await page.waitForTimeout(6500);
    await page.getByRole("button", { name: "End Pause" }).click();
    await page.getByRole("button", { name: "Better", exact: true }).click();
    await page.waitForTimeout(2200);
    await page.goto(`${BASE}/journey`, { waitUntil: "networkidle" });
    await settle(page);
    await page.locator(".pause-stamp").first().click();
    await page.waitForTimeout(400);
    await checkScreen(page, `${theme} Journey stamp sheet`);
    await shot(page, `${theme}-flow-journey-stamp`);
  });

  await step("trial gate: a Pause needs an account, then the Pass", async (page) => {
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Start a Pause" }).click();
    await page.waitForURL(/pause\/player/);
    await settle(page);
    await page.getByText("Sign in to begin").first().waitFor({ timeout: 8000 }).catch(() => {});
    await expect(page, "Sign in to begin", "signed out trial gate");
    await checkScreen(page, `${theme} trial gate signed out`);
    // Signed in with the trial used up, as the server would report it.
    await signedInAs(page, { status: "none", lifetime: false, expiresAt: null, trial: { used: 2, limit: 2, pauseIds: ["a", "b"] } });
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Start a Pause" }).click();
    await page.waitForURL(/pause\/player/);
    await settle(page);
    await page.getByText("Ready to keep going?").first().waitFor({ timeout: 8000 }).catch(() => {});
    await expect(page, "Ready to keep going?", "trial used gate");
    await checkScreen(page, `${theme} trial used gate`);
    // Everything else waits for the Pass too: Tell, and writing in the journal.
    await page.goto(`${BASE}/tell`, { waitUntil: "networkidle" });
    await settle(page);
    await expect(page, "Ready to keep going?", "Tell closed after the trial");
    await checkScreen(page, `${theme} Tell after the trial`);
    await page.goto(`${BASE}/journey`, { waitUntil: "networkidle" });
    await settle(page);
    await page.getByRole("button", { name: /Write in your journal/ }).click();
    await expect(page, "Ready to keep going?", "journal closed after the trial");
    await checkScreen(page, `${theme} journal after the trial`);
    await page.getByRole("button", { name: "Not now" }).click();
    await expect(page, "Write in your journal", "journal gate closes");
    await page.getByRole("tab", { name: "Patterns" }).click();
    await settle(page);
    await expect(page, "Ready to keep going?", "Patterns closed after the trial");
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Start a Pause" }).click();
    await page.waitForURL(/pause\/player/);
    await settle(page);
    await page.getByText("Ready to keep going?").first().waitFor({ timeout: 8000 }).catch(() => {});
    await page.getByRole("button", { name: "See the Pass" }).click();
    await page.waitForURL(/profile\/pass/);
    await settle(page);
    await expect(page, "Launch offer", "Pass page offer");
  }, { pass: false });

  await step("empty journey", async (page) => {
    await page.goto(`${BASE}/journey`, { waitUntil: "networkidle" });
    await settle(page);
    await expect(page, "Your story begins", "empty Journey");
    await checkScreen(page, `${theme} empty Journey`);
  });
}

// Reduced motion: nothing keeps moving on its own.
async function reducedMotion(browser) {
  const { context, page } = await visitor(browser, { reducedMotion: "reduce" });
  const moving = () =>
    page.evaluate(() =>
      document
        .getAnimations()
        .filter((animation) => animation.playState === "running")
        .filter((animation) => {
          const frames = animation.effect?.getKeyframes?.() ?? [];
          const transition = animation.transitionProperty;
          return frames.some((frame) => frame.transform || frame.translate || frame.scale || frame.rotate) || ["transform", "translate", "scale", "rotate"].includes(transition);
        })
        .map((animation) => `${animation.effect?.target?.className?.baseVal ?? animation.effect?.target?.className ?? "?"} (${animation.animationName ?? animation.transitionProperty})`),
    );
  for (const route of ["/", "/moments", "/practice", "/practice/focus", "/journey"]) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    await settle(page, 1200);
    const found = await moving();
    check(found.length === 0, `reduced motion ${route}: still moving: ${[...new Set(found)].join(" | ")}`);
  }
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Start a Pause" }).click();
  await page.waitForURL(/pause\/player/);
  await page.waitForTimeout(7000);
  const found = await moving();
  check(found.length === 0, `reduced motion player: still moving: ${[...new Set(found)].join(" | ")}`);
  await page.getByRole("button", { name: "Keep playing and go back" }).click();
  await page.waitForTimeout(1200);
  const mini = await moving();
  check(mini.length === 0, `reduced motion mini player: still moving: ${[...new Set(mini)].join(" | ")}`);
  await context.close();
}

const browser = await launch();
try {
  await (await fetch(BASE)).text();
} catch {
  console.error(`Nothing is running at ${BASE}. Start the app (npm run dev) or set TEST_BASE_URL.`);
  process.exit(1);
}
const started = Date.now();
for (const theme of THEMES) {
  await screens(browser, theme);
  await flows(browser, theme);
}
await narrowAndWide(browser);
await reducedMotion(browser);
await browser.close();

const seconds = Math.round((Date.now() - started) / 1000);
if (failures.length) {
  console.log(`\n${failures.length} of ${checks} checks failed (${seconds} s):\n`);
  for (const failure of failures) console.log(`  ✖ ${failure}`);
  process.exit(1);
}
console.log(`All ${checks} checks passed (${seconds} s): ${ROUTES.length} screens and 8 flows, light and dark, at 390 × 844, 320 and 768 wide, and with reduced motion.`);
