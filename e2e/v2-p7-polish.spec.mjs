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

