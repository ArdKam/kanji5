import {test,expect} from '@playwright/test';

async function boot(page){
  await page.goto('/?v2=1');
  await expect(page.locator('#v2App')).toBeVisible({timeout:20000});
  await expect.poll(async()=>page.evaluate(()=>Boolean(window.__KANJI5_V19_V2_BOUNDARY__))).toBe(true);
}

async function exercise(page, payload){
  await page.evaluate(async p=>{await window.__KANJI5_V19_V2_BOUNDARY__.setExercise(p)},payload);
  await expect(page.locator('#v2AnswerInput')).toBeVisible({timeout:10000});
}

test('v2 desktop exercise visual baseline',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await boot(page);
  await exercise(page,{
    mode:'production',
    prompt:'با دیدن این معنی، کانجی را خودت تولید کن.',
    character:'学',
    stimulus:{kind:'meaning',primary:'school',inputPlaceholder:'Type the Kanji'},
    answerHint:'学',
    contentId:'visual-fixture-production'
  });
  await expect(page).toHaveScreenshot('v2-desktop-production.png',{animations:'disabled',caret:'hide'});
});

test('v2 mobile context visual baseline',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await boot(page);
  await exercise(page,{
    mode:'context',
    prompt:'کانجیِ حذف‌شده را در جمله وارد کن.',
    character:'学',
    stimulus:{kind:'masked-context',primary:'＿校へ行きます。',translation:'I go to school.',inputPlaceholder:'Type the missing Kanji'},
    answerHint:'学',
    contentId:'visual-fixture-context'
  });
  await expect(page).toHaveScreenshot('v2-mobile-context.png',{animations:'disabled',caret:'hide'});
});

test('v2 feedback visual baseline',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await boot(page);
  await exercise(page,{
    mode:'production',
    prompt:'با دیدن این معنی، کانجی را خودت تولید کن.',
    character:'学',
    stimulus:{kind:'meaning',primary:'school',inputPlaceholder:'Type the Kanji'},
    answerHint:'学',
    contentId:'visual-fixture-feedback'
  });
  await page.evaluate(async()=>{await window.__KANJI5_V19_V2_BOUNDARY__.setFeedback({mode:'production',outcome:'wrong',correct:false,score:0,graderVersion:'1.9.0-production',reason:'پاسخ درست نیست. دوباره تلاش کن.'})});
  await expect(page.locator('#v2Feedback')).toBeVisible({timeout:10000});
  await expect(page).toHaveScreenshot('v2-desktop-feedback.png',{animations:'disabled',caret:'hide'});
});