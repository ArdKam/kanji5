import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'allow' });

test('PWA shell survives offline reload and preserves local learning state', async ({ page, context })=>{
  await page.addInitScript(() => localStorage.setItem('kanji5-onboarding-v2','complete'));
  await page.goto('/');
  await expect(page.locator('#root .app-shell')).toBeVisible({timeout:20000});
  await page.evaluate(async ()=>{
    await navigator.serviceWorker.ready;
    localStorage.setItem('kanji5-pwa-smoke-marker','persisted');
  });
  await expect.poll(async()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);

  const manifest=await page.evaluate(async()=>{
    const response=await fetch('./manifest.webmanifest');
    if(!response.ok)throw new Error('PWA_MANIFEST_UNAVAILABLE:'+response.status);
    return response.json();
  });
  expect(manifest.display).toBe('standalone');
  expect(manifest.start_url).toBe('./');
  expect(manifest.scope).toBe('./');
  expect(manifest.id).toBe('./');
  expect(manifest.icons?.length).toBeGreaterThan(0);
  expect(manifest.icons.every(icon=>String(icon.purpose||'').split(/\\s+/).includes('any'))).toBe(true);
  expect(manifest.icons.map(icon=>icon.sizes)).toEqual(expect.arrayContaining(['192x192','512x512']));
  const iconResponses=await page.evaluate(async icons=>Promise.all(icons.map(async icon=>{
    const response=await fetch(new URL(icon.src,location.href));
    return {src:icon.src,status:response.status,contentType:response.headers.get('content-type')||''};
  })),manifest.icons);
  expect(iconResponses.every(icon=>icon.status===200),JSON.stringify(iconResponses)).toBe(true);
  expect(iconResponses.every(icon=>icon.contentType.includes('image/svg+xml')),JSON.stringify(iconResponses)).toBe(true);

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
