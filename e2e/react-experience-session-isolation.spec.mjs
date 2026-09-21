import { test, expect } from '@playwright/test';

async function clean(page){
  await page.goto('/');
  await page.evaluate(()=>{
    for(const key of Object.keys(localStorage)) if(key.startsWith('kanji5-')) localStorage.removeItem(key);
    sessionStorage.clear();
  });
  await page.reload();
  await expect(page.locator('#root .app-shell')).toBeVisible({timeout:20000});
}

test('Learning and Active Recall retain independent active sessions', async ({page})=>{
  await clean(page);

  const learning=page.getByRole('button',{name:'یادگیری'});
  const recall=page.getByRole('button',{name:'یادآوری فعال'});

  await expect(learning).toHaveAttribute('aria-current','page');
  const learningSession=await page.evaluate(()=>window.__KANJI5_V16_SESSION_API__?.getSession?.());
  expect(learningSession?.started).toBe(true);
  expect(learningSession?.experience).toBe('review');

  await recall.click();
  await expect(recall).toHaveAttribute('aria-current','page');
  await expect.poll(async()=>page.evaluate(()=>window.__KANJI5_V16_SESSION_API__?.getSession?.().experience)).toBe('practice');
  const practiceSession=await page.evaluate(()=>window.__KANJI5_V16_SESSION_API__?.getSession?.());
  expect(practiceSession?.started).toBe(true);
  expect(practiceSession?.experience).toBe('practice');
  expect(practiceSession?.sessionId).not.toBe(learningSession?.sessionId);

  await learning.click();
  await expect(learning).toHaveAttribute('aria-current','page');
  await expect.poll(async()=>page.evaluate(()=>window.__KANJI5_V16_SESSION_API__?.getSession?.().experience)).toBe('review');
  const resumedLearning=await page.evaluate(()=>window.__KANJI5_V16_SESSION_API__?.getSession?.());
  expect(resumedLearning?.sessionId).toBe(learningSession?.sessionId);

  await recall.click();
  await expect.poll(async()=>page.evaluate(()=>window.__KANJI5_V16_SESSION_API__?.getSession?.().experience)).toBe('practice');
  const resumedPractice=await page.evaluate(()=>window.__KANJI5_V16_SESSION_API__?.getSession?.());
  expect(resumedPractice?.sessionId).toBe(practiceSession?.sessionId);

  const activeRows=await page.evaluate(()=>JSON.parse(localStorage.getItem('kanji5-v1.6-session-history')||'[]').filter(row=>row?.status==='active'));
  expect(activeRows.map(row=>row.experience).sort()).toEqual(['practice','review']);
});
