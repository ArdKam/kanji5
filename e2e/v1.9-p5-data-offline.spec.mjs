import {test,expect} from '@playwright/test';

async function cleanStart(page){
  await page.goto('/');
  await page.evaluate(()=>{for(const key of Object.keys(localStorage))if(key.startsWith('kanji5-'))localStorage.removeItem(key);sessionStorage.clear()});
  await page.reload();
  await expect(page.locator('#app')).toBeVisible({timeout:20000});
  await expect(page.locator('#v16Start')).toBeVisible();
}

async function seedReviewedCard(page){
  await page.locator('#revealBtn').click();
  await expect(page.locator('#ratings')).toHaveClass(/show/);
  await page.locator('.rate[data-r="Good"]').click();
  await expect(page.locator('#revealBtn')).toBeVisible();
}

async function startReview(page){
  await page.locator('#v16Start').click();
  await expect(page.locator('#v16FinishExternal')).toBeVisible();
  await page.locator('#v16DashboardToggle').click();
  await expect(page.locator('#v16Session')).toBeVisible();
}

async function forceMode(page,mode){
  await page.evaluate(async(mode)=>{
    await import('./v1.6-session-feedback.js');
    window.__KANJI5_V16_SESSION_AUTH__={nextMode:()=>mode,consumeMode:()=>{}};
  },mode);
}

test('offline vocabulary failure deterministically falls back to a local core mode',async({page})=>{
  await cleanStart(page);await seedReviewedCard(page);await startReview(page);await forceMode(page,'vocabulary');
  await page.context().setOffline(true);
  await page.locator('[data-tab="education"]').click();
  const pane=page.locator('#v14EducationPane');
  await expect(pane.locator('#v14EduInput')).toBeVisible({timeout:10000});
  await expect(pane.locator('.v14-edu-meta')).not.toContainText('vocabulary');
  const mode=await pane.locator('.v14-edu-meta').textContent();
  expect(mode).toMatch(/meaning|reading|production/);
  await pane.locator('#v14EduInput').fill(mode.includes('reading')?'gaku':'school');
  await pane.locator('#v14EduSubmit').click();
  await expect(pane.locator('.v14-edu-title')).toBeVisible();
});

test('offline context failure deterministically falls back to a local core mode',async({page})=>{
  await cleanStart(page);await seedReviewedCard(page);await startReview(page);await forceMode(page,'context');
  await page.context().setOffline(true);
  await page.locator('[data-tab="education"]').click();
  const pane=page.locator('#v14EducationPane');
  await expect(pane.locator('#v14EduInput')).toBeVisible({timeout:10000});
  await expect(pane.locator('.v14-edu-meta')).not.toContainText('context');
  const meta=await pane.locator('.v14-edu-meta').textContent();
  expect(meta).toMatch(/meaning|reading|production/);
});

test('legacy v1.9 evidence receives deterministic migration defaults',async({page})=>{
  await page.goto('/');
  await page.evaluate(()=>{
    localStorage.setItem('kanji5-v1.5-components',JSON.stringify({v19LearnerModel:{kanji:{}},v19LearnerEvidence:{学:[{mode:'meaning',correct:false,quality:'unknown'}]}}));
  });
  await page.reload();
  await expect(page.locator('#app')).toBeVisible({timeout:20000});
  await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('kanji5-v1.5-components')||'{}').v19LearnerEvidence?.学?.[0]?.outcome)).toBe('unknown');
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('kanji5-v1.5-components')||'{}'));
  expect(state.v19LearnerModel.version).toBe('1.9.0-learner-model');
  expect(state.v19LearnerEvidence.学[0].graderVersion).toBe('legacy-unversioned');
  expect(state.v19LearnerEvidence.学[0].recoveryAttempt).toBe(0);
});
