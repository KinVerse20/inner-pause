import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.INNERPAUSE_AWS_APP_URL;

if (!baseURL) {
  throw new Error("INNERPAUSE_AWS_APP_URL is required. Use the AWS Amplify test app URL only.");
}

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results/e2e-artifacts",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "test-results/e2e-results.json" }],
  ],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
