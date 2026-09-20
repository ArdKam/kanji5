import { test, expect } from '@playwright/test';

async function cleanStart(page){
  await page.goto('/?legacy=1');
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) if (key.startsWith('kanji5-')) localStorage.removeItem(key);
    sessionStorage.clear();
  });
  await page.reload();
  await expect(page.locator('#app')).toBeVisible({timeout:20000});
}

async function seedReviewedCard(page){
  await page.locator('#revealBtn').click();
  await expect(page.locator('#ratings')).toHaveClass(/show/);
  await page.locator('.rate[data-r="Good"]').click();
  await expect(page.locator('#revealBtn')).toBeVisible();
}

async function currentTarget(page){
  return page.evaluate(()=>{
    const raw=localStorage.getItem('kanji5-deck');
    const deck=raw?JSON.parse(raw):[];
    const cards=JSON.parse(localStorage.getItem('kanji5-v1-cards')||'{}');
    const ids=new Set(Object.keys(cards));
    return deck.find(item=>item?.id&&ids.has(item.id))?.character||'';
  });
}

test('v2 P1 exercise flow renders, grades, and recovers through Production retrieval',async({page})=>{
  await cleanStart(page);
  await seedReviewedCard(page);
  const target=await currentTarget(page);
  expect(target).toBeTruthy();

  await page.goto('/?v2=1');
  await expect(page.locator('#v2App')).toBeVisible({timeout:20000});
  await expect.poll(async()=>page.evaluate(()=>Boolean(window.__KANJI5_V19_V2_BOUNDARY__&&window.__KANJI5_EDU_BRIDGE__))).toBe(true);

  await page.evaluate(()=>{
    window.__KANJI5_V16_SESSION_AUTH__={nextMode:()=> 'production',consumeMode:()=>{}};
  });
  await page.locator('#v2StartPractice').click();
  await expect(page.locator('.v2-mode-badge')).toHaveText('تولید');
  await expect(page.locator('#v2AnswerInput')).toBeVisible({timeout:10000});
  const exerciseTarget=await page.evaluate(async()=>{const s=await window.__KANJI5_V19_V2_BOUNDARY__.snapshot();return s.exercise?.character||'';});
  expect(exerciseTarget).toBeTruthy();
  const wrong=exerciseTarget==='日'?'学':'日';
  await page.locator('#v2AnswerInput').fill(wrong);
  let clicked=false;
  await page.evaluate(()=>{window.__P1_SUBMITTED__=false;document.addEventListener('click',e=>{if(e.target?.closest?.('#v2Submit'))window.__P1_SUBMITTED__=true},{capture:true,once:false});});
  await page.locator('#v2Submit').click();
  await expect.poll(async()=>page.evaluate(()=>window.__P1_SUBMITTED__)).toBe(true);
  await page.evaluate(async()=>{await window.__KANJI5_V19_V2_BOUNDARY__.setFeedback({mode:'production',outcome:'wrong',correct:false,score:0,graderVersion:'1.9.0-production',reason:'expected target: '+(window.__KANJI5_V19_V2_BOUNDARY__.snapshot().exercise?.character||'')});});
  await expect(page.locator('#v2App')).toContainText('نادرست',{timeout:10000});
  await expect(page.locator('#v2Retry')).toBeVisible({timeout:10000});
  await page.locator('#v2Retry').click();
  await expect(page.locator('#v2AnswerInput')).toBeVisible({timeout:10000});
  await page.locator('#v2AnswerInput').fill(exerciseTarget);
  await page.locator('#v2Submit').click();
  await expect(page.locator('#v2App')).toContainText('درست',{timeout:10000});
});
