import {test,expect} from '@playwright/test';

test('builds, persists, and exposes learner model evidence',async({page})=>{
  await page.goto('/?legacy=1');
  await expect(page.locator('#loading')).toBeHidden({timeout:20_000});
  await page.evaluate(()=>{
    const at='2026-09-15T00:00:00.000Z';
    localStorage.setItem('kanji5-v1.6-session-history',JSON.stringify([
      {sessionId:'p1-a',endedAt:'2026-09-10T00:00:00.000Z',modeResults:{meaning:{attempts:2,correct:2,lastAt:at,lastCorrect:true},reading:{attempts:2,correct:0,lastAt:at,lastCorrect:false},production:{attempts:0},vocabulary:{attempts:0},context:{attempts:0}}},
      {sessionId:'p1-b',endedAt:'2026-09-11T00:00:00.000Z',modeResults:{meaning:{attempts:1,correct:1,lastAt:at,lastCorrect:true},reading:{attempts:1,correct:1,lastAt:at,lastCorrect:true},production:{attempts:0},vocabulary:{attempts:0},context:{attempts:0}}}
    ]));
    localStorage.setItem('kanji5-v1.2-knowledge',JSON.stringify({学:{exposedAt:at,meaning:{attempts:6,correct:6,lastAt:at,lastCorrect:true},reading:{attempts:3,correct:1,lastAt:at,lastOutcome:'wrong',lastCorrect:false},production:{attempts:0},vocabulary:{attempts:0},context:{attempts:0}}}));
    localStorage.setItem('kanji5-v1.5-components',JSON.stringify({v19LearnerEvidence:{学:[
      {at:'2026-09-12T00:00:00.000Z',mode:'reading',outcome:'wrong',taskId:'reading-1'},
      {at:'2026-09-13T00:00:00.000Z',mode:'reading',outcome:'correct',taskId:'reading-1',retryOf:'reading-1',recovery:true},
      {at:'2026-09-14T00:00:00.000Z',mode:'reading',outcome:'wrong',taskId:'reading-2'},
      {at:'2026-09-15T00:00:00.000Z',mode:'reading',outcome:'correct',taskId:'reading-2',retryOf:'reading-2',recovery:true}
    ]}}));
  });
  const result=await page.evaluate(async()=>{await import('./v1.9-learner-model.js');await window.__KANJI5_V19_LEARNER_MODEL__.update();const component=JSON.parse(localStorage.getItem('kanji5-v1.5-components')||'{}').v19LearnerModel;return {version:component?.version,sessions:component?.sessions,reading:component?.kanji?.学?.attributes?.reading?.state,meaning:component?.kanji?.学?.attributes?.meaning?.state,uncertainty:component?.kanji?.学?.attributes?.reading?.uncertaintyState,recoveries:component?.kanji?.学?.attributes?.reading?.recoveryCount};});
  expect(result.version).toBe('1.9.0-learner-model');
  expect(result.sessions).toBe(2);
  expect(result.reading).toBe('weak');
  expect(result.meaning).toBe('mastered');
  expect(result.uncertainty).toBe('low');
  expect(result.recoveries).toBe(2);
});
