import {test,expect} from '@playwright/test';

test('routes next recall toward the weaker attribute without repeating unnecessarily',async({page})=>{
  await page.goto('/');
  await expect(page.locator('#loading')).toBeHidden({timeout:20_000});
  await page.evaluate(()=>{
    const at='2026-09-15T00:00:00.000Z';
    localStorage.setItem('kanji5-v1.6-session-history',JSON.stringify([{status:'active',schemaVersion:2,sessionId:'p2',startedAt:at,remainingModes:{meaning:2,reading:2,production:0,vocabulary:0,context:0},modeResults:{meaning:{attempts:1,correct:1,lastAt:at,lastCorrect:true},reading:{attempts:4,correct:1,lastAt:at,lastCorrect:false}}}]));
    localStorage.setItem('kanji5-v1.5-components',JSON.stringify({v19LearnerModel:{version:'1.9.0-learner-model',schemaVersion:1,sessions:4,attributes:{meaning:{state:'stable',accuracy:1,confidence:.8,attempts:6},reading:{state:'weak',accuracy:.25,confidence:.5,attempts:6,errorStreak:2,repeatedFailure:true},production:{state:'unseen',accuracy:0,confidence:0,attempts:0},vocabulary:{state:'unseen',accuracy:0,confidence:0,attempts:0},context:{state:'unseen',accuracy:0,confidence:0,attempts:0}}}}));
  });
  const result=await page.evaluate(async()=>{await import('./v1.9-learner-model.js');await new Promise(r=>setTimeout(r,0));return {installed:Boolean(window.__KANJI5_V19_ADAPTIVE_PLANNER_INSTALLED__),next:window.__KANJI5_V16_SESSION_AUTH__?.nextMode?.(['meaning','reading'])};});
  expect(result.installed).toBeTruthy();
  expect(result.next).toBe('reading');
});
