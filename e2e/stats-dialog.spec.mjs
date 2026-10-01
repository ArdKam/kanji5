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
  await expect(dialog.locator('.stats-advanced')).toBeVisible();
  await expect(dialog.locator('.stats-advanced')).not.toHaveAttribute('open', '');
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


test('Learning profile reflects persisted skill data after a real app reload',async({page})=>{
  await clean(page);
  await page.evaluate(()=>{
    const at=new Date().toISOString();
    localStorage.setItem('kanji5-v1.2-knowledge',JSON.stringify({学:{exposedAt:at,meaning:{attempts:1,correct:1,lastAt:at,lastCorrect:true}}}));
  });
  await page.reload();
  await expect(page.locator('#root .app-shell')).toBeVisible({timeout:20000});
  await expect.poll(async()=>page.evaluate(()=>Boolean(window.__KANJI5_V19_LEARNER_MODEL__)),{timeout:10000}).toBe(true);
  await expect.poll(async()=>page.evaluate(()=>Number((window.__KANJI5_V19_LEARNER_MODEL__?.read?.().attributes?.meaning?.confidence)||0)),{timeout:10000}).toBeGreaterThan(0);
  const dialog=await openStats(page);
  await expect(dialog.locator('.stats-skill-row').first().locator('strong')).not.toHaveText('۰٪');
});


test('Advanced statistics stay collapsed until explicitly opened',async({page})=>{
  await clean(page);
  await page.evaluate(()=>{
    const at=new Date().toISOString();
    localStorage.setItem('kanji5-v1.2-knowledge',JSON.stringify({
      学:{exposedAt:at,meaning:{attempts:3,correct:2,lastAt:at,lastCorrect:true}}
    }));
  });
  await page.reload();
  await expect(page.locator('#root .app-shell')).toBeVisible({timeout:20000});
  const dialog=await openStats(page);
  const advanced=dialog.locator('.stats-advanced');
  await expect(advanced).toBeVisible();
  await expect(advanced).not.toHaveAttribute('open', '');
  await advanced.locator('summary').click();
  await expect(advanced).toHaveAttribute('open', '');
  await expect(advanced.locator('.stats-advanced-table')).toBeVisible();
  await expect(advanced).toContainText('Accuracy');
  await expect(advanced).toContainText('Attempts');
  await expect(advanced.locator('.stats-advanced-row').nth(1)).toContainText('66%');
});
