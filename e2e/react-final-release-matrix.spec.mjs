import { test, expect } from '@playwright/test';

const viewports=[
  {name:'desktop',width:1280,height:800},
  {name:'mobile',width:390,height:844}
];

for(const viewport of viewports){
  test('final React release matrix — '+viewport.name,async({page})=>{
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    await page.goto('/');
    await expect(page.locator('#root .app-shell')).toBeVisible({timeout:20000});

    const learning=page.getByRole('button',{name:'یادگیری'});
    const recall=page.getByRole('button',{name:'یادآوری فعال'});
    await expect(learning).toHaveAttribute('aria-current','page');
    await expect(page.locator('.audio-button').first()).toBeVisible();

    await recall.click();
    await expect(recall).toHaveAttribute('aria-current','page');
    await expect(page.locator('#exercise')).toBeVisible({timeout:10000});
    await expect(page.locator('#root .daily-summary')).toHaveCount(0);

    await learning.click();
    await expect(learning).toHaveAttribute('aria-current','page');
    await expect(page.locator('#exercise')).toHaveCount(0);
    await expect(page.locator('.card').first()).toBeVisible();
    if(viewport.width>760){
      const learningBox=await page.locator('.learning-card').boundingBox();
      const summaryBox=await page.locator('.daily-summary').boundingBox();
      expect(learningBox).toBeTruthy();
      expect(summaryBox).toBeTruthy();
      expect(summaryBox.y).toBeGreaterThan(learningBox.y+learningBox.height-1);
    }

    await page.getByRole('button',{name:'بیشتر'}).click();
    await expect(page.locator('.header-menu-trigger')).toBeVisible();
    await expect(page.locator('#header-tools-menu')).toHaveClass(/open/);
    await page.locator('#header-tools-menu').getByRole('button',{name:'تنظیمات'}).click();
    await expect(page.locator('#settings-title')).toBeVisible();
    await page.getByRole('button',{name:'پاک کردن پیشرفت'}).click();
    await expect(page.locator('#root .app-shell')).toBeVisible();
    await page.reload();
    await expect(page.locator('#root .app-shell')).toBeVisible({timeout:20000});
  });
}
