import { test, expect } from '@playwright/test';

async function cleanStart(page){
  await page.goto('/');
  await page.evaluate(()=>{for(const key of Object.keys(localStorage))if(key.startsWith('kanji5-'))localStorage.removeItem(key);sessionStorage.clear();localStorage.setItem('kanji5-onboarding-v2','complete')});
  await page.reload();
  await expect(page.locator('#root .app-shell')).toBeVisible({timeout:20000});
}

async function boundarySubset(page){
  return page.evaluate(async()=>{
    const snapshot=await window.__KANJI5_V19_V2_BOUNDARY__.snapshot();
    return {dailySummary:snapshot.dailySummary,dailyGoal:snapshot.dailyGoal,learning:{
      active:snapshot.learning?.active,isNew:snapshot.learning?.isNew,character:snapshot.learning?.character,
      meanings:snapshot.learning?.meanings,on:snapshot.learning?.on,kun:snapshot.learning?.kun,examples:snapshot.learning?.examples
    },settings:snapshot.settings,stats:snapshot.stats};
  });
}

test('React consumes the authoritative v1.9 presentation snapshot',async({page})=>{
  await cleanStart(page);
  const snapshot=await boundarySubset(page);
  await expect(page.locator('#root .kanji-display')).toHaveText(snapshot.learning.character||'');
  await expect(page.locator('#root .daily-summary')).toBeVisible();
  expect(snapshot.dailySummary).toBeTruthy();
  expect(snapshot.dailyGoal).toBeTruthy();
  expect(snapshot.settings).toBeTruthy();
});

test('React presentation does not expose a second DOM renderer',async({page})=>{
  await cleanStart(page);
  await expect(page.locator('#v2App, .wrap, #app, #loading')).toHaveCount(0);
});

test('Learning keeps session feedback compact and does not render analytics details',async({page})=>{
  await cleanStart(page);
  await expect(page.locator('#root .insights')).toHaveCount(0);
  await expect(page.locator('#root .session-feedback')).toHaveCount(0);
  const card=page.locator('#root .learning-card');
  await card.getByRole('button',{name:'نمایش اطلاعات کانجی'}).click();
  await expect(card).toHaveClass(/is-revealed/,{timeout:10000});
  await page.waitForTimeout(520);
  const rating=card.locator('.rating-grid button').nth(2);
  await expect(rating).toBeEnabled({timeout:10000});
  await rating.click();
  await expect.poll(async()=>page.locator('#root .session-feedback').isVisible().catch(()=>false) || await page.evaluate(async()=>Number((await window.__KANJI5_V19_V2_BOUNDARY__?.snapshot?.())?.sessionSummary?.attempts??0)>0),{timeout:10000}).toBe(true);
  await expect(page.locator('#root .insights')).toHaveCount(0);
});