import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', testMatch: 'shared-preview.spec.ts', timeout: 180000,
  workers: 1, outputDir: './test-results/shared-preview', reporter: 'list',
  use: { baseURL: process.env.PREVIEW_TEST_URL || 'http://127.0.0.1:3012', actionTimeout: 30000, navigationTimeout: 30000, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
});
