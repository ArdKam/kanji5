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

async function pinDueCard(page,id){
  await page.evaluate(async id=>{const raw=localStorage.getItem('kanji5-v1-cards');const cards=raw?JSON.parse(raw):{};if(!id||!cards[id]?.card)throw new Error('persisted card missing');const future=new Date(Date.now()+365*24*60*60*1000).toISOString();for(const [key,value] of Object.entries(cards))if(key!==id&&value?.card)value.card.due=future;cards[id].card.due=new Date(Date.now()-1000).toISOString();localStorage.setItem('kanji5-v1-cards',JSON.stringify(cards));await new Promise(r=>setTimeout(r,50));},id);
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
    const future=new Date(Date.now()+365*24*60*60*1000).toISOString();
    for(const [key,value] of Object.entries(cards)) if(key!==id&&value?.card) value.card.due=future;
    cards[id].card.due=new Date(Date.now()-1000).toISOString();
    localStorage.setItem('kanji5-v1-cards',JSON.stringify(cards));
    localStorage.setItem('kanji5-v1.2-knowledge',JSON.stringify({[character]:{meaning:{attempts:20,correct:19},reading:{attempts:20,correct:2},production:{attempts:20,correct:18},vocabulary:{attempts:20,correct:19},context:{attempts:20,correct:18}}}));
    localStorage.removeItem('kanji5-v1.6-session-history');
  },{character,id:firstId});
  await pinDueCard(page,firstId);
  return {character,firstId};
}

function persistReadingIntent(page,character,attributes=['reading','meaning']){
  return page.evaluate(({character,attributes})=>{
    localStorage.setItem('kanji5-v1.7-recall-intent',JSON.stringify({schemaVersion:1,character,attribute:'reading',attributes,generatedAt:new Date().toISOString()}));
  },{character,attributes});
}

async function readComponentReadings(page,character){
  return page.evaluate(character=>{
    const raw=localStorage.getItem('kanji5-v1.5-components');
    const all=raw?JSON.parse(raw):{};
    return Object.values(all?.[character]?.reading||{});
  },character);
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
  const {firstId}=await prepareWeakReading(page);
  await page.reload();
  await pinDueCard(page,firstId);
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
  await pinDueCard(page,firstId);
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
  const {firstId}=await prepareWeakReading(page);
  await page.reload();
  await pinDueCard(page,firstId);
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
  const {firstId}=await prepareWeakReading(page);
  await page.reload();
  await pinDueCard(page,firstId);
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
  await pinDueCard(page,firstId);
  await startSession(page);
  await openDashboard(page);
  await page.locator('#revealBtn').click();
  await expect(page.locator('.v12-recall-gate')).toHaveAttribute('data-v17-attribute','meaning');
});

test('surfaces an alternate reading only after stable reading evidence', async ({ page }) => {
  await cleanStart(page);
  await startSession(page);
  await openDashboard(page);
  const {character,firstId}=await prepareWeakReading(page);
  const readingInfo=await page.evaluate((character)=>{
    const deck=JSON.parse(localStorage.getItem('kanji5-deck')||'[]');
    const item=deck.find(entry=>entry.character===character);
    const readings=Array.from(new Set([...(item?.on||[]),...(item?.kun||[])].map(value=>String(value||'').trim()).filter(Boolean)));
    return {readings};
  },character);
  expect(readingInfo.readings.length).toBeGreaterThanOrEqual(2);
  await page.evaluate(({character,reading})=>{
    const knowledge=JSON.parse(localStorage.getItem('kanji5-v1.2-knowledge')||'{}');
    const stats=knowledge[character].reading;
    stats.attempts=2;
    stats.correct=2;
    const key=reading.normalize('NFKC').trim().toLowerCase();
    stats.variants={ [key]:{reading,attempts:1,correct:1} };
    localStorage.setItem('kanji5-v1.2-knowledge',JSON.stringify(knowledge));
  },{character,reading:readingInfo.readings[0]});
  await persistReadingIntent(page,character);
  await page.reload();
  await pinDueCard(page,firstId);
  await startSession(page);
  await openDashboard(page);
  await page.locator('#revealBtn').click();
  const preThreshold=page.locator('.v12-recall-gate');
  await expect(preThreshold).toBeVisible({timeout:10_000});
  await expect(preThreshold).toHaveAttribute('data-v17-attribute','reading');
  await expect(preThreshold).toHaveAttribute('data-v17-reading-alternate','0');
  await expect(preThreshold).toContainText('خوانش');
  await page.evaluate(({character,reading})=>{
    const knowledge=JSON.parse(localStorage.getItem('kanji5-v1.2-knowledge')||'{}');
    const stats=knowledge[character].reading;
    stats.attempts=3;
    stats.correct=3;
    const key=reading.normalize('NFKC').trim().toLowerCase();
    stats.variants[key]={reading,attempts:1,correct:1};
    localStorage.setItem('kanji5-v1.2-knowledge',JSON.stringify(knowledge));
    localStorage.removeItem('kanji5-v1.6-session-history');
  },{character,reading:readingInfo.readings[0]});
  await page.reload();
  await pinDueCard(page,firstId);
  await startSession(page);
  await openDashboard(page);
  await page.locator('#revealBtn').click();
  const postThreshold=page.locator('.v12-recall-gate');
  await expect(postThreshold).toBeVisible({timeout:10_000});
  await expect(postThreshold).toHaveAttribute('data-v17-attribute','reading');
  await expect(postThreshold).toHaveAttribute('data-v17-reading-alternate','1');
  await expect(postThreshold).toHaveAttribute('data-v17-reading-target',readingInfo.readings[1]);
  await expect(postThreshold).toContainText('یک خوانش دیگر');
  await expect(postThreshold.locator('[data-v17-reason-text]')).toContainText('یک خوانش دیگر');
  await page.locator('#v12RecallInput').fill(readingInfo.readings[1]);
  await page.locator('#v12SubmitRecall').click();
  await page.waitForTimeout(350);
  const components=await readComponentReadings(page,character);
  expect(components.some(entry=>entry?.reading===readingInfo.readings[1]&&entry.attempts===1&&entry.correct===1)).toBe(true);
});

