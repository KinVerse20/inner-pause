import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', testMatch: ['revised-flow.spec.ts', 'local-sign-in.spec.ts'], timeout: 30000,
  outputDir: './test-results/revised', reporter: 'list',
  use: { baseURL: 'http://localhost:3011', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
});
