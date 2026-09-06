import { test, expect } from '@playwright/test';

test('builds and restores the long-term skill profile from completed sessions', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    const history = [
      { sessionId: 's1', endedAt: new Date(Date.now() - 86400000).toISOString(), reviews: 3, modeResults: {
        meaning: { attempts: 2, correct: 2 }, reading: { attempts: 2, correct: 1 }, production: { attempts: 1, correct: 0 }, vocabulary: { attempts: 1, correct: 1 }, context: { attempts: 1, correct: 1 }
      } },
      { sessionId: 's2', endedAt: new Date().toISOString(), reviews: 2, modeResults: {
        meaning: { attempts: 2, correct: 2 }, reading: { attempts: 2, correct: 0 }, production: { attempts: 1, correct: 1 }, vocabulary: { attempts: 1, correct: 1 }, context: { attempts: 1, correct: 1 }
      } }
    ];
    localStorage.setItem('kanji5-v1.6-session-history', JSON.stringify(history));
  });
  await page.reload();
  await expect.poll(() => page.locator('#v16SkillProfile').count()).toBe(1);
  await expect(page.locator('#v16SkillProfile')).toContainText('پروفایل مهارت بلندمدت');
  await expect.poll(async () => page.evaluate(() => {
    const c = JSON.parse(localStorage.getItem('kanji5-v1.5-components') || '{}');
    return c.v16SkillProfile?.skills?.reading?.attempts || 0;
  })).toBe(4);
  await page.reload();
  await expect(page.locator('#v16SkillProfile')).toContainText('۴');
  await expect(page.locator('#v16SkillProfile')).toContainText('نیازمند توجه: خوانش');
});
