import {test,expect} from '@playwright/test';

async function clean(page){
  await page.goto('/');
  await page.evaluate(()=>{for(const key of Object.keys(localStorage))if(key.startsWith('kanji5-'))localStorage.removeItem(key);sessionStorage.clear()});
  await page.reload();
  await expect(page.locator('#root .app-shell')).toBeVisible({timeout:20000});
}

test('React is the sole default presentation renderer',async({page})=>{
  await clean(page);
  await expect(page.locator('#root .daily-summary')).toBeVisible({timeout:10000});
  await expect(page.locator('#v2App')).toHaveCount(0);
  await expect(page.locator('.wrap, #app, #loading')).toHaveCount(0);
  await expect.poll(async()=>page.evaluate(()=>Boolean(window.__KANJI5_V19_V2_BOUNDARY__&&window.__KANJI5_EDU_BRIDGE__))).toBe(true);
});

test('React learning and review actions stay behind the authoritative boundary',async({page})=>{
  await clean(page);
  const kanji=page.locator('#root .kanji-display');
  await expect(kanji).toHaveText(/\S/);
  await page.getByRole('button',{name:/نمایش (پاسخ|اطلاعات کانجی)/}).click();
  await expect(page.getByText('کیفیت مرور بعدی را انتخاب کن.')).toBeVisible({timeout:10000});
  await page.getByRole('button',{name:'خوب'}).click();
  await expect(kanji).toHaveText(/\S/,{timeout:10000});
});

test('React exercise path can start and expose a boundary-backed exercise',async({page})=>{
  await clean(page);
  await page.getByRole('button',{name:'تمرین آموزشی'}).click();
  await expect(page.locator('#root #exercise')).toBeVisible({timeout:10000});
  await expect.poll(async()=>page.evaluate(()=>window.__KANJI5_V19_V2_BOUNDARY__?.snapshot?.()?.exercise?.mode)).toMatch(/meaning|reading|production|vocabulary|context/);
});