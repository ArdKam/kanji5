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

async function forceVocabularyMode(page){
  await page.evaluate(async()=>{
    await import('./v1.6-session-feedback.js');
    window.__KANJI5_V16_SESSION_AUTH__={nextMode:()=> 'vocabulary',consumeMode:()=>{}};
  });
}

async function openVocabulary(page){
  await forceVocabularyMode(page);
  const character=await page.evaluate(()=>{
    const deck=JSON.parse(localStorage.getItem('kanji5-deck')||'[]');
    const cards=JSON.parse(localStorage.getItem('kanji5-v1-cards')||'{}');
    const ids=new Set(Object.keys(cards));
    return deck.find(item=>item?.id&&ids.has(item.id))?.character||'';
  });
  expect(character).toBeTruthy();
  await page.route('https://kanjiapi.dev/v1/words/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{variants:[{written:`${character}生`,pronounced:'がくせい'}],meanings:[{glosses:['student']}]}])}));
  await page.locator('[data-tab="education"]').click();
  const pane=page.locator('#v14EducationPane');
  await expect(pane.locator('#v14EduVocabularyInput')).toBeVisible({timeout:10_000});
  return {pane,character,word:`${character}生`};
}

test('renders Vocabulary Recall without leaking the answer and persists wrong outcome',async({page})=>{
  await cleanStart(page);
  await seedReviewedCard(page);
  await startReview(page);
  const {pane,character,word}=await openVocabulary(page);
  await expect(pane.locator('#v14EduVocabularyInput')).not.toHaveAttribute('placeholder',new RegExp(word));
  await pane.locator('#v14EduVocabularyInput').fill('学校');
  await pane.locator('#v14EduSubmit').click();
  await expect(pane).toContainText('پاسخ نادرست بود');
  const vocabulary=await page.evaluate(ch=>JSON.parse(localStorage.getItem('kanji5-v1.2-knowledge')||'{}')[ch]?.vocabulary||null,character);
  expect(vocabulary?.attempts).toBeGreaterThan(0);
  expect(vocabulary?.correct).toBe(0);
});

test('grades an exact Vocabulary response as correct',async({page})=>{
  await cleanStart(page);
  await seedReviewedCard(page);
  await startReview(page);
  const {pane,character,word}=await openVocabulary(page);
  await pane.locator('#v14EduVocabularyInput').fill(word);
  await pane.locator('#v14EduSubmit').click();
  await expect(pane).toContainText('پاسخ درست بود');
  const vocabulary=await page.evaluate(ch=>JSON.parse(localStorage.getItem('kanji5-v1.2-knowledge')||'{}')[ch]?.vocabulary||null,character);
  expect(vocabulary?.attempts).toBeGreaterThan(0);
  expect(vocabulary?.correct).toBeGreaterThan(0);
});

test('does not record an empty Vocabulary submission',async({page})=>{
  await cleanStart(page);
  await seedReviewedCard(page);
  await startReview(page);
  const {pane,character}=await openVocabulary(page);
  await pane.locator('#v14EduVocabularyInput').fill('');
  await pane.locator('#v14EduSubmit').click();
  await expect(pane.locator('#v14EduVocabularyInput')).toBeVisible();
  const vocabulary=await page.evaluate(ch=>JSON.parse(localStorage.getItem('kanji5-v1.2-knowledge')||'{}')[ch]?.vocabulary||null,character);
  expect(vocabulary).toBeFalsy();
});

test('survives reload through the education state boundary',async({page})=>{
  await cleanStart(page);
  await seedReviewedCard(page);
  await startReview(page);
  const {pane,character,word}=await openVocabulary(page);
  await pane.locator('#v14EduVocabularyInput').fill(word);
  await pane.locator('#v14EduSubmit').click();
  await expect(pane).toContainText('پاسخ درست بود');
  const before=await page.evaluate(ch=>JSON.parse(localStorage.getItem('kanji5-v1.2-knowledge')||'{}')[ch]?.vocabulary?.attempts||0,character);
  expect(before).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator('#app')).toBeVisible({timeout:20_000});
  await expect(page.locator('#v16Start')).toBeHidden();
  await expect(page.locator('#v16FinishExternal')).toBeVisible();
  await page.locator('#v16DashboardToggle').click();
  await expect(page.locator('#v16Session')).toBeVisible();
  await forceVocabularyMode(page);
  await page.route('https://kanjiapi.dev/v1/words/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{variants:[{written:`${character}生`,pronounced:'がくせい'}],meanings:[{glosses:['student']}]}])}));
  await page.locator('[data-tab="education"]').click();
  await expect(page.locator('#v14EduVocabularyInput')).toBeVisible({timeout:10_000});
  const after=await page.evaluate(ch=>JSON.parse(localStorage.getItem('kanji5-v1.2-knowledge')||'{}')[ch]?.vocabulary?.attempts||0,character);
  expect(after).toBeGreaterThanOrEqual(before);
});
