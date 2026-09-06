import { test, expect } from '@playwright/test';

async function cleanStart(page){
  await page.goto('/');
  await page.evaluate(() => { for (const key of Object.keys(localStorage)) if (key.startsWith('kanji5-')) localStorage.removeItem(key); });
  await page.reload();
  await expect(page.locator('#app')).toBeVisible({ timeout: 20_000 });
}

test('renders seven-session performance analytics from persisted history', async ({ page }) => {
  await cleanStart(page);
  const rows=Array.from({length:7},(_,i)=>({
    sessionId:`analytics-${i}`,
    startedAt:new Date(Date.now()-(7-i)*86400000).toISOString(),
    endedAt:new Date(Date.now()-(7-i)*86400000+60000).toISOString(),
    durationMs:60000,
    reviews:i+1,
    modeResults:{
      meaning:{attempts:2,correct:i>=4?2:1,lastAt:''},
      reading:{attempts:2,correct:i>=5?2:1,lastAt:''},
      production:{attempts:2,correct:1,lastAt:''},
      vocabulary:{attempts:2,correct:2,lastAt:''},
      context:{attempts:2,correct:1,lastAt:''}
    },
    schemaVersion:1
  }));
  await page.evaluate(value=>localStorage.setItem('kanji5-v1.6-session-history',JSON.stringify(value)),rows);
  await page.reload();
  await expect(page.locator('#v16SessionAnalytics')).toBeVisible();
  await expect(page.locator('#v16SessionAnalytics')).toContainText('روند عملکرد');
  await expect(page.locator('#v16SessionAnalytics')).toContainText('۷');
  await expect(page.locator('#v16SessionAnalytics')).toContainText('مرور FSRS');
  await expect(page.locator('#v16SessionAnalytics')).toContainText('قوی‌ترین');
  await expect(page.locator('#v16SessionAnalytics')).toContainText('نیازمند توجه');
});