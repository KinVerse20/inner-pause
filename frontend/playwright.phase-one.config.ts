import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-phase-one',
  outputDir: './test-results/phase-one-artifacts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.PHASE_ONE_URL || 'http://127.0.0.1:3011',
    trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});

