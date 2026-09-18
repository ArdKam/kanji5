import {test,expect} from '@playwright/test';

test('a new learner starts with a learning card before any recall',async({page})=>{
  await page.addInitScript(()=>localStorage.clear());
  await page.goto('/');
  await expect(page.locator('#v2App')).toBeVisible({timeout:20000});
  await expect(page.locator('.v2-learning-card')).toBeVisible({timeout:20000});
  await expect(page.locator('.v2-learning-card .v2-kanji')).not.toHaveText('');
  await expect(page.locator('.v2-learning-card .v2-learning-meaning')).not.toHaveText('');
  await expect(page.locator('.v2-learning-card .v2-learning-readings')).not.toHaveText('');
  await expect(page.locator('#v2StartExercise')).toBeVisible();
  await expect(page.locator('#v2AnswerInput')).toHaveCount(0);

  await page.locator('#v2StartExercise').click();
  await expect.poll(async()=>page.evaluate(()=>Boolean(window.__KANJI5_V19_V2_LAST_SNAPSHOT__?.exercise?.mode))).toBe(true);
});

test('production recall uses four Kanji choices instead of free text',async({page})=>{
  await page.goto('/');
  await expect(page.locator('#v2App')).toBeVisible({timeout:20000});
  await expect.poll(async()=>page.evaluate(()=>Boolean(window.__KANJI5_V19_V2_BOUNDARY__))).toBe(true);

  await page.evaluate(async()=>{
    await window.__KANJI5_V19_V2_BOUNDARY__.setExercise({
      mode:'production',
      prompt:'Choose the Kanji for the meaning',
      character:'学',
      stimulus:{kind:'meaning',primary:'school',inputPlaceholder:''},
      choices:['学','楽','習','校'],
      answerHint:'学',
      contentId:'fixture-production',
      contentVersion:'1',
      provenance:'local'
    });
  });

  await expect(page.locator('.v2-mode-badge')).toHaveText('تولید');
  await expect(page.locator('.v2-choice-grid')).toBeVisible();
  await expect(page.locator('.v2-choice-grid .v2-btn-choice')).toHaveCount(4);
  await expect(page.locator('.v2-choice-grid .v2-btn-choice')).toContainText(['学','楽','習','校']);
  await expect(page.locator('#v2AnswerInput')).toHaveCount(0);
});

test('smart distractors still favor related Kanji',async({page})=>{
  await page.goto('/');
  await expect(page.locator('#v2App')).toBeVisible({timeout:20000});
  const picked=await page.evaluate(()=>{
    const core=window.__KANJI5_EDU_CORE__;
    const target={character:'学',on:['ガク'],kun:['まなぶ'],meaning:['study','learning'],strokes:8,grade:1,frequency:100};
    const candidates=[
      {character:'校',on:['コウ'],meaning:['school'],strokes:10,grade:1,frequency:110},
      {character:'楽',on:['ガク'],meaning:['comfort'],strokes:13,grade:1,frequency:120},
      {character:'習',on:['シュウ'],meaning:['learn'],strokes:11,grade:1,frequency:90},
      {character:'語',on:['ゴ'],meaning:['language'],strokes:14,grade:2,frequency:800}
    ];
    return core.chooseDistractors(target,candidates,{},3).map(x=>x.character);
  });
  expect(picked).toContain('楽');
  expect(picked).toContain('習');
  expect(picked).not.toContain('学');
});
