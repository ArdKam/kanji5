import {test,expect} from '@playwright/test';

test('v2 P0 shell consumes the v1.9 presentation boundary',async({page})=>{
  await page.goto('/?v2=1');
  await expect(page.locator('#v2App')).toBeVisible({timeout:20000});
  await expect(page.locator('#v2Title')).toHaveText('Kanji 5');
  await expect.poll(async()=>page.evaluate(()=>Boolean(window.__KANJI5_V19_V2_BOUNDARY__))).toBe(true);

  await page.evaluate(async()=>{
    const boundary=window.__KANJI5_V19_V2_BOUNDARY__;
    await boundary.setExercise({mode:'production',prompt:'Write the Kanji',character:'学',stimulus:{text:'school',detail:'معنی کانجی را ببین'},answerHint:'به شکل کانجی فکر کن',contentId:'fixture-1',provenance:'local'});
    await boundary.setFeedback({mode:'production',outcome:'wrong',correct:false,score:0,graderVersion:'1.9.0-production',reason:'expected target: 学'});
    await boundary.setAdaptiveReason({mode:'production',action:'repair',reasons:['recent failure'],score:4});
  });

  await expect(page.locator('#v2App')).toContainText('Write the Kanji');
  await expect(page.locator('#v2Stimulus')).toHaveText('school');
  await expect(page.locator('#v2StimulusDetail')).toHaveText('معنی کانجی را ببین');
  await expect(page.locator('.v2-answer-hint')).toHaveText('به شکل کانجی فکر کن');
  await expect(page.locator('#v2App')).toContainText('نادرست');
  await expect(page.locator('#v2App')).toContainText('ترمیم');
});

test('v2 renders distinct vocabulary and context stimuli',async({page})=>{
  await page.goto('/?v2=1');
  await expect(page.locator('#v2App')).toBeVisible({timeout:20000});
  await expect.poll(async()=>page.evaluate(()=>Boolean(window.__KANJI5_V19_V2_BOUNDARY__))).toBe(true);

  const boundary=page.evaluateHandle(()=>window.__KANJI5_V19_V2_BOUNDARY__);
  await page.evaluate(async()=>{
    const b=window.__KANJI5_V19_V2_BOUNDARY__;
    await b.setExercise({mode:'vocabulary',prompt:'واژه را کامل کن',character:'学',stimulus:{text:'学生',detail:'がくせい · student'},answerHint:'واژهٔ کامل را به ژاپنی وارد کن',contentId:'vocab-1',provenance:'kanjiapi'});
  });
  await expect(page.locator('#v2ModePill')).toHaveText('واژگان');
  await expect(page.locator('#v2Stimulus')).toHaveText('学生');
  await expect(page.locator('#v2StimulusDetail')).toHaveText('がくせい · student');

  await page.evaluate(async()=>{
    const b=window.__KANJI5_V19_V2_BOUNDARY__;
    await b.setExercise({mode:'context',prompt:'کانجی حذف‌شده را کامل کن',character:'学',stimulus:{text:'私は＿校へ行く。',detail:'I go to school.'},answerHint:'فقط کانجی حذف‌شده را وارد کن.',contentId:'context-1',provenance:'tatoeba'});
  });
  await expect(page.locator('#v2ModePill')).toHaveText('بافت');
  await expect(page.locator('#v2Stimulus')).toHaveText('私は＿校へ行く。');
  await expect(page.locator('#v2StimulusDetail')).toHaveText('I go to school.');
  await boundary.dispose();
});