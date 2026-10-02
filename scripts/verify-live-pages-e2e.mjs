import { chromium } from '@playwright/test';

const baseUrl = String(process.env.KANJI5_LIVE_URL || 'https://ardkam.github.io/kanji5').replace(/\/$/, '');

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  try {
    const page = await context.newPage();
    await page.goto(baseUrl + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('#root .app-shell').waitFor({ state: 'visible', timeout: 30000 });
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) {
      throw new Error('LIVE_OFFLINE_GATE_NO_SERVICE_WORKER_CONTROLLER');
    }
    const cached = await page.evaluate(async () => {
      const paths = ['./index.html', './app-bootstrap.js', './react-entry.js', './react-dist/kanji5-react.js', './react-dist/kanji5-react.css'];
      const result = {};
      for (const path of paths) {
        result[path] = Boolean(await caches.match(new URL(path, location.href).href));
      }
      return result;
    });
    if (!Object.values(cached).every(Boolean)) {
      throw new Error('LIVE_OFFLINE_GATE_MISSING_CACHE_ENTRY: ' + JSON.stringify(cached));
    }

    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('#root .app-shell').waitFor({ state: 'visible', timeout: 30000 });
    await page.locator('#root .daily-summary').waitFor({ state: 'visible', timeout: 10000 });
    console.log('LIVE_PAGES_OFFLINE_E2E_VERIFIED');
  } finally {
    await context.close();
  }
} finally {
  await browser.close();
}
