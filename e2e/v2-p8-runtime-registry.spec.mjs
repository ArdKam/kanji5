import {test,expect} from '@playwright/test';

test('v2 runtime APIs are available through the central registry',async({page})=>{
  await page.goto('/');
  await expect(page.locator('#v2App')).toBeVisible({timeout:20000});
  await expect.poll(async()=>page.evaluate(()=>{
    const r=window.__KANJI5_RUNTIME__;
    return Boolean(r&&[
      'state',
      'education.core',
      'education.bridge',
      'session.api',
      'learner.model',
      'review.runtime',
      'review.bridge',
      'v2.boundary',
      'recall.open'
    ].every(key=>r.has(key)));
  }),{timeout:20000}).toBe(true);
  await expect.poll(async()=>page.evaluate(()=>{
    const r=window.__KANJI5_RUNTIME__;
    return Boolean(
      r.get('state')===window.__KANJI5_STATE__ &&
      r.get('education.core')===window.__KANJI5_EDU_CORE__ &&
      r.get('session.api')===window.__KANJI5_V16_SESSION_API__ &&
      r.get('v2.boundary')===window.__KANJI5_V19_V2_BOUNDARY__
    );
  }),{timeout:10000}).toBe(true);
});
