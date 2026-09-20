import {test,expect} from '@playwright/test';

test('v2 P3 is keyboard-first and screen-reader structured',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/?v2=1');
  await expect(page.locator('#v2App')).toBeVisible({timeout:20000});
  await expect.poll(async()=>page.evaluate(()=>Boolean(window.__KANJI5_V19_V2_BOUNDARY__))).toBe(true);
  await page.locator('#v2PracticeNav').click();
  await page.evaluate(async()=>{ const b=window.__KANJI5_V19_V2_BOUNDARY__; await b.setExercise({mode:'production',prompt:'Write the Kanji',character:'学',contentId:'fixture-1',provenance:'local'}); });
  await expect(page.locator('#v2AnswerInput')).toBeVisible({timeout:10000});
  await page.evaluate(async()=>{await window.__KANJI5_V19_V2_BOUNDARY__.setFeedback({mode:'production',outcome:'wrong',correct:false,score:0,graderVersion:'1.9.0-production',reason:'recent failure'});});

  const semantics=await page.evaluate(()=>{
    const input=document.querySelector('#v2AnswerInput');
    const feedback=document.querySelector('#v2Feedback');
    const progress=document.querySelector('[role="progressbar"]');
    const skip=document.querySelector('.v2-skip-link');
    const label=document.querySelector('label[for="v2AnswerInput"]');
    const buttons=[...document.querySelectorAll('#v2App button')];
    return {
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
  expect(semantics.describedBy).toBe('v2Prompt');
  expect(semantics.labelText).toBe('پاسخ شما');
  expect(semantics.feedbackRole).toBe('status');
  expect(semantics.feedbackLive).toBe('polite');
  expect(semantics.feedbackAtomic).toBe('true');
  expect(semantics.progressLabel).toBe('پیشرفت جلسه');
  expect(semantics.skipHref).toBe('#v2Exercise');
  expect(semantics.buttonMinHeights.every(v=>v>=44)).toBe(true);
  expect(semantics.reducedMotion).toBe(true);
  expect(semantics.exerciseTabIndex).toBe(-1);

  const skip=page.getByText('رفتن به تمرین فعلی');
  await skip.focus();
  await expect(skip).toBeFocused();

  await page.locator('#v2AnswerInput').focus();
  await page.evaluate(()=>{
    window.__P3_CLICKED__=false;
    document.addEventListener('click',event=>{
      if(event.target?.closest?.('#v2Submit')) window.__P3_CLICKED__=true;
    },{capture:true,once:false});
  });
  await page.locator('#v2AnswerInput').fill('学');
  await page.locator('#v2AnswerInput').press('Enter');
  await expect.poll(async()=>page.evaluate(()=>window.__P3_CLICKED__)).toBe(true);
  await page.evaluate(async()=>{await window.__KANJI5_V19_V2_BOUNDARY__.setFeedback({mode:'production',outcome:'wrong',correct:false,score:0,graderVersion:'1.9.0-production',reason:'recent failure'});});
  await expect(page.locator('#v2Next')).toBeVisible({timeout:10000});
  await expect(page.locator('#v2Feedback')).toHaveAttribute('tabindex','-1');

  await page.setViewportSize({width:390,height:844});
  const mobile=await page.evaluate(()=>({
    columns:getComputedStyle(document.querySelector('.v2-content')).gridTemplateColumns.split(' ').length,
    insightColumns:getComputedStyle(document.querySelector('.v2-insights-grid')).gridTemplateColumns.split(' ').length,
    actionColumns:getComputedStyle(document.querySelector('.v2-actions')).gridTemplateColumns.split(' ').length,
    headerColumns:getComputedStyle(document.querySelector('.v2-header-meta')).gridTemplateColumns.split(' ').length,
    practiceSpansFullRow:getComputedStyle(document.querySelector('.v2-header-practice')).gridColumn==='1 / -1',
    horizontalOverflow:document.documentElement.scrollWidth>window.innerWidth+1 || document.body.scrollWidth>window.innerWidth+1,
    touchSafeButtons:[...document.querySelectorAll('#v2App button')].every(button=>parseFloat(getComputedStyle(button).minHeight)>=44)
  }));
  expect(mobile.columns).toBe(1);
  expect(mobile.insightColumns).toBe(1);
  expect(mobile.actionColumns).toBe(1);
  expect(mobile.headerColumns).toBe(2);
  expect(mobile.practiceSpansFullRow).toBe(true);
  expect(mobile.horizontalOverflow).toBe(false);
  expect(mobile.touchSafeButtons).toBe(true);

  await page.setViewportSize({width:1024,height:768});
  const desktop=await page.evaluate(()=>({
    columns:getComputedStyle(document.querySelector('.v2-content')).gridTemplateColumns.split(' ').length,
    overflow:document.documentElement.scrollWidth>window.innerWidth+1 || document.body.scrollWidth>window.innerWidth+1
  }));
  expect(desktop.columns).toBe(1);
  expect(desktop.overflow).toBe(false);

  await page.setViewportSize({width:844,height:390});
  const landscape=await page.evaluate(()=>({
    shellHeight:document.querySelector('#v2App')?.getBoundingClientRect().height||0,
    overflow:document.documentElement.scrollWidth>window.innerWidth+1 || document.body.scrollWidth>window.innerWidth+1
  }));
  expect(landscape.shellHeight).toBeGreaterThanOrEqual(390);
  expect(landscape.overflow).toBe(false);
});
