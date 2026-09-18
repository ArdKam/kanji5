import {test,expect} from '@playwright/test';

test('v2 boundary exposes stable structured view models without exposing persistence internals',async({page})=>{
  await page.goto('/');
  await expect(page.locator('#app')).toBeVisible({timeout:20000});
  await expect.poll(async()=>page.evaluate(async()=>{await import('./v1.9-v2-boundary.js');return Boolean(window.__KANJI5_V19_V2_BOUNDARY__)})).toBe(true);
  const snapshot=await page.evaluate(async()=>{
    const boundary=window.__KANJI5_V19_V2_BOUNDARY__;
    await boundary.setExercise({mode:'production',prompt:'Write the Kanji',character:'学',contentId:'fixture-1',provenance:'local'});
    await boundary.setFeedback({mode:'production',outcome:'wrong',correct:false,score:0,graderVersion:'1.9.0-production',reason:'expected target: 学'});
    await boundary.setAdaptiveReason({mode:'production',action:'repair',reasons:['recent failure'],score:4});
    return await boundary.snapshot();
  });
  expect(snapshot.contractVersion).toBe('1.9.0-v2-boundary-contract');
  expect(snapshot.session.kind).toBe('session');
  expect(snapshot.exercise).toMatchObject({kind:'exercise',mode:'production',character:'学'});
  expect(snapshot.feedback).toMatchObject({kind:'feedback',outcome:'wrong',graderVersion:'1.9.0-production'});
  expect(snapshot.adaptiveReason).toMatchObject({kind:'adaptive-reason',mode:'production',action:'repair'});
  expect(snapshot.learner.kind).toBe('learner-skill-summary');
  expect(snapshot.sessionSummary.kind).toBe('session-summary');
  expect(snapshot.session.rawStorage).toBeUndefined();
  expect(snapshot.learner.rawStorage).toBeUndefined();
});
