import {test,expect} from '@playwright/test';

async function clean(page){
  page.on('pageerror',error=>console.error(`[E2E_PAGEERROR] ${error?.stack||error}`));
  page.on('console',message=>{if(message.type()==='error')console.error(`[E2E_CONSOLE_ERROR] ${message.text()}`)});
  await page.goto('/');
  await page.evaluate(()=>{for(const key of Object.keys(localStorage))if(key.startsWith('kanji5-'))localStorage.removeItem(key);sessionStorage.clear()});
  await page.reload();
  await expect(page.locator('#root .app-shell')).toBeVisible({timeout:20000});
}

test('Statistics dialog exposes the seven-day activity chart',async({page})=>{
  await clean(page);
  await page.getByRole('button',{name:'بیشتر',exact:true}).click();
  await expect(page.locator('#header-tools-menu')).toHaveClass(/open/);
  await page.locator('#header-tools-menu').getByRole('button',{name:'آمار',exact:true}).click();
  const dialog=page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-labelledby','stats-title');
  await expect(dialog.locator('.stats-activity-section')).toBeVisible();
  await expect(dialog.locator('.activity-chart')).toBeVisible();
  await expect(dialog.locator('.activity-bar-wrap')).toHaveCount(7);
  await expect(dialog.locator('.activity-bar-wrap .activity-label')).toHaveCount(7);
  await expect(dialog.locator('.stats-activity-total strong')).toHaveText(/\S/);
});
