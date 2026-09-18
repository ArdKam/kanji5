import {test,expect} from '@playwright/test';

test('v2 P0 shell consumes the v1.9 presentation boundary',async({page})=>{
  await page.goto('/?v2=1');
  await expect(page.locator('#v2App')).toBeVisible({timeout:20000});
  await expect(page.locator('#v2Title')).toHaveText('کانجی ۵');
  await expect.poll(async()=>page.evaluate(()=>Boolean(window.__KANJI5_V19_V2_BOUNDARY__))).toBe(true);

  await page.evaluate(async()=>{
    const boundary=window.__KANJI5_V19_V2_BOUNDARY__;
    await boundary.setExercise({mode:'production',prompt:'Write the Kanji',character:'学',contentId:'fixture-1',provenance:'local'});
    await boundary.setFeedback({mode:'production',outcome:'نادرست',correct:false,score:0,graderVersion:'1.9.0-production',reason:'expected target: 学'});
    await boundary.setAdaptiveReason({mode:'production',action:'ترمیم',reasons:['recent failure'],score:4});
  });

  await expect(page.locator('#v2App')).toContainText('Write the Kanji');
  await expect(page.locator('#v2App')).toContainText('学');
  await expect(page.locator('#v2App')).toContainText('نادرست');
  await expect(page.locator('#v2App')).toContainText('ترمیم');
});
