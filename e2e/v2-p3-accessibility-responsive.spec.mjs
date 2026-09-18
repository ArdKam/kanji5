import {test,expect} from '@playwright/test';

test('v2 P3 is keyboard-first and screen-reader structured',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/?v2=1');
  await expect(page.locator('#v2App')).toBeVisible({timeout:20000});
  await expect.poll(async()=>page.evaluate(()=>Boolean(window.__KANJI5_V19_V2_BOUNDARY__))).toBe(true);
  await page.evaluate(async()=>{ await window.__KANJI5_V19_V2_BOUNDARY__.setExercise({mode:'production',prompt:'Write the Kanji',character:'学',contentId:'fixture-1',provenance:'local'}); });
  await expect(page.locator('#v2AnswerInput')).toBeVisible({timeout:10000});

  const semantics=await page.evaluate(()=>{
    const input=document.querySelector('#v2AnswerInput');
    const feedback=document.querySelector('#v2Grid section[role="status"]');
    const progress=document.querySelector('[role="progressbar"]');
    const skip=document.querySelector('.v2-skip-link');
    const label=document.querySelector('label[for="v2AnswerInput"]');
    const buttons=[...document.querySelectorAll('#v2App button')];
    return {
      inputFocused:document.activeElement===input,
      describedBy:input?.getAttribute('aria-describedby'),
      labelText:label?.textContent,
      feedbackRole:feedback?.getAttribute('role'),
      feedbackLive:feedback?.getAttribute('aria-live'),
      feedbackAtomic:feedback?.getAttribute('aria-atomic'),
      exerciseTabIndex:document.querySelector('#v2Exercise')?.tabIndex,
      progressLabel:progress?.getAttribute('aria-label'),
      skipHref:skip?.getAttribute('href'),
      buttonMinHeights:buttons.map(b=>parseFloat(getComputedStyle(b).minHeight)),
      reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches
    };
  });
  expect(semantics.inputFocused).toBe(true);
  expect(semantics.describedBy).toBe('v2Prompt');
  expect(semantics.labelText).toBe('Your answer');
  expect(semantics.feedbackRole).toBe('status');
  expect(semantics.feedbackLive).toBe('polite');
  expect(semantics.feedbackAtomic).toBe('true');
  expect(semantics.progressLabel).toBe('Session progress');
  expect(semantics.skipHref).toBe('#v2Exercise');
  expect(semantics.buttonMinHeights.every(v=>v>=44)).toBe(true);
  expect(semantics.reducedMotion).toBe(true);
  expect(semantics.exerciseTabIndex).toBe(-1);

  await page.getByText('Skip to current exercise').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#v2Exercise')).toBeFocused();

  await page.locator('#v2AnswerInput').focus();
  await page.locator('#v2AnswerInput').fill('definitely-not-the-answer');
  await page.locator('#v2AnswerInput').press('Enter');
  await expect(page.locator('#v2Next')).toBeVisible({timeout:10000});
  await expect(page.locator('#v2Grid section[role="status"]')).toBeFocused();

  await page.setViewportSize({width:390,height:844});
  const mobile=await page.evaluate(()=>({
    columns:getComputedStyle(document.querySelector('#v2Grid')).gridTemplateColumns.split(' ').length,
    actionDirections:[...document.querySelectorAll('#v2App .v2-actions')].map(n=>getComputedStyle(n).flexDirection)
  }));
  expect(mobile.columns).toBe(1);
  expect(mobile.actionDirections.every(v=>v==='column')).toBe(true);

  await page.setViewportSize({width:1024,height:768});
  const desktop=await page.evaluate(()=>getComputedStyle(document.querySelector('#v2Grid')).gridTemplateColumns.split(' ').length);
  expect(desktop).toBe(2);
});
