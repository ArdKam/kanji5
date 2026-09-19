import {test,expect} from '@playwright/test';

test('React presentation is the default static-shell renderer without starting the legacy renderer',async({page})=>{
  await page.goto('/?legacy=1');
  await page.evaluate(()=>{
    for(const key of Object.keys(localStorage)) if(key.startsWith('kanji5-')) localStorage.removeItem(key);
    sessionStorage.clear();
  });
  await page.goto('/');
  await expect(page.locator('#root .app-shell')).toBeVisible({timeout:20000});
  await expect(page.locator('#v2App')).toHaveCount(0);
  await expect(page.locator('#root .daily-summary')).toBeVisible({timeout:10000});
  await expect.poll(async()=>page.evaluate(()=>Boolean(window.__KANJI5_V19_V2_BOUNDARY__&&window.__KANJI5_EDU_BRIDGE__))).toBe(true);
});

test('explicit v2 fallback remains available after the default switch',async({page})=>{
  await page.goto('/?v2=1');
  await expect(page.locator('#v2App')).toBeVisible({timeout:20000});
  await expect(page.locator('#root .app-shell')).toHaveCount(0);
  await expect.poll(async()=>page.evaluate(()=>Boolean(window.__KANJI5_V19_V2_BOUNDARY__))).toBe(true);
});

test('React learning and review actions stay behind the v1.9/v2 boundary',async({page})=>{
  await page.goto('/?legacy=1');
  await page.evaluate(()=>{
    for(const key of Object.keys(localStorage)) if(key.startsWith('kanji5-')) localStorage.removeItem(key);
    sessionStorage.clear();
  });
  await page.goto('/?react=1');
  await expect(page.locator('#root .learning-card, #root .card').first()).toBeVisible({timeout:20000});
  const kanji=page.locator('#root .kanji-display');
  await expect(kanji).toHaveText(/\S/);
  await page.getByRole('button',{name:'نمایش اطلاعات کانجی'}).click();
  await expect(page.getByText('کیفیت مرور بعدی را انتخاب کن.')).toBeVisible({timeout:10000});
  await page.getByRole('button',{name:'خوب'}).click();
  await expect(kanji).toHaveText(/\S/,{timeout:10000});
});

test('React exercise path can start, submit and display boundary-backed feedback',async({page})=>{
  await page.goto('/?legacy=1');
  await page.evaluate(()=>{
    for(const key of Object.keys(localStorage)) if(key.startsWith('kanji5-')) localStorage.removeItem(key);
    sessionStorage.clear();
  });
  await page.reload();
  await expect(page.locator('#app')).toBeVisible({timeout:20000});
  await page.locator('#revealBtn').click();
  await expect(page.locator('#ratings')).toHaveClass(/show/);
  await page.locator('.rate[data-r="Good"]').click();
  await expect(page.locator('#revealBtn')).toBeVisible();

  await page.goto('/?react=1');
  await expect(page.locator('#root .app-shell')).toBeVisible({timeout:20000});
  const reactCharacter=await page.locator('#root .kanji-display').innerText();
  await page.evaluate(character=>{
    window.__KANJI5_V19_RECOVERY_TARGET__={mode:'production',character};
  },reactCharacter);
  await page.getByRole('button',{name:'تمرین آموزشی'}).click();
  await expect(page.locator('#root #exercise')).toBeVisible({timeout:10000});
  await expect.poll(async()=>page.evaluate(()=>window.__KANJI5_V19_V2_BOUNDARY__?.snapshot?.().then(s=>s.exercise?.mode))).toBe('production',{timeout:10000});
  await expect.poll(async()=>page.locator('#root .production-grid').count()).toBe(1,{timeout:10000});
  await expect(page.locator('#root .production-choice')).toHaveCount(4,{timeout:10000});
  await page.locator('#root .production-choice').first().click();
  await expect(page.locator('#root .feedback')).toBeVisible({timeout:10000});
});
