import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'allow' });

test('PWA shell survives offline reload and preserves local learning state', async ({ page, context })=>{
  await page.goto('/');
  await expect(page.locator('#root .app-shell')).toBeVisible({timeout:20000});
  await page.evaluate(async ()=>{
    await navigator.serviceWorker.ready;
    localStorage.setItem('kanji5-pwa-smoke-marker','persisted');
  });
  await expect.poll(async()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);

  const manifest=await page.evaluate(async()=>fetch('./manifest.webmanifest').then(r=>r.json()));
  expect(manifest.display).toBe('standalone');
  expect(manifest.start_url).toBe('./');
  expect(manifest.icons?.length).toBeGreaterThan(0);

  const requiredCaches=await page.evaluate(async()=>{
    const required=['./index.html','./app-bootstrap.js','./react-entry.js','./react-dist/kanji5-react.js','./react-dist/kanji5-react.css','./v1.6-session.js','./v1.9-v2-boundary.js'];
    const checks={};
    for(const path of required) checks[path]=Boolean(await caches.match(new URL(path,location.href).href));
    return checks;
  });
  expect(Object.values(requiredCaches).every(Boolean)).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#root .app-shell')).toBeVisible({timeout:20000});
  await expect(page.locator('#root .daily-summary')).toBeVisible({timeout:10000});
  await expect.poll(async()=>page.evaluate(()=>localStorage.getItem('kanji5-pwa-smoke-marker'))).toBe('persisted');
});
