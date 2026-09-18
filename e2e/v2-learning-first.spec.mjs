import {test,expect} from '@playwright/test';

test('first-time learner sees the learning card before exercises',async({page})=>{
  await page.goto('/?legacy=1');
  await page.evaluate(()=>{
    for(const key of Object.keys(localStorage)) if(key.startsWith('kanji5-')) localStorage.removeItem(key);
    sessionStorage.clear();
  });
  await page.reload();
  await expect(page.locator('#app')).toBeVisible({timeout:20000});

  await page.goto('/');
  await expect(page.locator('#v2App')).toBeVisible({timeout:20000});
  await expect.poll(async()=>page.evaluate(()=>Boolean(window.__KANJI5_V19_V2_BOUNDARY__&&window.__KANJI5_EDU_BRIDGE__))).toBe(true);

  await expect(page.locator('#v2LearningCard')).toBeVisible({timeout:10000});
  await expect(page.locator('#v2LearningKanji')).toHaveText(/\S/);
  await expect(page.locator('#v2LearningReveal')).toBeVisible();
  await expect(page.locator('#v2AnswerInput')).toBeHidden();
  const first=await page.locator('#v2LearningKanji').textContent();

  await page.locator('#v2LearningReveal').click();
  await expect(page.locator('.v2-learning-meanings')).toBeVisible({timeout:10000});
  await expect(page.locator('.v2-learning-readings')).toBeVisible();
  await expect(page.locator('.v2-learning-ratings')).toBeVisible();

  await page.locator('button[data-rating="Good"]').click();
  await expect(page.locator('#v2LearningCard')).toBeVisible({timeout:10000});
  await expect(page.locator('#v2LearningKanji')).not.toHaveText(first||'');

  await page.evaluate(()=>{
    window.__KANJI5_V16_SESSION_AUTH__={nextMode:()=> 'production',consumeMode:()=>{}};
  });
  await page.locator('#v2StartPractice').click();
  await expect.poll(async()=>page.evaluate(()=>Boolean(window.__KANJI5_V16_SESSION_API__?.getSession?.().started))).toBe(true);
  await expect.poll(async()=>page.evaluate(()=>{
    const history=JSON.parse(localStorage.getItem('kanji5-v1.6-session-history')||'[]');
    return history.some(row=>row?.status==='active');
  })).toBe(true);
  await expect(page.locator('#v2ProductionChoices')).toBeVisible({timeout:10000});
  await expect(page.locator('.v2-production-choice')).toHaveCount(4);
});
