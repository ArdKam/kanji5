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

async function startSession(page){
  await page.locator('#v16Start').click();
  await expect(page.locator('#v16Start')).toBeHidden();
  await expect(page.locator('#v16FinishExternal')).toBeVisible();
  await page.locator('#v16DashboardToggle').click();
  await expect(page.locator('#v16Session')).toBeVisible();
}

async function prepareProduction(page){
  const character=(await page.locator('.kanji').textContent())?.trim();
  const id=await page.locator('.kanji').getAttribute('data-kanji-id');
  expect(character).toBeTruthy();
  expect(id).toBeTruthy();
  await page.locator('#revealBtn').click();
  await expect(page.locator('#ratings')).toHaveClass(/show/);
  await page.locator('.rate[data-r="Again"]').click();
  await page.evaluate(({character,id})=>{
    const raw=localStorage.getItem('kanji5-v1-cards');
    const cards=raw?JSON.parse(raw):{};
    if(!cards[id]?.card)throw new Error('persisted card missing');
    const future=new Date(Date.now()+365*24*60*60*1000).toISOString();
    for(const [key,value] of Object.entries(cards)) if(key!==id&&value?.card)value.card.due=future;
    cards[id].card.due=new Date(Date.now()-1000).toISOString();
    localStorage.setItem('kanji5-v1-cards',JSON.stringify(cards));
    localStorage.setItem('kanji5-v1.2-knowledge',JSON.stringify({[character]:{
      meaning:{attempts:30,correct:29},
      reading:{attempts:30,correct:29},
      production:{attempts:30,correct:2},
      vocabulary:{attempts:30,correct:29},
      context:{attempts:30,correct:29}
    }}));
    localStorage.removeItem('kanji5-v1.6-session-history');
  },{character,id});
  return character;
}

test('renders Production as a real learner-input exercise and persists the outcome',async({page})=>{
  await cleanStart(page);
  await startSession(page);
  const character=await prepareProduction(page);
  await page.reload();
  await page.locator('#v16Start').click();
  await expect(page.locator('#v16FinishExternal')).toBeVisible();
  await page.locator('#v16DashboardToggle').click();
  await expect(page.locator('#v16Session')).toBeVisible();
  await page.locator('#revealBtn').click();
  const gate=page.locator('.v12-recall-gate');
  await expect(gate).toHaveAttribute('data-v17-attribute','production');
  await page.locator('#v12RecallInput').fill('not-the-answer');
  await page.locator('#v12SubmitRecall').click();
  await page.waitForTimeout(250);
  const knowledge=await page.evaluate(character=>JSON.parse(localStorage.getItem('kanji5-v1.2-knowledge')||'{}')[character]?.production||null,character);
  expect(knowledge?.attempts).toBeGreaterThan(0);
});

test('production education pane asks the learner to produce the Kanji',async({page})=>{
  await cleanStart(page);
  await startSession(page);
  const character=await prepareProduction(page);
  await page.goto('/');
  await expect(page.locator('#app')).toBeVisible({timeout:20_000});
  await page.locator('#v16Start').click();
  await expect(page.locator('#v16FinishExternal')).toBeVisible();
  await page.locator('#v16DashboardToggle').click();
  await expect(page.locator('#v16Session')).toBeVisible();
  await page.locator('[data-tab="education"]').click();
  await expect(page.locator('#v14EducationPane')).toBeVisible();
  await expect(page.locator('#v14EducationPane')).toContainText(character);
});
