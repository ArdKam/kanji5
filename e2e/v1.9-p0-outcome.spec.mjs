import { test, expect } from '@playwright/test';

async function cleanStart(page){
  await page.goto('/?legacy=1');
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) if (key.startsWith('kanji5-')) localStorage.removeItem(key);
    sessionStorage.clear();
  });
  await page.reload();
  await expect(page.locator('#app')).toBeVisible({timeout:20_000});
  await expect(page.locator('#v16Start')).toBeVisible();
}

async function seedReviewedCard(page){
  await page.locator('#revealBtn').click();
  await expect(page.locator('#ratings')).toHaveClass(/show/);
  await page.locator('.rate[data-r="Good"]').click();
  await expect(page.locator('#revealBtn')).toBeVisible();
}

async function startReview(page){
  await page.locator('#v16Start').click();
  await expect(page.locator('#v16FinishExternal')).toBeVisible();
  await page.locator('#v16DashboardToggle').click();
  await expect(page.locator('#v16Session')).toBeVisible();
}

async function forceMeaningMode(page){
  await page.evaluate(async()=>{
    await import('./v1.6-session-feedback.js');
    window.__KANJI5_V16_SESSION_AUTH__={nextMode:()=> 'meaning',consumeMode:()=>{}};
  });
}

test('preserves Dont Know as an explicit unknown outcome',async({page})=>{
  await cleanStart(page);
  await seedReviewedCard(page);
  await startReview(page);
  await forceMeaningMode(page);
  await page.locator('[data-tab="education"]').click();
  const pane=page.locator('#v14EducationPane');
  await expect(pane.locator('#v14EduDontKnow')).toBeVisible({timeout:10_000});
  const target=await page.evaluate(()=>{
    const raw=localStorage.getItem('kanji5-deck');
    const deck=raw?JSON.parse(raw):[];
    const cards=JSON.parse(localStorage.getItem('kanji5-v1-cards')||'{}');
    const ids=new Set(Object.keys(cards));
    return deck.find(item=>item?.id&&ids.has(item.id))?.character||'';
  });
  expect(target).toBeTruthy();

  await pane.locator('#v14EduDontKnow').click();
  await expect(pane).toContainText('پاسخ را نمی‌دانستم');

  const stored=await page.evaluate(character=>JSON.parse(localStorage.getItem('kanji5-v1.2-knowledge')||'{}')[character],target);
  expect(stored?.educationEvidence?.lastOutcome).toBe('unknown');
  expect(stored?.educationEvidence?.graderVersion).toBe('1.9.0-meaning');

  const history=await page.evaluate(()=>JSON.parse(localStorage.getItem('kanji5-v1.6-session-history')||'[]'));
  const active=[...history].reverse().find(x=>x?.status==='active');
  expect(active?.modeResults?.meaning?.lastOutcome).toBe('unknown');
  expect(active?.modeResults?.meaning?.lastQuality).toBe('unknown');
  expect(active?.modeResults?.meaning?.outcomeSchemaVersion).toBe(1);
});
