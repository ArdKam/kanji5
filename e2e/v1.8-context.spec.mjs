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

async function currentTarget(page){
  return page.evaluate(()=>{
    const raw=localStorage.getItem('kanji5-deck');
    const deck=raw?JSON.parse(raw):[];
    const ids=new Set(Object.keys(JSON.parse(localStorage.getItem('kanji5-v1-cards')||'{}')));
    return deck.find(item=>item?.id&&ids.has(item.id))?.character||'';
  });
}

async function forceContextMode(page){
  await page.evaluate(async()=>{
    await import('./v1.6-session-feedback.js');
    window.__KANJI5_V16_SESSION_AUTH__={nextMode:()=> 'context',consumeMode:()=>{}};
  });
}

async function mockContextApi(page,target){
  await page.route('https://api.tatoeba.org/v1/sentences**',async route=>{
    const payload={data:[{id:1,text:`これは${target}です。`,translations:[[{text:'This is a test sentence.'}]]}]};
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
  });
}

async function openContext(page){
  const target=await currentTarget(page);
  await mockContextApi(page,target);
  await forceContextMode(page);
  await page.locator('[data-tab="education"]').click();
  const pane=page.locator('#v14EducationPane');
  await expect(pane.locator('#v14EduContextInput')).toBeVisible({timeout:10_000});
  return {pane,target};
}

test('renders Context as a real learner-input exercise and persists a wrong outcome',async({page})=>{
  await cleanStart(page); await seedReviewedCard(page); await startReview(page);
  const {pane,target}=await openContext(page);
  await expect(pane.locator('.v14-edu-word')).toContainText('＿');
  await pane.locator('#v14EduContextInput').fill('校');
  await pane.locator('#v14EduSubmit').click();
  await expect(pane).toContainText('پاسخ نادرست بود');
  const context=await page.evaluate(character=>JSON.parse(localStorage.getItem('kanji5-v1.2-knowledge')||'{}')[character]?.context||null,target);
  expect(context?.attempts).toBeGreaterThan(0);
  expect(context?.correct).toBe(0);
});

test('grades an exact Context response as correct',async({page})=>{
  await cleanStart(page); await seedReviewedCard(page); await startReview(page);
  const {pane,target}=await openContext(page);
  await pane.locator('#v14EduContextInput').fill(target);
  await pane.locator('#v14EduSubmit').click();
  await expect(pane).toContainText('پاسخ درست بود');
  const context=await page.evaluate(character=>JSON.parse(localStorage.getItem('kanji5-v1.2-knowledge')||'{}')[character]?.context||null,target);
  expect(context?.attempts).toBeGreaterThan(0);
  expect(context?.correct).toBeGreaterThan(0);
});

test('does not record an empty Context submission',async({page})=>{
  await cleanStart(page); await seedReviewedCard(page); await startReview(page);
  const {pane,target}=await openContext(page);
  await pane.locator('#v14EduContextInput').fill('');
  await pane.locator('#v14EduSubmit').click();
  await expect(pane.locator('#v14EduContextInput')).toBeVisible();
  const context=await page.evaluate(character=>JSON.parse(localStorage.getItem('kanji5-v1.2-knowledge')||'{}')[character]?.context||null,target);
  expect(context).toBeFalsy();
});

test('preserves Context outcome after reload',async({page})=>{
  await cleanStart(page); await seedReviewedCard(page); await startReview(page);
  const {pane,target}=await openContext(page);
  await pane.locator('#v14EduContextInput').fill(target);
  await pane.locator('#v14EduSubmit').click();
  await expect(pane).toContainText('پاسخ درست بود');
  const before=await page.evaluate(character=>JSON.parse(localStorage.getItem('kanji5-v1.2-knowledge')||'{}')[character]?.context?.attempts||0,target);
  expect(before).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator('#app')).toBeVisible({timeout:20_000});
  const after=await page.evaluate(character=>JSON.parse(localStorage.getItem('kanji5-v1.2-knowledge')||'{}')[character]?.context?.attempts||0,target);
  expect(after).toBeGreaterThanOrEqual(before);
});
