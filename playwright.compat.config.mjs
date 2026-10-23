import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'line' : 'html',
  use: { baseURL: 'https://127.0.0.1:4173', ignoreHTTPSErrors: true },
  outputDir: 'test-results/compat',
  projects: [
    { name: 'firefox', use: { browserName: 'firefox', serviceWorkers: 'allow' } },
    { name: 'webkit', use: { browserName: 'webkit', serviceWorkers: 'block' } },
  ],
  webServer: {
    command: 'mkdir -p /tmp/kanji5-test-tls && openssl req -x509 -newkey rsa:2048 -nodes -keyout /tmp/kanji5-test-tls/key.pem -out /tmp/kanji5-test-tls/cert.pem -days 1 -subj "/CN=127.0.0.1" && KANJI5_TEST_TLS_KEY=/tmp/kanji5-test-tls/key.pem KANJI5_TEST_TLS_CERT=/tmp/kanji5-test-tls/cert.pem node scripts/serve-static-https.mjs 4173',
    port: 4173,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});