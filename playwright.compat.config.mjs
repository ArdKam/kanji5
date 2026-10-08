import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'line' : 'html',
  use: { baseURL },
  outputDir: 'test-results/compat',
  projects: [
    { name: 'firefox', use: { browserName: 'firefox', serviceWorkers: 'allow' } },
    { name: 'webkit', use: { browserName: 'webkit', serviceWorkers: 'allow' } },
  ],
  webServer: {
    command: 'KANJI5_COMPAT_HTTP=1 node scripts/serve-static.mjs 4173',
    url: `${baseURL}/`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
