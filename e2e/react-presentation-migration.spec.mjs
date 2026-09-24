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
  await page.getByRole('button',{name:/نمایش (پاسخ|اطلاعات کانجی)/}).dispatchEvent('click');
  await expect(page.locator('.rating-grid')).toBeVisible({timeout:10000});
  await page.getByRole('button',{name:'خوب'}).dispatchEvent('click');
  await expect(kanji).toHaveText(/\S/,{timeout:10000});
});

test('React exercise path can start and expose a boundary-backed exercise',async({page})=>{
  await clean(page);
  await page.getByRole('button',{name:'یادآوری فعال'}).click();
  await expect(page.locator('#root #exercise')).toBeVisible({timeout:10000});
  await expect.poll(async()=>page.evaluate(async()=>Boolean((await window.__KANJI5_V19_V2_BOUNDARY__?.snapshot?.())?.exercise))).toBe(true);
});

test('React presentation can switch between Persian and English and persist the choice',async({page})=>{
  await clean(page);
  await expect(page.locator('html')).toHaveAttribute('lang','fa');
  await expect(page.locator('html')).toHaveAttribute('dir','rtl');
  await expect(page.getByRole('button',{name:'فارسی',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'بیشتر',exact:true}).click();
  await expect(page.locator('#header-tools-menu')).toHaveClass(/open/);
  await page.locator('#header-tools-menu').getByRole('button',{name:'تنظیمات',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('button',{name:'فارسی',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('dialog').getByRole('button',{name:'English',exact:true}).click();
  await expect(page.locator('html')).toHaveAttribute('lang','en');
  await expect(page.locator('html')).toHaveAttribute('dir','ltr');
  await expect(page.getByRole('button',{name:'English',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).last().click();
  await page.getByRole('button',{name:'More',exact:true}).click();
  await expect(page.locator('#header-tools-menu')).toHaveClass(/open/);
  await expect(page.locator('#header-tools-menu').getByRole('button',{name:'Stats',exact:true})).toBeVisible();
  await expect(page.locator('#header-tools-menu').getByRole('button',{name:'Settings',exact:true})).toBeVisible();
  await page.locator('#header-tools-menu').getByRole('button',{name:'Settings',exact:true}).click();
  await expect(page.getByRole('dialog').getByRole('button',{name:'English',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.locator(".experience-nav .experience-tab").nth(0)).toHaveText("Learning");
  await expect(page.locator(".experience-nav .experience-tab").nth(0)).toHaveAttribute('aria-current','page');
  await page.getByRole('dialog').getByRole('button',{name:'فارسی',exact:true}).click();
  await expect(page.locator('html')).toHaveAttribute('lang','fa');
  await expect(page.locator('html')).toHaveAttribute('dir','rtl');
  await page.getByRole('dialog').getByRole('button',{name:'English',exact:true}).click();
  await expect(page.locator('html')).toHaveAttribute('lang','en');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang','en');
  await expect(page.locator('html')).toHaveAttribute('dir','ltr');
  await page.getByRole('button',{name:'More',exact:true}).click();
  await expect(page.locator('#header-tools-menu')).toHaveClass(/open/);
  await expect(page.locator('#header-tools-menu').getByRole('button',{name:'Stats',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Settings',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button',{name:'فارسی',exact:true}).click();
  await expect(page.locator('html')).toHaveAttribute('lang','fa');
  await expect(page.locator('html')).toHaveAttribute('dir','rtl');
});


test('English learning rating buttons are ordered Easy, Good, Hard, Again',async({page})=>{
  await clean(page);
  await page.getByRole('button',{name:'بیشتر',exact:true}).click();
  await expect(page.locator('#header-tools-menu')).toHaveClass(/open/);
  await page.locator('#header-tools-menu').getByRole('button',{name:'تنظیمات',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'English',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).first().click();
  await expect(page.locator('#root .learning-card')).toBeVisible({timeout:10000});
  await page.getByRole('button',{name:'Show kanji information',exact:true}).click();
  await expect(page.locator('.rating-grid')).toBeVisible({timeout:10000});
  await expect(page.locator('.rating-grid .rating')).toHaveText(['Easy','Good','Hard','Again']);
});


test('empty session progress indicator is absent before a session starts',async({page})=>{
  await clean(page);
  await expect(page.locator('.session-progress')).toHaveCount(0);
});
