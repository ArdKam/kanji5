import { test, expect } from '@playwright/test';

async function cleanStart(page){
  await page.goto('/');
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

async function forceProductionMode(page){
  await page.evaluate(async()=>{
    await import('./v1.6-session-feedback.js');
    window.__KANJI5_V16_SESSION_AUTH__={nextMode:()=> 'production',consumeMode:()=>{}};
  });
}

async function openProduction(page){
  await forceProductionMode(page);
  await page.locator('[data-tab="education"]').click();
  const pane=page.locator('#v14EducationPane');
  await expect(pane.locator('#v14EduProductionInput')).toBeVisible({timeout:10_000});
  return pane;
}

async function currentTarget(page){
  return page.evaluate(()=>{
    const raw=localStorage.getItem('kanji5-deck');
    const deck=raw?JSON.parse(raw):[];
    const ids=new Set(Object.keys(JSON.parse(localStorage.getItem('kanji5-v1-cards')||'{}')));
    return deck.find(item=>item?.id&&ids.has(item.id))?.character||'';
  });
}

test('renders Production as a real learner-input exercise and persists the outcome',async({page})=>{
  await cleanStart(page);
  await seedReviewedCard(page);
  await startReview(page);
  const pane=await openProduction(page);
  const target=await currentTarget(page);
  expect(target).toBeTruthy();
  await pane.locator('#v14EduProductionInput').fill('x');
  await pane.locator('#v14EduSubmit').click();
  await expect(pane).toContainText('پاسخ نادرست بود');
  const production=await page.evaluate(character=>JSON.parse(localStorage.getItem('kanji5-v1.2-knowledge')||'{}')[character]?.production||null,target);
  expect(production?.attempts).toBeGreaterThan(0);
  expect(production?.correct).toBe(0);
});

test('grades an exact Production response as correct',async({page})=>{
  await cleanStart(page);
  await seedReviewedCard(page);
  await startReview(page);
  const pane=await openProduction(page);
  const target=await currentTarget(page);
  expect(target).toBeTruthy();
  await pane.locator('#v14EduProductionInput').fill(target);
  await pane.locator('#v14EduSubmit').click();
  await expect(pane).toContainText('پاسخ درست بود');
});
