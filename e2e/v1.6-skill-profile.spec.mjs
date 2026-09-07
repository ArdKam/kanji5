import { test, expect } from '@playwright/test';

test('builds and restores the long-term skill profile from completed sessions', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    const history = [
      { sessionId: 's1', endedAt: new Date(Date.now() - 3 * 86400000).toISOString(), reviews: 3, modeResults: {
        meaning: { attempts: 2, correct: 2 }, reading: { attempts: 2, correct: 2 }, production: { attempts: 1, correct: 1 }, vocabulary: { attempts: 1, correct: 1 }, context: { attempts: 1, correct: 1 }
      } },
      { sessionId: 's2', endedAt: new Date(Date.now() - 2 * 86400000).toISOString(), reviews: 2, modeResults: {
        meaning: { attempts: 2, correct: 2 }, reading: { attempts: 2, correct: 1 }, production: { attempts: 1, correct: 1 }, vocabulary: { attempts: 1, correct: 1 }, context: { attempts: 1, correct: 1 }
      } },
      { sessionId: 's3', endedAt: new Date(Date.now() - 86400000).toISOString(), reviews: 2, modeResults: {
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
  })).toBe(6);
  const profile = await page.evaluate(() => JSON.parse(localStorage.getItem('kanji5-v1.5-components') || '{}').v16SkillProfile);
  expect(profile.sessions).toBe(3);
  expect(profile.skills.reading.recentAttempts).toBe(6);
  expect(profile.skills.reading.recentAccuracy).toBe(50);
  expect(profile.skills.reading.momentum).toBeLessThan(0);
  await page.reload();
  await expect(page.locator('#v16SkillProfile')).toContainText('۶');
  await expect(page.locator('#v16SkillProfile')).toContainText('نیازمند توجه: خوانش');
  await expect(page.locator('#v16SkillProfile')).toContainText('ضعیف‌تر');
});
