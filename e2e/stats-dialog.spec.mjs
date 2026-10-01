import {test,expect} from '@playwright/test';

async function clean(page){
  page.on('pageerror',error=>console.error(\`[E2E_PAGEERROR] \${error?.stack||error}\`));
  page.on('console',message=>{if(message.type()==='error')console.error(\`[E2E_CONSOLE_ERROR] \${message.text()}\`)});
  await page.goto('/');
  await page.evaluate(()=>{for(const key of Object.keys(localStorage))if(key.startsWith('kanji5-'))localStorage.removeItem(key);sessionStorage.clear()});
  await page.reload();
  await expect(page.locator('#root .app-shell')).toBeVisible({timeout:20000});
}

async function openStats(page,language='fa'){
  await page.getByRole('button',{name:language==='fa'?'بیشتر':'More',exact:true}).click();
  await expect(page.locator('#header-tools-menu')).toHaveClass(/open/);
  await page.locator('#header-tools-menu').getByRole('button',{name:language==='fa'?'آمار':'Stats',exact:true}).click();
  return page.getByRole('dialog');
}

test('Statistics dialog exposes a focused progress dashboard',async({page})=>{
  await clean(page);
  const dialog=await openStats(page);
  await expect(dialog).toHaveAttribute('aria-labelledby','stats-title');
  await expect(dialog.locator('.stats-header')).toBeVisible();
  await expect(dialog.locator('.stats-overview')).toBeVisible();
  await expect(dialog.locator('.stats-overview-primary')).toBeVisible();
  await expect(dialog.locator('.stats-metric')).toHaveCount(3);
  await expect(dialog.locator('.stats-activity-section')).toBeVisible();
  await expect(dialog.locator('.activity-chart')).toBeVisible();
  await expect(dialog.locator('.activity-bar-wrap')).toHaveCount(7);
  await expect(dialog.locator('.activity-bar-wrap .activity-label')).toHaveCount(7);
  await expect(dialog.locator('.stats-dashboard .dialog-grid')).toHaveCount(0);
  await expect(dialog.locator('.stats-dashboard .stats-hero')).toHaveCount(0);
});

test('Statistics dashboard switches labels consistently to English',async({page})=>{
  await clean(page);
  const dialog=await openStats(page,'fa');
  await expect(dialog).toBeVisible();
  await page.getByRole('button',{name:'بیشتر',exact:true}).click();
  await page.locator('#header-tools-menu').getByRole('button',{name:'English',exact:true}).click();
  await expect(dialog.locator('.stats-header h2')).toHaveText('Your learning progress');
  await expect(dialog.locator('.stats-activity')).toContainText('7-day review activity');
  await expect(dialog.locator('.stats-overview')).toContainText('Jōyō coverage');
});
