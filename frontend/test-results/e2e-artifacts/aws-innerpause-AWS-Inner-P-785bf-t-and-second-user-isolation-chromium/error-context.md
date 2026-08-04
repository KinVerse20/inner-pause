# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: aws-innerpause.spec.ts >> AWS Inner Pause live E2E >> signup, verification, login, journal persistence, logout and second-user isolation
- Location: e2e/aws-innerpause.spec.ts:50:3

# Error details

```
Error: AWS frontend is missing NEXT_PUBLIC_API_BASE_URL, so Cognito signup cannot start.
```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - main [ref=f1e3]:
    - generic [ref=f1e4]:
      - link "The Inner Pause home" [ref=f1e5] [cursor=pointer]:
        - /url: /
        - generic [ref=f1e7]:
          - generic [ref=f1e8]: The Inner Pause
          - generic [ref=f1e9]: Pause and reset
      - generic [ref=f1e10]:
        - heading "Welcome" [level=1] [ref=f1e11]
        - paragraph [ref=f1e12]: Sign in to keep your Inner Pause reflections and reset sessions connected to your account.
      - generic [ref=f1e13]:
        - generic [ref=f1e14]:
          - text: Full name
          - textbox "Full name" [ref=f1e15]: InnerPause E2E A
        - generic [ref=f1e16]:
          - text: Email
          - textbox "Email" [ref=f1e17]: innerpause-e2e+1785836215068-8020c8-a@example.com
        - generic [ref=f1e18]:
          - text: Password
          - textbox "Password" [ref=f1e19]: Tmp-1785836210952-e9z23sapzhc!Aa1
        - paragraph [ref=f1e20]: NEXT_PUBLIC_API_BASE_URL is required for the separated frontend.
        - button "Create Account" [ref=f1e21]
        - button "Resend verification email" [ref=f1e22]
        - generic [ref=f1e23]:
          - button "I already have an account" [ref=f1e24]
          - button "Forgot password?" [ref=f1e25]
          - button "Continue with Google" [ref=f1e26]
          - button "Continue with Apple" [ref=f1e27]
  - alert [ref=f1e28]
```

# Test source

```ts
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
> 132 |     throw new Error("AWS frontend is missing NEXT_PUBLIC_API_BASE_URL, so Cognito signup cannot start.");
      |           ^ Error: AWS frontend is missing NEXT_PUBLIC_API_BASE_URL, so Cognito signup cannot start.
  133 |   }
  134 |   await expect(page.getByText(/check your email|verification code/i)).toBeVisible();
  135 | }
  136 | 
  137 | async function verifyAndLogin(page: Page, email: string, pass: string, code: string) {
  138 |   await switchToLogin(page);
  139 |   await page.getByLabel("Email").fill(email);
  140 |   await page.getByLabel("Password").fill(pass);
  141 |   await page.getByLabel("Verification code").fill(code);
  142 |   await page.getByRole("button", { name: "Verify account" }).click();
  143 |   await expect(page.getByText(/verified|log in/i)).toBeVisible();
  144 |   await page.getByRole("button", { name: "Log In" }).click();
  145 |   await page.waitForURL("/", { timeout: 20_000 });
  146 | }
  147 | 
  148 | async function login(page: Page, email: string, pass: string) {
  149 |   await page.goto("/auth", { waitUntil: "networkidle" });
  150 |   await switchToLogin(page);
  151 |   await page.getByLabel("Email").fill(email);
  152 |   await page.getByLabel("Password").fill(pass);
  153 |   await page.getByRole("button", { name: "Log In" }).click();
  154 |   await page.waitForURL("/", { timeout: 20_000 });
  155 | }
  156 | 
  157 | async function createJournalReflection(page: Page, text: string) {
  158 |   await page.getByPlaceholder("What is weighing on you right now?").fill(text);
  159 |   await page.getByRole("button", { name: "Focus" }).click();
  160 |   await page.getByRole("button", { name: "Continue" }).click();
  161 | }
  162 | 
  163 | async function simulateAnalysisApiFailure(page: Page) {
  164 |   await page.goto("/journal", { waitUntil: "networkidle" });
  165 |   await page.route("**/analysis/quick", (route) =>
  166 |     route.fulfill({
  167 |       status: 500,
  168 |       contentType: "application/json",
  169 |       body: JSON.stringify({
  170 |         error: {
  171 |           code: "E2E_FORCED_FAILURE",
  172 |           message: "Forced E2E failure",
  173 |           requestId: `e2e-${runId}`,
  174 |         },
  175 |       }),
  176 |     }),
  177 |   );
  178 |   await page.getByPlaceholder("What is weighing on you right now?").fill(`Forced API failure ${runId}`);
  179 |   await page.getByRole("button", { name: "Continue" }).click();
  180 |   await expect(page.getByText(/could not prepare your emotional insight/i)).toBeVisible();
  181 |   await page.unroute("**/analysis/quick");
  182 | }
  183 | 
  184 | async function logout(page: Page) {
  185 |   await page.goto("/profile", { waitUntil: "networkidle" });
  186 |   await page.getByRole("button", { name: /sign out/i }).click();
  187 |   await expect(page).toHaveURL(/\/auth/);
  188 | }
  189 | 
  190 | async function clearFrontendSession(page: Page) {
  191 |   await page.evaluate(() => {
  192 |     window.localStorage.removeItem("innerpause-aws-access-token");
  193 |     window.localStorage.removeItem("innerpause-aws-id-token");
  194 |     window.localStorage.removeItem("innerpause-aws-refresh-token");
  195 |     window.localStorage.removeItem("innerpause-aws-token-expires-at");
  196 |     window.localStorage.removeItem("innerpause-aws-profile");
  197 |     window.localStorage.removeItem("innerpause-current-user-id");
  198 |   });
  199 | }
  200 | 
  201 | async function assertJournalTextInLocalStorage(page: Page, text: string) {
  202 |   const found = await page.evaluate((needle) => {
  203 |     return Object.entries(window.localStorage).some(([key, value]) => key.startsWith("chakra-healing-mvp") && value.includes(needle));
  204 |   }, text);
  205 |   expect(found).toBe(true);
  206 | }
  207 | 
  208 | async function assertJournalTextAbsentFromLocalStorage(page: Page, text: string) {
  209 |   const found = await page.evaluate((needle) => {
  210 |     return Object.entries(window.localStorage).some(([key, value]) => key.startsWith("chakra-healing-mvp") && value.includes(needle));
  211 |   }, text);
  212 |   expect(found).toBe(false);
  213 | }
  214 | 
  215 | async function expectNoHorizontalScroll(page: Page) {
  216 |   const metrics = await page.evaluate(() => ({
  217 |     scrollWidth: document.documentElement.scrollWidth,
  218 |     clientWidth: document.documentElement.clientWidth,
  219 |     bodyScrollWidth: document.body.scrollWidth,
  220 |   }));
  221 |   expect(metrics.scrollWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.clientWidth + 1);
  222 |   expect(metrics.bodyScrollWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.clientWidth + 1);
  223 | }
  224 | 
  225 | function uniqueEmail(email: string | undefined, id: string, suffix: string) {
  226 |   const fallback = `innerpause-e2e-${suffix}@example.com`;
  227 |   const source = email || fallback;
  228 |   const at = source.lastIndexOf("@");
  229 |   if (at < 1) return source;
  230 |   return `${source.slice(0, at)}+${id}-${suffix}${source.slice(at)}`;
  231 | }
  232 | 
```