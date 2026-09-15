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

test('offline external-content failure falls back to local learning modes',async({page})=>{
  await cleanStart(page);
  await seedReviewedCard(page);
  const target=await page.evaluate(()=>{
    const deck=JSON.parse(localStorage.getItem('kanji5-deck')||'[]');
    const ids=new Set(Object.keys(JSON.parse(localStorage.getItem('kanji5-v1-cards')||'{}')));
    return deck.find(item=>item?.id&&ids.has(item.id))?.character||'';
  });
  expect(target).toBeTruthy();
  await page.evaluate(async()=>{await import('./v1.5-network.js');await import('./v1.9-data-quality-core.js')});
  await page.context().setOffline(true);
  const result=await page.evaluate(async(character)=>{
    const network=await import('./v1.5-network.js');
    const quality=await import('./v1.9-data-quality-core.js');
    const words=await network.fetchWords(character);
    const contexts=await network.fetchContextSentences(character);
    return {words,contexts,vocabularyFallback:quality.safeContentFallback(['vocabulary'],['meaning','reading','production']),contextFallback:quality.safeContentFallback(['context'],['meaning','reading','production'])};
  },target);
  expect(result.words).toEqual([]);expect(result.contexts).toEqual([]);
  expect(result.vocabularyFallback).toMatch(/meaning|reading|production/);expect(result.contextFallback).toMatch(/meaning|reading|production/);
});

test('offline local grading remains available after remote content failure',async({page})=>{
  await cleanStart(page);await seedReviewedCard(page);
  await page.evaluate(async()=>{await import('./v1.8-production-core.js');await import('./v1.9-outcome-core.js')});
  await page.context().setOffline(true);
  const result=await page.evaluate(async()=>{
    const core=await import('./v1.8-production-core.js');
    const outcome=await import('./v1.9-outcome-core.js');
    const grade=core.gradeProduction('学','学');
    return outcome.normalizeOutcome('production',grade,{graderVersion:'offline-test'});
  });
  expect(result.outcome).toBe('correct');expect(result.graderVersion).toBe('offline-test');
});

test('legacy v1.9 evidence receives deterministic migration defaults',async({page})=>{
  await page.goto('/');
  await page.evaluate(()=>{localStorage.setItem('kanji5-v1.5-components',JSON.stringify({v19LearnerModel:{kanji:{}},v19LearnerEvidence:{学:[{mode:'meaning',correct:false,quality:'unknown'}]}}))});
  await page.reload();
  await expect(page.locator('#app')).toBeVisible({timeout:20000});
  await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('kanji5-v1.5-components')||'{}').v19LearnerEvidence?.学?.[0]?.outcome)).toBe('unknown');
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('kanji5-v1.5-components')||'{}'));
  expect(state.v19LearnerModel.version).toBe('1.9.0-learner-model');expect(state.v19LearnerEvidence.学[0].graderVersion).toBe('legacy-unversioned');expect(state.v19LearnerEvidence.学[0].recoveryAttempt).toBe(0);
});
