import {test,expect} from '@playwright/test';

async function seedReviewedCard(page){
  await page.goto('/?legacy=1');
  await expect(page.locator('#app')).toBeVisible({timeout:20000});
  const card=page.locator('.kanji').first();
  const character=(await card.textContent())?.trim();
  expect(character).toBeTruthy();
  await page.locator('#revealBtn').click();
  await expect(page.locator('#ratings')).toHaveClass(/show/);
  await page.locator('.rate[data-r="Good"]').click();
  await expect(page.locator('#revealBtn')).toBeVisible();
  return character;
}

test('v2 is the default presentation and the v1 presentation is no longer user-facing',async({page})=>{
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));

  const target=await seedReviewedCard(page);

  await page.goto('/?v2=1');
  await expect(page.locator('#v2App')).toBeVisible({timeout:20000});
  await expect(page.locator('#app')).toBeHidden();
  await expect(page.locator('#loading')).toBeHidden();
  await expect(page.locator('.wrap > header')).toBeHidden();
  await expect(page.locator('#v14EduTabs')).toHaveCount(0);
  await expect.poll(async()=>page.evaluate(()=>Boolean(window.__KANJI5_V19_V2_BOUNDARY__&&window.__KANJI5_EDU_BRIDGE__))).toBe(true);
  expect(pageErrors).toEqual([]);

  await page.evaluate(()=>{
    window.__KANJI5_V19_RECOVERY_NEXT_MODE__='production';
    window.__KANJI5_V19_RECOVERY_NEXT_MODE_USED__=false;
    window.__KANJI5_V16_SESSION_AUTH__={nextMode:()=> 'production',consumeMode:()=>{}};
  });
  await page.evaluate(async()=>{await window.__KANJI5_EDU_BRIDGE__.start();});
  const choices=page.locator('#v2ProductionChoices button');
  await expect(choices).toHaveCount(4,{timeout:10000});
  await expect(page.locator('#v2AnswerInput')).toBeHidden();

  const values=await choices.evaluateAll(nodes=>nodes.map(node=>node.textContent?.trim()||''));
  expect(values).toContain(target);
  const wrong=values.find(value=>value!==target);
  expect(wrong).toBeTruthy();

  await choices.filter({hasText:wrong}).click();
  await expect(page.locator('#v2App')).toContainText('نادرست',{timeout:10000});
  await expect(page.locator('#v2Retry')).toBeVisible({timeout:10000});

  await page.locator('#v2Retry').click();
  await expect(page.locator('#v2ProductionChoices button')).toHaveCount(4,{timeout:10000});
  await page.locator('#v2ProductionChoices button').filter({hasText:target}).click();
  await expect(page.locator('#v2App')).toContainText('درست',{timeout:10000});

  const attempts=await page.evaluate(ch=>{
    const k=JSON.parse(localStorage.getItem('kanji5-v1.2-knowledge')||'{}');
    return Number(k?.[ch]?.production?.attempts||0);
  },target);
  expect(attempts).toBe(2);

  await page.reload();
  await expect(page.locator('#v2App')).toBeVisible({timeout:20000});
  await expect(page.locator('#app')).toBeHidden();
});
