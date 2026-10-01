import {test,expect} from '@playwright/test';

async function clean(page){
  page.on('pageerror',error=>console.error(`[E2E_PAGEERROR] ${error?.stack||error}`));
  page.on('console',message=>{if(message.type()==='error')console.error(`[E2E_CONSOLE_ERROR] ${message.text()}`)});
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
  await dialog.locator('.dialog-close').click();
  await page.getByRole('button',{name:'بیشتر',exact:true}).click();
  await page.locator('#header-tools-menu').getByRole('button',{name:'English',exact:true}).click();
  await expect(page.locator('#header-tools-menu')).toHaveClass(/open/);
  await page.locator('#header-tools-menu').getByRole('button',{name:'Stats',exact:true}).click();
  const englishDialog=page.getByRole('dialog');
  await expect(englishDialog.locator('.stats-header h2')).toHaveText('Your learning progress');
  await expect(englishDialog.locator('.stats-activity')).toContainText('7-day review activity');
  await expect(englishDialog.locator('.stats-overview')).toContainText('Jōyō coverage');
});

test('Statistics mastery distribution respects seen kanji exposure',async({page})=>{
  await clean(page);
  const distribution=await page.evaluate(async()=>{
    const state=window.__KANJI5_STATE__;
    const now=new Date().toISOString();
    state.writeKnowledge({
      学:{exposedAt:now},
      日:{exposedAt:now}
    });
    await window.__KANJI5_V19_LEARNER_MODEL__?.update?.();
    const snapshot=await window.__KANJI5_V19_V2_BOUNDARY__?.snapshot?.();
    return snapshot?.stats?.masteryDistribution||null;
  });
  expect(distribution).not.toBeNull();
  expect(distribution.total).toBe(2136);
  expect(distribution.learning).toBeGreaterThanOrEqual(2);
  expect(distribution.unseen).toBeLessThan(2136);
  expect(distribution.unseen + distribution.learning + distribution.attention + distribution.stable + distribution.mastered).toBe(2136);
});
