import {test,expect} from '@playwright/test';

test('evaluates persisted learner evidence without mutating learner state',async({page})=>{
  await page.goto('/');
  await expect(page.locator('#loading')).toBeHidden({timeout:20000});
  await page.evaluate(()=>{
    const at='2026-09-15T00:00:00.000Z';
    localStorage.setItem('kanji5-v1.6-session-history',JSON.stringify([{sessionId:'ev1',endedAt:at,modeResults:{meaning:{attempts:2,correct:1,lastCorrect:false},reading:{attempts:1,correct:1,lastCorrect:true}}}]));
    localStorage.setItem('kanji5-v1.5-components',JSON.stringify({v19LearnerEvidence:{学:[{at:'2026-09-14T00:00:00.000Z',mode:'meaning',outcome:'wrong'},{at:'2026-09-15T00:00:00.000Z',mode:'meaning',outcome:'correct'}]}}));
  });
  const before=await page.evaluate(()=>({history:localStorage.getItem('kanji5-v1.6-session-history'),components:localStorage.getItem('kanji5-v1.5-components')}));
  const result=await page.evaluate(async()=>{await import('./v1.9-learning-evaluation.js');const report=await window.__KANJI5_V19_EVALUATION__.evaluate({generatedAt:'fixed'});const baseline=await window.__KANJI5_V19_EVALUATION__.baseline({availableModes:['meaning','reading'],budget:5});return{unknownRate:report.unknownRate,recoveryRate:report.recoveryRate,attempts:report.totalAttempts,baseline:baseline.modes}});
  expect(result.unknownRate).toBe(0);expect(result.recoveryRate).toBe(1);expect(result.attempts).toBe(3);expect(result.baseline).toEqual(['meaning','reading','meaning','reading','meaning']);
  const after=await page.evaluate(()=>({history:localStorage.getItem('kanji5-v1.6-session-history'),components:localStorage.getItem('kanji5-v1.5-components')}));
  expect(after).toEqual(before);
});
