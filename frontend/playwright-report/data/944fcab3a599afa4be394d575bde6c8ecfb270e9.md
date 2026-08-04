# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: aws-innerpause.spec.ts >> AWS Inner Pause live E2E >> homepage loads and mobile layouts have no horizontal scrolling
- Location: e2e/aws-innerpause.spec.ts:16:3

# Error details

```
Error: Browser errors: NEXT_PUBLIC_API_BASE_URL is required for the separated frontend.
NEXT_PUBLIC_API_BASE_URL is required for the separated frontend.
NEXT_PUBLIC_API_BASE_URL is required for the separated frontend.
NEXT_PUBLIC_API_BASE_URL is required for the separated frontend.

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 6

- Array []
+ Array [
+   "NEXT_PUBLIC_API_BASE_URL is required for the separated frontend.",
+   "NEXT_PUBLIC_API_BASE_URL is required for the separated frontend.",
+   "NEXT_PUBLIC_API_BASE_URL is required for the separated frontend.",
+   "NEXT_PUBLIC_API_BASE_URL is required for the separated frontend.",
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=f3e1]:
  - main [ref=f3e3]:
    - generic [ref=f3e4]:
      - link "The Inner Pause home" [ref=f3e5] [cursor=pointer]:
        - /url: /
        - generic [ref=f3e7]:
          - generic [ref=f3e8]: The Inner Pause
          - generic [ref=f3e9]: Pause and reset
      - generic [ref=f3e10]:
        - heading "Welcome" [level=1] [ref=f3e11]
        - paragraph [ref=f3e12]: Sign in to keep your Inner Pause reflections and reset sessions connected to your account.
      - generic [ref=f3e13]:
        - generic [ref=f3e14]:
          - text: Full name
          - textbox "Full name" [ref=f3e15]
        - generic [ref=f3e16]:
          - text: Email
          - textbox "Email" [ref=f3e17]
        - generic [ref=f3e18]:
          - text: Password
          - textbox "Password" [ref=f3e19]
        - button "Create Account" [ref=f3e20]
        - button "Resend verification email" [ref=f3e21]
        - generic [ref=f3e22]:
          - button "I already have an account" [ref=f3e23]
          - button "Forgot password?" [ref=f3e24]
          - button "Continue with Google" [ref=f3e25]
          - button "Continue with Apple" [ref=f3e26]
  - alert [ref=f3e27]
```

# Test source

