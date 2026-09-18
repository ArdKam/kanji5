import {test,expect} from '@playwright/test';

test('v2 learner-facing chrome is localized and Japanese stimulus direction is preserved',async({page})=>{
  await page.goto('/');
  await expect(page.locator('#v2App')).toBeVisible({timeout:20000});
  await expect(page.locator('#v2Title')).toHaveText('کانجی ۵');
  await expect(page.locator('.v2-mode-badge')).toHaveText('تولید');
  await expect(page.locator('.v2-exercise-step')).toHaveText('یادآوری فعال');
  await expect(page.locator('.v2-card-title').first()).toHaveText('تمرین فعلی');
  await expect(page.locator('#v2AnswerInput')).toHaveAttribute('placeholder','Type the Kanji');

  await page.evaluate(async()=>{
    await window.__KANJI5_V19_V2_BOUNDARY__.setExercise({
      mode:'context',
      prompt:'کانجیِ حذف‌شده را در جمله وارد کن.',
      character:'学',
      stimulus:{kind:'masked-context',primary:'＿校へ行きます。',translation:'I go to school.',inputPlaceholder:'Type the missing Kanji'}
    });
  });
  await expect(page.locator('.v2-mode-badge')).toHaveText('بافت');
  await expect(page.locator('.v2-stimulus-context')).toHaveText('＿校へ行きます。');
  const direction=await page.locator('.v2-stimulus-context').evaluate(el=>getComputedStyle(el).direction);
  expect(direction).toBe('ltr');
  await expect(page.locator('#v2App')).not.toContainText('Session ID');
  await expect(page.locator('#v2App')).not.toContainText('Plan revision');
});
