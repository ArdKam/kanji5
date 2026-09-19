import { test, expect } from '@playwright/test';

async function cleanStart(page){
  await page.goto('/?legacy=1');
  await page.evaluate(()=>{
    for(const key of Object.keys(localStorage)) if(key.startsWith('kanji5-')) localStorage.removeItem(key);
    sessionStorage.clear();
  });
  await page.reload();
  await expect(page.locator('#app')).toBeVisible({timeout:20000});
}

async function boundarySubset(page){
  return page.evaluate(async()=>{
    const snapshot=await window.__KANJI5_V19_V2_BOUNDARY__.snapshot();
    return {
      dailySummary:snapshot.dailySummary,
      dailyGoal:snapshot.dailyGoal,
      learning:{
        active:snapshot.learning?.active,
        isNew:snapshot.learning?.isNew,
        character:snapshot.learning?.character,
        meanings:snapshot.learning?.meanings,
        on:snapshot.learning?.on,
        kun:snapshot.learning?.kun,
        examples:snapshot.learning?.examples
      },
      settings:snapshot.settings,
      stats:snapshot.stats
    };
  });
}

test('React and current v2 consume the same authoritative presentation snapshot',async({page})=>{
  await cleanStart(page);
  await page.goto('/');
  await expect(page.locator('#v2App')).toBeVisible({timeout:20000});
  await expect.poll(async()=>page.evaluate(()=>Boolean(window.__KANJI5_V19_V2_BOUNDARY__))).toBe(true);
  const v2Snapshot=await boundarySubset(page);
  await page.goto('/?react=1');
  await expect(page.locator('#root .app-shell')).toBeVisible({timeout:20000});
  const reactSnapshot=await boundarySubset(page);
  expect(reactSnapshot).toEqual(v2Snapshot);
  await expect(page.locator('#root .kanji-display')).toHaveText(v2Snapshot.learning.character || '');
});
