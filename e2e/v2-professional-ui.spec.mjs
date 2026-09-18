import {test,expect} from '@playwright/test';

async function boot(page){
  await page.goto('/');
  await expect(page.locator('#v2App')).toBeVisible({timeout:20000});
  await expect.poll(async()=>page.evaluate(()=>Boolean(window.__KANJI5_V19_V2_BOUNDARY__))).toBe(true);
}

test('professional UI has stable responsive geometry and no horizontal overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await boot(page);
  const metrics=await page.evaluate(()=>({
    viewport:document.documentElement.clientWidth,
    scrollWidth:document.documentElement.scrollWidth,
    header:document.querySelector('.v2-header')?.getBoundingClientRect().height||0,
    card:document.querySelector('.v2-exercise-card,.v2-learning-card')?.getBoundingClientRect().width||0,
    root:document.querySelector('#v2App')?.getBoundingClientRect().width||0
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewport+1);
  expect(metrics.card).toBeGreaterThan(300);
  expect(metrics.root).toBeLessThanOrEqual(metrics.viewport+1);
  expect(metrics.header).toBeGreaterThan(0);
});

test('professional UI exposes tactile focus states and supports dark theme',async({page})=>{
  await page.setViewportSize({width:1280,height:900});
  await boot(page);
  const focusState=await page.evaluate(()=>{
    const button=document.querySelector('#v2StartPractice');
    button?.focus();
    const s=button?getComputedStyle(button):null;
    return {outlineStyle:s?.outlineStyle,outlineWidth:s?.outlineWidth};
  });
  expect(focusState.outlineStyle).toBe('solid');
  expect(focusState.outlineWidth).not.toBe('0px');

  await page.emulateMedia({colorScheme:'dark'});
  const dark=await page.evaluate(()=>({
    body:getComputedStyle(document.body).backgroundColor,
    accent:getComputedStyle(document.documentElement).getPropertyValue('--v2-accent').trim()
  }));
  expect(dark.accent).toBe('#8b83ff');
  expect(dark.body).toBe('rgb(11, 16, 32)');
});

test('professional UI keeps primary task visually dominant',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await boot(page);
  await page.evaluate(async()=>{await window.__KANJI5_V19_V2_BOUNDARY__.setExercise({
    mode:'production',
    prompt:'با دیدن این معنی، کانجی را خودت تولید کن.',
    character:'学',
    stimulus:{kind:'meaning',primary:'school',inputPlaceholder:'Type the Kanji'},
    answerHint:'学',
    contentId:'professional-ui-fixture'
  })});
  await expect(page.locator('#v2Exercise')).toBeVisible({timeout:10000});
  const visual=await page.evaluate(()=>{
    const main=document.querySelector('#v2Exercise');
    const stimulus=document.querySelector('.v2-stimulus');
    const title=document.querySelector('.v2-card-title');
    return {
      mainWidth:main?.getBoundingClientRect().width||0,
      stimulusWidth:stimulus?.getBoundingClientRect().width||0,
      titleSize:parseFloat(getComputedStyle(title).fontSize||'0'),
      stimulusRadius:getComputedStyle(stimulus).borderRadius
    };
  });
  expect(visual.mainWidth).toBeGreaterThan(600);
  expect(visual.stimulusWidth).toBeGreaterThan(500);
  expect(visual.titleSize).toBeGreaterThanOrEqual(18);
  expect(visual.stimulusRadius).toBe('22px');
});
