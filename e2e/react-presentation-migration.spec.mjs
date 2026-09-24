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

test('Kanji dictionary searches by character and shows structured study metadata',async({page})=>{
  await clean(page);
  await page.getByRole('button',{name:'بیشتر',exact:true}).click();
  await page.locator('#header-tools-menu').getByRole('button',{name:'فرهنگ کانجی',exact:true}).click();
  const dialog=page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const search=dialog.getByRole('textbox',{name:'کانجی، خوانش یا معنی را جست‌وجو کن'});
  await search.fill('学');
  await expect(dialog.locator('.dictionary-result').first()).toBeVisible({timeout:10000});
  await expect(dialog.locator('.dictionary-character').first()).toHaveText('学');
  await expect(dialog.locator('.dictionary-readings')).toContainText('ガク');
  await expect(dialog.locator('.dictionary-meta')).toContainText('JLPT');
  await expect(dialog.locator('.dictionary-meta')).toContainText('استروک');
  await expect(dialog.locator('.dictionary-meta')).toContainText('پایه');
});

test('mastery visualization renders skill signals and seven-day review activity',async({page})=>{
  await clean(page);
  await page.locator('.insights summary').click();
  await expect(page.locator('.mastery-grid')).toBeVisible();
  await expect(page.locator('.mastery-row')).toHaveCount(5);
  await expect(page.locator('.mastery-track[role="progressbar"]').first()).toHaveAttribute('aria-valuenow');
  await expect(page.locator('.activity-chart')).toBeVisible();
  await expect(page.locator('.activity-bar-wrap')).toHaveCount(7);
});


test("personal mnemonic can be saved, edited, cleared, and survives a reload", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("kanji5-ui-language", "en"));
  await page.goto("/");
  const card = page.locator("#root .learning-card");
  await expect(card).toBeVisible({ timeout: 20000 });

  await page.getByRole("button", { name: "Show kanji information" }).click();
  await expect(card).toHaveClass(/is-revealed/, { timeout: 10000 });
  await page.waitForTimeout(700);

  const editor = card.locator(".mnemonic-editor textarea");
  await expect(editor).toBeVisible();
  await editor.fill("A student learning under a roof.");
  await card.getByRole("button", { name: "Save mnemonic" }).click();
  await expect(card.locator(".mnemonic-saved p")).toHaveText("A student learning under a roof.");

  await page.reload();
  const reloadedCard = page.locator("#root .learning-card");
  await expect(reloadedCard).toBeVisible({ timeout: 20000 });
  if (!(await reloadedCard.evaluate((el) => el.classList.contains("is-revealed")))) {
    await reloadedCard.getByRole("button", { name: "Show kanji information" }).click();
    await expect(reloadedCard).toHaveClass(/is-revealed/, { timeout: 10000 });
  }
  await page.waitForTimeout(700);
  await expect(reloadedCard.locator(".mnemonic-saved p")).toHaveText("A student learning under a roof.");

  await reloadedCard.getByRole("button", { name: "Edit" }).click();
  await reloadedCard.locator(".mnemonic-editor textarea").fill("A different memory hook.");
  await reloadedCard.getByRole("button", { name: "Save mnemonic" }).click();
  await expect(reloadedCard.locator(".mnemonic-saved p")).toHaveText("A different memory hook.");

  await reloadedCard.getByRole("button", { name: "Edit" }).click();
  await reloadedCard.locator(".mnemonic-editor textarea").fill("");
  await reloadedCard.getByRole("button", { name: "Save mnemonic" }).click();
  await expect(reloadedCard.locator(".mnemonic-editor textarea")).toBeVisible();
  await expect(reloadedCard.locator(".mnemonic-saved")).toHaveCount(0);
});
