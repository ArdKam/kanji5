import { test, expect } from '@playwright/test';

async function cleanStart(page){
  await page.goto('/');
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) if (key.startsWith('kanji5-')) localStorage.removeItem(key);
    sessionStorage.clear();
  });
  await page.reload();
  await expect(page.locator('#app')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#v16Start')).toBeVisible();
  await expect(page.locator('#v16Session')).toBeHidden();
}

async function startSession(page){
  if(await page.locator('#v16Start').isVisible()) await page.locator('#v16Start').click();
  await expect(page.locator('#v16Start')).toBeHidden();
  await expect(page.locator('#v16FinishExternal')).toBeVisible();
  await expect(page.locator('#v16DashboardToggle')).toBeVisible();
  await expect(page.locator('#v16Session')).toBeHidden();
}

async function openDashboard(page){
  if(await page.locator('#v16Session').isHidden()) await page.locator('#v16DashboardToggle').click();
  await expect(page.locator('#v16Session')).toBeVisible();
}

async function prepareWeakReading(page){
  const character=(await page.locator('.kanji').textContent())?.trim();
  const firstId=await page.locator('.kanji').getAttribute('data-kanji-id');
  expect(character).toBeTruthy();
  expect(firstId).toBeTruthy();
  await page.locator('#revealBtn').click();
  await expect(page.locator('#ratings')).toHaveClass(/show/);
  await page.locator('.rate[data-r="Again"]').click();
  await page.evaluate(({character,id})=>{
    const raw=localStorage.getItem('kanji5-v1-cards');
    const cards=raw?JSON.parse(raw):{};
    if(!cards[id]?.card)throw new Error('persisted card missing');
    cards[id].card.due=new Date(Date.now()-1000).toISOString();
    localStorage.setItem('kanji5-v1-cards',JSON.stringify(cards));
    localStorage.setItem('kanji5-v1.2-knowledge',JSON.stringify({[character]:{meaning:{attempts:20,correct:19},reading:{attempts:20,correct:2},production:{attempts:20,correct:18},vocabulary:{attempts:20,correct:19},context:{attempts:20,correct:18}}}));
    localStorage.removeItem('kanji5-v1.6-session-history');
  },{character,id:firstId});
  return {character,firstId};
}

test('routes Active Recall toward the weakest supported learning attribute', async ({ page }) => {
  await cleanStart(page);
  await startSession(page);
  await openDashboard(page);
  await prepareWeakReading(page);
  await page.reload();
  await startSession(page);
  await openDashboard(page);
  await page.locator('#revealBtn').click();
  const gate=page.locator('.v12-recall-gate');
  await expect(gate).toBeVisible({timeout:10_000});
  await expect(gate).toHaveAttribute('data-v17-adaptive','1');
  await expect(gate).toHaveAttribute('data-v17-attribute','reading');
  await expect(gate).toContainText('خوانش');
});

test('preserves the selected adaptive recall intent across a reload', async ({ page }) => {
  await cleanStart(page);
  await startSession(page);
  await openDashboard(page);
  await prepareWeakReading(page);
  await page.reload();
  await startSession(page);
  await openDashboard(page);
  await page.locator('#revealBtn').click();
  const gate=page.locator('.v12-recall-gate');
  await expect(gate).toBeVisible({timeout:10_000});
  await expect(gate).toHaveAttribute('data-v17-attribute','reading');
  const intent=await page.evaluate(()=>JSON.parse(localStorage.getItem('kanji5-v1.7-recall-intent')||'null'));
  expect(intent).toMatchObject({schemaVersion:1,attribute:'reading'});
  expect(intent.character).toBe((await page.locator('.kanji').textContent())?.trim());
  await page.reload();
  await startSession(page);
  await openDashboard(page);
  await page.locator('#revealBtn').click();
  await expect(page.locator('.v12-recall-gate')).toHaveAttribute('data-v17-attribute','reading');
  const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('kanji5-v1.7-recall-intent')||'null'));
  expect(persisted?.character).toBe((await page.locator('.kanji').textContent())?.trim());
});

test('explains why the adaptive recall focus was selected', async ({ page }) => {
  await cleanStart(page);
  await startSession(page);
  await openDashboard(page);
  await prepareWeakReading(page);
  await page.reload();
  await startSession(page);
  await openDashboard(page);
  await page.locator('#revealBtn').click();
  const gate=page.locator('.v12-recall-gate');
  await expect(gate).toHaveAttribute('data-v17-attribute','reading');
  await expect(gate.locator('[data-v17-reason-text]')).toContainText('عملکردت در این مهارت ضعیف‌تر بوده');
  await expect(gate.locator('[data-v17-reason]')).toHaveText('چرا؟');
});

test('moves to the secondary supported attribute after a wrong answer and persists it', async ({ page }) => {
  await cleanStart(page);
  await startSession(page);
  await openDashboard(page);
  await prepareWeakReading(page);
  await page.reload();
  await startSession(page);
  await openDashboard(page);
  await page.locator('#revealBtn').click();
  const gate=page.locator('.v12-recall-gate');
  await expect(gate).toHaveAttribute('data-v17-attribute','reading');
  await page.locator('#v12RecallInput').fill('definitely-not-a-reading');
  await page.locator('#v12SubmitRecall').click();
  await expect(gate).toHaveAttribute('data-v17-attribute','meaning');
  const intent=await page.evaluate(()=>JSON.parse(localStorage.getItem('kanji5-v1.7-recall-intent')||'null'));
  expect(intent).toMatchObject({schemaVersion:1,attribute:'meaning'});
  expect(intent.attributes).toEqual(['meaning']);
  await page.reload();
  await startSession(page);
  await openDashboard(page);
  await page.locator('#revealBtn').click();
  await expect(page.locator('.v12-recall-gate')).toHaveAttribute('data-v17-attribute','meaning');
});