```ts
  1   | import { expect, test, type Page } from "@playwright/test";
  2   | 
  3   | const runId = process.env.INNERPAUSE_E2E_RUN_ID ?? `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  4   | const baseEmail = process.env.INNERPAUSE_E2E_EMAIL;
  5   | const baseEmailB = process.env.INNERPAUSE_E2E_EMAIL_B;
  6   | const password = process.env.INNERPAUSE_E2E_PASSWORD ?? createEphemeralPassword();
  7   | const passwordB = process.env.INNERPAUSE_E2E_PASSWORD_B ?? createEphemeralPassword();
  8   | const verificationCode = process.env.INNERPAUSE_E2E_VERIFICATION_CODE;
  9   | const verificationCodeB = process.env.INNERPAUSE_E2E_VERIFICATION_CODE_B;
  10  | 
  11  | const userAEmail = uniqueEmail(baseEmail, runId, "a");
  12  | const userBEmail = uniqueEmail(baseEmailB, runId, "b");
  13  | const uniqueJournalText = `InnerPause AWS E2E reflection ${runId}: I feel focused but slightly overwhelmed, and I want a calm reset.`;
  14  | 
  15  | test.describe("AWS Inner Pause live E2E", () => {
  16  |   test("homepage loads and mobile layouts have no horizontal scrolling", async ({ page }) => {
  17  |     const errors = collectBrowserErrors(page);
  18  | 
  19  |     for (const viewport of [
  20  |       { width: 375, height: 667 },
  21  |       { width: 390, height: 844 },
  22  |       { width: 430, height: 932 },
  23  |     ]) {
  24  |       await page.setViewportSize(viewport);
  25  |       await page.goto("/", { waitUntil: "networkidle" });
  26  |       await expect(page).toHaveTitle(/Inner Pause/i);
  27  |       await expect(page.getByText(/The Inner Pause|Good morning|Find Your Inner Balance|Welcome/i).first()).toBeVisible();
  28  |       await expectNoHorizontalScroll(page);
  29  |     }
  30  | 
> 31  |     expect(errors, `Browser errors: ${errors.join("\n")}`).toEqual([]);
      |                                                            ^ Error: Browser errors: NEXT_PUBLIC_API_BASE_URL is required for the separated frontend.
  32  |   });
  33  | 
  34  |   test("invalid login details show an error", async ({ page }) => {
  35  |     await page.goto("/auth", { waitUntil: "networkidle" });
  36  |     await switchToLogin(page);
  37  |     await page.getByLabel("Email").fill(uniqueEmail("invalid-login@example.com", runId, "invalid"));
  38  |     await page.getByLabel("Password").fill("WrongPassword-12345!");
  39  |     await page.getByRole("button", { name: "Log In" }).click();
  40  |     await expect(page.getByText(/NEXT_PUBLIC_API_BASE_URL|incorrect|not found|failed|authentication/i)).toBeVisible();
  41  |   });
  42  | 
  43  |   test("protected pages redirect to login when the browser session is missing", async ({ page }) => {
  44  |     await page.goto("/", { waitUntil: "domcontentloaded" });
  45  |     await clearFrontendSession(page);
  46  |     await page.goto("/journal", { waitUntil: "domcontentloaded" });
  47  |     await expect(page).toHaveURL(/\/auth\?redirectTo=%2Fjournal|\/auth/);
  48  |   });
  49  | 
  50  |   test("signup, verification, login, journal persistence, logout and second-user isolation", async ({ page }) => {
  51  |     await signUp(page, userAEmail, password, "InnerPause E2E A");
  52  | 
  53  |     if (!verificationCode) {
  54  |       throw new Error(
  55  |         [
  56  |           "Manual action required: Cognito signup reached email verification.",
  57  |           `Open the disposable inbox for ${userAEmail}, copy the verification code, then rerun with INNERPAUSE_E2E_VERIFICATION_CODE set.`,
  58  |           "No password or secret was written to source code.",
  59  |         ].join(" "),
  60  |       );
  61  |     }
  62  | 
  63  |     await verifyAndLogin(page, userAEmail, password, verificationCode);
  64  |     await expect(page).toHaveURL(/\/$/);
  65  | 
  66  |     await page.goto("/journal", { waitUntil: "networkidle" });
  67  |     await expect(page.getByRole("heading", { name: /Express/i })).toBeVisible();
  68  | 
  69  |     await createJournalReflection(page, uniqueJournalText);
  70  |     await expect(page).toHaveURL(/\/analysis\?entry=/);
  71  |     await expect(page.getByText(/Here is what I understood/i)).toBeVisible();
  72  | 
  73  |     await assertJournalTextInLocalStorage(page, uniqueJournalText);
  74  |     await page.reload({ waitUntil: "networkidle" });
  75  |     await assertJournalTextInLocalStorage(page, uniqueJournalText);
  76  | 
  77  |     await page.goto("/history", { waitUntil: "networkidle" });
  78  |     await expect(page.getByText(/Journey/i).first()).toBeVisible();
  79  |     await expect(page.getByText(/Based on what you shared|Here is what/i).first()).toBeVisible();
  80  | 
  81  |     await simulateAnalysisApiFailure(page);
  82  | 
  83  |     await logout(page);
  84  |     await page.goto("/journal", { waitUntil: "domcontentloaded" });
  85  |     await expect(page).toHaveURL(/\/auth/);
  86  | 
  87  |     await login(page, userAEmail, password);
  88  |     await assertJournalTextInLocalStorage(page, uniqueJournalText);
  89  | 
  90  |     await signUp(page, userBEmail, passwordB, "InnerPause E2E B");
  91  |     if (!verificationCodeB) {
  92  |       throw new Error(
  93  |         [
  94  |           "Manual action required for User B isolation test.",
  95  |           `Open the disposable inbox for ${userBEmail}, copy the verification code, then rerun with INNERPAUSE_E2E_VERIFICATION_CODE and INNERPAUSE_E2E_VERIFICATION_CODE_B set.`,
  96  |         ].join(" "),
  97  |       );
  98  |     }
  99  | 
  100 |     await verifyAndLogin(page, userBEmail, passwordB, verificationCodeB);
  101 |     await assertJournalTextAbsentFromLocalStorage(page, uniqueJournalText);
  102 |   });
  103 | });
  104 | 
  105 | function collectBrowserErrors(page: Page) {
  106 |   const errors: string[] = [];
  107 |   page.on("pageerror", (error) => errors.push(error.message));
  108 |   page.on("console", (message) => {
  109 |     if (message.type() === "error") errors.push(message.text());
  110 |   });
  111 |   return errors;
  112 | }
  113 | 
  114 | async function switchToLogin(page: Page) {
  115 |   const loginButton = page.getByRole("button", { name: "I already have an account" });
  116 |   if (await loginButton.isVisible().catch(() => false)) {
  117 |     await loginButton.click();
  118 |   }
  119 | }
  120 | 
  121 | async function signUp(page: Page, email: string, pass: string, fullName: string) {
  122 |   await page.goto("/auth", { waitUntil: "networkidle" });
  123 |   const createAccountSwitch = page.getByRole("button", { name: "Create an account" });
  124 |   if (await createAccountSwitch.isVisible().catch(() => false)) {
  125 |     await createAccountSwitch.click();
  126 |   }
  127 |   await page.getByLabel("Full name").fill(fullName);
  128 |   await page.getByLabel("Email").fill(email);
  129 |   await page.getByLabel("Password").fill(pass);
  130 |   await page.getByRole("button", { name: "Create Account" }).click();
  131 |   if (await page.getByText(/NEXT_PUBLIC_API_BASE_URL is required/i).isVisible().catch(() => false)) {
```