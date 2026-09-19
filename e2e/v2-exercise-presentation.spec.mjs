import {test,expect} from '@playwright/test';

test('v2 renders the correct learner-facing stimulus for all five skills',async({page})=>{
  await page.goto('/?v2=1');
  await expect(page.locator('#v2App')).toBeVisible({timeout:20000});
  await expect.poll(async()=>page.evaluate(()=>Boolean(window.__KANJI5_V19_V2_BOUNDARY__))).toBe(true);

  const cases=[
    {mode:'meaning',prompt:'Write the meaning',character:'学',stimulus:{kind:'kanji',primary:'学',inputPlaceholder:'e.g. school'}},
    {mode:'reading',prompt:'Write a reading',character:'学',stimulus:{kind:'kanji',primary:'学',inputPlaceholder:'e.g. gaku or がく'}},
    {mode:'production',prompt:'Write the Kanji',character:'学',stimulus:{kind:'meaning',primary:'school',inputPlaceholder:'Type the Kanji'}},
    {mode:'vocabulary',prompt:'Complete the word',character:'学',stimulus:{kind:'masked-vocabulary',primary:'＿校',secondary:'がっこう',translation:'school',inputPlaceholder:'Type the full word'}},
    {mode:'context',prompt:'Complete the sentence',character:'学',stimulus:{kind:'masked-context',primary:'＿校へ行きます。',translation:'I go to school.',inputPlaceholder:'Type the missing Kanji'}}
  ];

  for (const item of cases) {
    await page.evaluate(async payload=>{
      await window.__KANJI5_V19_V2_BOUNDARY__.setExercise(payload);
    },item);
    const label={meaning:'معنی',reading:'خوانش',production:'تولید',vocabulary:'واژگان',context:'بافت'}[item.mode];
    await expect(page.locator('.v2-mode-badge')).toHaveText(label);
    await expect(page.locator('.v2-prompt')).toHaveText(item.prompt);
    await expect(page.locator('.v2-stimulus')).toContainText(item.stimulus.primary);
    if(item.stimulus.secondary) await expect(page.locator('.v2-stimulus')).toContainText(item.stimulus.secondary);
    if(item.stimulus.translation) await expect(page.locator('.v2-stimulus')).toContainText(item.stimulus.translation);
    await expect(page.locator('#v2AnswerInput')).toHaveAttribute('placeholder',item.stimulus.inputPlaceholder);
    await expect(page.locator('#v2App')).not.toContainText('fixture-1');
    await expect(page.locator('#v2App')).not.toContainText('Session ID');
    await expect(page.locator('#v2App')).not.toContainText('Plan revision');
  }
});
