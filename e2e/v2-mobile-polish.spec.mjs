import {test,expect} from '@playwright/test';

test('v2 remains readable and scroll-safe on narrow mobile widths',async({page})=>{
  await page.goto('/');
  await expect(page.locator('#v2App')).toBeVisible({timeout:20000});
  await page.evaluate(async()=>{
    await window.__KANJI5_V19_V2_BOUNDARY__.setExercise({
      mode:'context',
      prompt:'کانجیِ حذف‌شده را در جمله وارد کن.',
      character:'学',
      stimulus:{kind:'masked-context',primary:'＿校へ行きます。これは少し長い文で、画面 باریک هم نباید بیرون بزند。',translation:'A deliberately long sentence for responsive testing.',inputPlaceholder:'Type the missing Kanji'},
      answerHint:'学'
    });
  });

  for (const width of [320,375,390,430]) {
    await page.setViewportSize({width,height:844});
    await expect(page.locator('.v2-stimulus-context')).toBeVisible();
    const metrics=await page.evaluate(()=>({
      viewport:window.innerWidth,
      scrollWidth:document.documentElement.scrollWidth,
      bodyScrollWidth:document.body.scrollWidth,
      exerciseWidth:document.querySelector('.v2-exercise-card')?.getBoundingClientRect().width||0,
      stimulusWidth:document.querySelector('.v2-stimulus')?.getBoundingClientRect().width||0,
      buttonHeights:[...document.querySelectorAll('#v2App .v2-btn')].map(x=>Math.round(x.getBoundingClientRect().height)),
      summaryHeight:Math.round(document.querySelector('.v2-insights > summary')?.getBoundingClientRect().height||0)
    }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewport);
    expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.viewport);
    expect(metrics.exerciseWidth).toBeLessThanOrEqual(metrics.viewport);
    expect(metrics.stimulusWidth).toBeLessThanOrEqual(metrics.exerciseWidth);
    expect(metrics.buttonHeights.every(v=>v>=48)).toBe(true);
    expect(metrics.summaryHeight).toBeGreaterThanOrEqual(48);
  }
});
