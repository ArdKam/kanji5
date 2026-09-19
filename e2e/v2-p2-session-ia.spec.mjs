import {test,expect} from '@playwright/test';

test('v2 P2 session information architecture exposes progress and recent outcomes',async({page})=>{
  await page.goto('/?v2=1');
  await expect(page.locator('#v2App')).toBeVisible({timeout:20000});
  await expect.poll(async()=>page.evaluate(()=>Boolean(window.__KANJI5_V19_V2_BOUNDARY__))).toBe(true);
  await expect.poll(async()=>page.evaluate(()=>Boolean(window.__KANJI5_V2_PRESENTATION_READY__))).toBe(true);
  const snapshot=await page.evaluate(async()=>{
    const boundary=window.__KANJI5_V19_V2_BOUNDARY__;
    await boundary.setExercise({mode:'production',prompt:'Write the Kanji',character:'学',contentId:'fixture-1',provenance:'local'});
    await boundary.setFeedback({mode:'production',outcome:'wrong',correct:false,score:0,graderVersion:'1.9.0-production',reason:'recent failure'});
    await boundary.setAdaptiveReason({mode:'production',action:'repair',reasons:['recent failure'],score:4});
    return await boundary.snapshot();
  });
  expect(snapshot.session).toHaveProperty('completionFraction');
  expect(snapshot.session).toHaveProperty('remainingTotal');
  expect(Array.isArray(snapshot.recentOutcomes)).toBe(true);
  await expect(page.locator('#v2App')).toContainText('نتایج اخیر');
  await expect(page.locator('#v2App')).toContainText('تمرکز تطبیقی');
  await expect(page.locator('#v2App')).toContainText('پیشرفت');
  await expect(page.locator('#v2App')).toContainText('به دلیل خطاهای اخیر');
});