test('accepts romaji for a katakana on-reading and records that reading variant', async ({ page }) => {
  await cleanStart(page);
  await startSession(page);
  await openDashboard(page);
  const {character,firstId}=await prepareWeakReading(page);
  const info=await page.evaluate((character)=>{
    const deck=JSON.parse(localStorage.getItem('kanji5-deck')||'[]');
    const item=deck.find(entry=>entry.character===character);
    const on=String(item?.on?.[0]||'');
    const hira=on.replace(/[\u30a1-\u30f6]/g,char=>String.fromCharCode(char.charCodeAt(0)-0x60));
    const map={あ:'a',い:'i',う:'u',え:'e',お:'o',か:'ka',き:'ki',く:'ku',け:'ke',こ:'ko',さ:'sa',し:'shi',す:'su',せ:'se',そ:'so',た:'ta',ち:'chi',つ:'tsu',て:'te',と:'to',な:'na',に:'ni',ぬ:'nu',ね:'ne',の:'no',は:'ha',ひ:'hi',ふ:'fu',へ:'he',ほ:'ho',ま:'ma',み:'mi',む:'mu',め:'me',も:'mo',や:'ya',ゆ:'yu',よ:'yo',ら:'ra',り:'ri',る:'ru',れ:'re',ろ:'ro',わ:'wa',を:'wo',ん:'n',が:'ga',ぎ:'gi',ぐ:'gu',げ:'ge',ご:'go',ざ:'za',じ:'ji',ず:'zu',ぜ:'ze',ぞ:'zo',だ:'da',ぢ:'ji',づ:'zu',で:'de',ど:'do',ば:'ba',び:'bi',ぶ:'bu',べ:'be',ぼ:'bo',ぱ:'pa',ぴ:'pi',ぷ:'pu',ぺ:'pe',ぽ:'po'};
    let romaji='';
    for(const ch of hira)romaji+=map[ch]||ch;
    return {on,romaji};
  },character);
  expect(info.on).toBeTruthy();
  expect(info.romaji).toBeTruthy();
  await persistReadingIntent(page,character,['reading','meaning']);
  await page.reload();
  await pinDueCard(page,firstId);
  await startSession(page);
  await openDashboard(page);
  await page.locator('#revealBtn').click();
  await expect(page.locator('.v12-recall-gate')).toBeVisible({timeout:10_000});
  await expect(page.locator('.v12-recall-gate')).toHaveAttribute('data-v17-attribute','reading');
  await page.locator('#v12RecallInput').fill(info.romaji);
  await page.locator('#v12SubmitRecall').click();
  await expect(page.locator('.v12-recall-result')).toHaveCount(0);
  await page.waitForTimeout(350);
  const components=await readComponentReadings(page,character);
  expect(components.some(entry=>entry?.reading===info.on&&entry.attempts===1&&entry.correct===1)).toBe(true);
});
