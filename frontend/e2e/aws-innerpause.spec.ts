import { expect, test, type Page } from "@playwright/test";

const runId = process.env.INNERPAUSE_E2E_RUN_ID ?? `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const baseEmail = process.env.INNERPAUSE_E2E_EMAIL;
const baseEmailB = process.env.INNERPAUSE_E2E_EMAIL_B;
const password = process.env.INNERPAUSE_E2E_PASSWORD ?? createEphemeralPassword();
const passwordB = process.env.INNERPAUSE_E2E_PASSWORD_B ?? createEphemeralPassword();
const verificationCode = process.env.INNERPAUSE_E2E_VERIFICATION_CODE;
const verificationCodeB = process.env.INNERPAUSE_E2E_VERIFICATION_CODE_B;

const userAEmail = uniqueEmail(baseEmail, runId, "a");
const userBEmail = uniqueEmail(baseEmailB, runId, "b");
const uniqueJournalText = `InnerPause AWS E2E reflection ${runId}: I feel focused but slightly overwhelmed, and I want a calm reset.`;

test.describe("AWS Inner Pause live E2E", () => {
  test("homepage loads and mobile layouts have no horizontal scrolling", async ({ page }) => {
    const errors = collectBrowserErrors(page);

    for (const viewport of [
      { width: 375, height: 667 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/", { waitUntil: "networkidle" });
      await expect(page).toHaveTitle(/Inner Pause/i);
      await expect(page.getByText(/The Inner Pause|Good morning|Find Your Inner Balance|Welcome/i).first()).toBeVisible();
      await expectNoHorizontalScroll(page);
    }

    expect(errors, `Browser errors: ${errors.join("\n")}`).toEqual([]);
  });

  test("invalid login details show an error", async ({ page }) => {
    await page.goto("/auth", { waitUntil: "networkidle" });
    await switchToLogin(page);
    await page.getByLabel("Email").fill(uniqueEmail("invalid-login@example.com", runId, "invalid"));
    await page.getByLabel("Password").fill("WrongPassword-12345!");
    await page.getByRole("button", { name: "Log In" }).click();
    await expect(page.getByText(/NEXT_PUBLIC_API_BASE_URL|incorrect|not found|failed|authentication/i)).toBeVisible();
  });

  test("protected pages redirect to login when the browser session is missing", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await clearFrontendSession(page);
    await page.goto("/journal", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/auth\?redirectTo=%2Fjournal|\/auth/);
  });

  test("signup, verification, login, journal persistence, logout and second-user isolation", async ({ page }) => {
    await signUp(page, userAEmail, password, "InnerPause E2E A");

    if (!verificationCode) {
      throw new Error(
        [
          "Manual action required: Cognito signup reached email verification.",
          `Open the disposable inbox for ${userAEmail}, copy the verification code, then rerun with INNERPAUSE_E2E_VERIFICATION_CODE set.`,
          "No password or secret was written to source code.",
        ].join(" "),
      );
    }

    await verifyAndLogin(page, userAEmail, password, verificationCode);
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/journal", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /Express/i })).toBeVisible();

    await createJournalReflection(page, uniqueJournalText);
    await expect(page).toHaveURL(/\/analysis\?entry=/);
    await expect(page.getByText(/Here is what I understood/i)).toBeVisible();

    await assertJournalTextInLocalStorage(page, uniqueJournalText);
    await page.reload({ waitUntil: "networkidle" });
    await assertJournalTextInLocalStorage(page, uniqueJournalText);

    await page.goto("/history", { waitUntil: "networkidle" });
    await expect(page.getByText(/Journey/i).first()).toBeVisible();
    await expect(page.getByText(/Based on what you shared|Here is what/i).first()).toBeVisible();

    await simulateAnalysisApiFailure(page);

    await logout(page);
    await page.goto("/journal", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/auth/);

    await login(page, userAEmail, password);
    await assertJournalTextInLocalStorage(page, uniqueJournalText);

    await signUp(page, userBEmail, passwordB, "InnerPause E2E B");
    if (!verificationCodeB) {
      throw new Error(
        [
          "Manual action required for User B isolation test.",
          `Open the disposable inbox for ${userBEmail}, copy the verification code, then rerun with INNERPAUSE_E2E_VERIFICATION_CODE and INNERPAUSE_E2E_VERIFICATION_CODE_B set.`,
        ].join(" "),
      );
    }

    await verifyAndLogin(page, userBEmail, passwordB, verificationCodeB);
    await assertJournalTextAbsentFromLocalStorage(page, uniqueJournalText);
  });
});

function collectBrowserErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

async function switchToLogin(page: Page) {
  const loginButton = page.getByRole("button", { name: "I already have an account" });
  if (await loginButton.isVisible().catch(() => false)) {
    await loginButton.click();
  }
}

async function signUp(page: Page, email: string, pass: string, fullName: string) {
  await page.goto("/auth", { waitUntil: "networkidle" });
  const createAccountSwitch = page.getByRole("button", { name: "Create an account" });
  if (await createAccountSwitch.isVisible().catch(() => false)) {
    await createAccountSwitch.click();
  }
  await page.getByLabel("Full name").fill(fullName);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(pass);
  await page.getByRole("button", { name: "Create Account" }).click();
  if (await page.getByText(/NEXT_PUBLIC_API_BASE_URL is required/i).isVisible().catch(() => false)) {
    throw new Error("AWS frontend is missing NEXT_PUBLIC_API_BASE_URL, so Cognito signup cannot start.");
  }
  await expect(page.getByText(/check your email|verification code/i)).toBeVisible();
}

async function verifyAndLogin(page: Page, email: string, pass: string, code: string) {
  await switchToLogin(page);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(pass);
  await page.getByLabel("Verification code").fill(code);
  await page.getByRole("button", { name: "Verify account" }).click();
  await expect(page.getByText(/verified|log in/i)).toBeVisible();
  await page.getByRole("button", { name: "Log In" }).click();
  await page.waitForURL("/", { timeout: 20_000 });
}

async function login(page: Page, email: string, pass: string) {
  await page.goto("/auth", { waitUntil: "networkidle" });
  await switchToLogin(page);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(pass);
  await page.getByRole("button", { name: "Log In" }).click();
  await page.waitForURL("/", { timeout: 20_000 });
}

async function createJournalReflection(page: Page, text: string) {
  await page.getByPlaceholder("What is weighing on you right now?").fill(text);
  await page.getByRole("button", { name: "Focus" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
}

async function simulateAnalysisApiFailure(page: Page) {
  await page.goto("/journal", { waitUntil: "networkidle" });
  await page.route("**/analysis/quick", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "E2E_FORCED_FAILURE",
          message: "Forced E2E failure",
          requestId: `e2e-${runId}`,
        },
      }),
    }),
  );
  await page.getByPlaceholder("What is weighing on you right now?").fill(`Forced API failure ${runId}`);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText(/could not prepare your emotional insight/i)).toBeVisible();
  await page.unroute("**/analysis/quick");
}

async function logout(page: Page) {
  await page.goto("/profile", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/auth/);
}

async function clearFrontendSession(page: Page) {
  await page.evaluate(() => {
    window.localStorage.removeItem("innerpause-aws-access-token");
    window.localStorage.removeItem("innerpause-aws-id-token");
    window.localStorage.removeItem("innerpause-aws-refresh-token");
    window.localStorage.removeItem("innerpause-aws-token-expires-at");
    window.localStorage.removeItem("innerpause-aws-profile");
    window.localStorage.removeItem("innerpause-current-user-id");
  });
}

async function assertJournalTextInLocalStorage(page: Page, text: string) {
  const found = await page.evaluate((needle) => {
    return Object.entries(window.localStorage).some(([key, value]) => key.startsWith("chakra-healing-mvp") && value.includes(needle));
  }, text);
  expect(found).toBe(true);
}

async function assertJournalTextAbsentFromLocalStorage(page: Page, text: string) {
  const found = await page.evaluate((needle) => {
    return Object.entries(window.localStorage).some(([key, value]) => key.startsWith("chakra-healing-mvp") && value.includes(needle));
  }, text);
  expect(found).toBe(false);
}

async function expectNoHorizontalScroll(page: Page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  expect(metrics.scrollWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(metrics.bodyScrollWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

function uniqueEmail(email: string | undefined, id: string, suffix: string) {
  const fallback = `innerpause-e2e-${suffix}@example.com`;
  const source = email || fallback;
  const at = source.lastIndexOf("@");
  if (at < 1) return source;
  return `${source.slice(0, at)}+${id}-${suffix}${source.slice(at)}`;
}

function createEphemeralPassword() {
  return `Tmp-${Date.now()}-${Math.random().toString(36).slice(2)}!Aa1`;
}
