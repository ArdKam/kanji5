import {test,expect} from '@playwright/test';

test('v2 exposes graceful audio fallback when speech synthesis is unavailable',async({page})=>{
  await page.addInitScript(()=>{
    try{
      Object.defineProperty(window,'speechSynthesis',{configurable:true,value:undefined});
      Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:undefined});
    }catch(_){}
  });
  await page.goto('/');
  await expect(page.locator('#v2App')).toBeVisible({timeout:20000});
  await expect(page.locator('#v2LearningCard, #v2ReviewCard, #v2Exercise')).toHaveCount(1,{timeout:10000});
  const audio=page.locator('.v2-audio-button').first();
  await expect(audio).toBeVisible({timeout:10000});
  await expect(audio).toBeDisabled();
  await expect(audio).toHaveAttribute('aria-disabled','true');
  await expect(audio).toHaveAttribute('aria-label',/صدا در این مرورگر در دسترس نیست/);
});

test('v2 shows visible operation status while an async action is running',async({page})=>{
  await page.goto('/');
  await expect(page.locator('#v2App')).toBeVisible({timeout:20000});
  await expect(page.locator('#v2OperationStatus')).toBeAttached();
  await page.evaluate(()=>{
    const boundary=window.__KANJI5_V19_V2_BOUNDARY__;
    if(!boundary?.rateLearning) throw new Error('rateLearning bridge missing');
    const original=boundary.rateLearning;
    boundary.rateLearning=()=>new Promise(resolve=>setTimeout(()=>resolve(true),1200));
  });
  const card=page.locator('#v2LearningCard, #v2ReviewCard').first();
  if(await page.locator('#v2LearningReveal').count()) {
    await page.locator('#v2LearningReveal').click();
    await expect(page.locator('#v2OperationStatus')).toHaveAttribute('data-state','busy',{timeout:5000});
  } else {
    await page.locator('button[data-rating="Good"]').click();
    await expect(page.locator('#v2OperationStatus')).toHaveAttribute('data-state','busy',{timeout:5000});
  }
  await expect(page.locator('#v2OperationStatus')).toHaveAttribute('aria-live','polite');
});
