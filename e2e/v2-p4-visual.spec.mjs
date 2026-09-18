import {test,expect} from '@playwright/test';

test('v2 P4 visual system renders consistent hierarchy, controls, states, and responsive layout',async({page})=>{
  await page.goto('/?v2=1');
  await expect(page.locator('#v2App')).toBeVisible({timeout:20000});
  await expect.poll(async()=>page.evaluate(()=>Boolean(window.__KANJI5_V19_V2_BOUNDARY__))).toBe(true);
  await page.evaluate(async()=>{await window.__KANJI5_V19_V2_BOUNDARY__.setExercise({mode:'production',prompt:'Write the Kanji',character:'学',contentId:'fixture-1',provenance:'local'});});
  const title=page.locator('.v2-title');
  const card=page.locator('.v2-card').first();
  const input=page.locator('#v2AnswerInput');
  const primary=page.locator('.v2-btn-primary').first();
  const secondary=page.locator('.v2-btn-secondary').first();
  await expect(title).toBeVisible();
  await expect(card).toBeVisible();
  await expect(input).toBeVisible();
  await expect(primary).toBeVisible();
  await expect(secondary).toBeVisible();

  const desktop=await page.evaluate(()=>{
    const q=s=>document.querySelector(s);
    const cs=s=>getComputedStyle(q(s));
    return {
      titlePx:parseFloat(cs('.v2-title').fontSize),
      cardRadius:parseFloat(cs('.v2-card').borderRadius),
      cardShadow:cs('.v2-card').boxShadow,
      inputHeight:parseFloat(cs('#v2AnswerInput').minHeight),
      primaryHeight:parseFloat(cs('.v2-btn-primary').minHeight),
      secondaryHeight:parseFloat(cs('.v2-btn-secondary').minHeight),
      gridColumns:cs('#v2Grid').gridTemplateColumns.split(' ').length
    };
  });
  expect(desktop.titlePx).toBeGreaterThanOrEqual(28);
  expect(desktop.cardRadius).toBeGreaterThanOrEqual(20);
  expect(desktop.cardShadow).not.toBe('none');
  expect(desktop.inputHeight).toBeGreaterThanOrEqual(48);
  expect(desktop.primaryHeight).toBeGreaterThanOrEqual(48);
  expect(desktop.secondaryHeight).toBeGreaterThanOrEqual(48);
  expect(desktop.gridColumns).toBe(2);

  await primary.hover();
  expect(await primary.evaluate(el=>getComputedStyle(el).backgroundColor)).not.toBe('');

  await input.focus();
  const focus=await input.evaluate(el=>{const c=getComputedStyle(el);return {outlineStyle:c.outlineStyle,outlineWidth:c.outlineWidth,boxShadow:c.boxShadow};});
  expect(focus.outlineStyle).toBe('solid');
  expect(parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(2);
  expect(focus.boxShadow).not.toBe('none');

  await page.emulateMedia({reducedMotion:'reduce'});
  const reduced=await page.evaluate(()=>({matches:matchMedia('(prefers-reduced-motion: reduce)').matches,duration:getComputedStyle(document.querySelector('.v2-btn-primary')).transitionDuration}));
  expect(reduced.matches).toBe(true);
  expect(parseFloat(reduced.duration)).toBeLessThanOrEqual(0.01);

  await page.setViewportSize({width:390,height:844});
  const mobile=await page.evaluate(()=>({
    columns:getComputedStyle(document.querySelector('#v2Grid')).gridTemplateColumns.split(' ').length,
    titlePx:parseFloat(getComputedStyle(document.querySelector('.v2-title')).fontSize),
    actions:[...document.querySelectorAll('#v2App .v2-actions')].map(n=>getComputedStyle(n).flexDirection)
  }));
  expect(mobile.columns).toBe(1);
  expect(mobile.titlePx).toBeLessThanOrEqual(28);
  expect(mobile.actions.every(v=>v==='column')).toBe(true);

  await page.setViewportSize({width:1024,height:768});
  expect(await page.evaluate(()=>getComputedStyle(document.querySelector('#v2Grid')).gridTemplateColumns.split(' ').length)).toBe(2);
});
