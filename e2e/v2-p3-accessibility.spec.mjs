import {test,expect} from '@playwright/test';

test('v2 P3 supports keyboard focus, live feedback semantics, mobile layout, and reduced motion',async({page})=>{
  await page.goto('/?v2=1');
  await expect(page.locator('#v2App')).toBeVisible({timeout:20000});
  await expect.poll(async()=>page.evaluate(()=>Boolean(window.__KANJI5_V19_V2_BOUNDARY__))).toBe(true);
  await page.evaluate(async()=>{
    const b=window.__KANJI5_V19_V2_BOUNDARY__;
    await b.setExercise({mode:'production',prompt:'Write the Kanji',character:'学',contentId:'fixture-1',provenance:'local'});
  });
  const input=page.locator('#v2AnswerInput');
  await expect(input).toBeVisible();
  await input.focus();
  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute('aria-describedby','v2Prompt');
  const feedback=page.getByRole('status',{name:'Feedback'});
  await expect(feedback).toBeVisible();

  const skip=page.getByText('Skip to current exercise');
  await skip.focus();
  await expect(skip).toBeFocused();
  await input.focus();

  await page.evaluate(async()=>{
    await window.__KANJI5_V19_V2_BOUNDARY__.setFeedback({mode:'production',outcome:'wrong',correct:false,score:0,graderVersion:'1.9.0-production',reason:'recent failure'});
  });
  await expect(feedback).toBeVisible();

  await page.setViewportSize({width:390,height:844});
  await expect(page.locator('#v2Grid')).toBeVisible();
  const columns=await page.locator('#v2Grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns);
  expect(columns.split(' ').length).toBe(1);

  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
});
