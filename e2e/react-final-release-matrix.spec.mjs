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

    // Establish the documented education precondition: active recall requires at least one seen kanji.
    const reveal=page.locator('#root .learning-card-front .button.primary.wide');
    await expect(reveal).toBeVisible();
    await reveal.click();
    await page.getByRole('button',{name:'خوب',exact:true}).click();

    await recall.click();
    await expect(recall).toHaveAttribute('aria-current','page');
    await expect(page.locator('#root .practice-home')).toBeVisible({timeout:5000});
    await page.getByRole('button',{name:'شروع تمرین',exact:true}).click();
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


for(const viewport of [
  {name:'tablet',width:768,height:1024},
  {name:'mobile-landscape',width:844,height:390},
]){
  test('final React responsive shell — '+viewport.name,async({page})=>{
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    await page.goto('/');
    await expect(page.locator('#root .app-shell')).toBeVisible({timeout:20000});

    const metrics=await page.evaluate(()=>{
      const viewport=window.innerWidth;
      const offenders=[...document.querySelectorAll('*')].map(el=>({el,rect:el.getBoundingClientRect()})).filter(({rect})=>rect.right>viewport+1||rect.left<-1).slice(0,20).map(({el,rect})=>({tag:el.tagName,className:typeof el.className==='string'?el.className:'',id:el.id,left:rect.left,right:rect.right,width:rect.width}));
      console.log('RESPONSIVE_OVERFLOW_DIAGNOSTIC',JSON.stringify({viewport,scrollWidth:document.documentElement.scrollWidth,bodyScrollWidth:document.body.scrollWidth,offenders}));
      return {
        overflow:document.documentElement.scrollWidth>window.innerWidth+1 || document.body.scrollWidth>window.innerWidth+1,
        offenders,
        navHeight:document.querySelector('.experience-nav')?.getBoundingClientRect().height||0,
        bottomSafePadding:getComputedStyle(document.querySelector('.mobile-study-flow')||document.body).paddingBottom
      };
    });
    if(metrics.overflow) throw new Error("RESPONSIVE_OVERFLOW "+JSON.stringify(metrics.offenders));
    expect(metrics.overflow).toBe(false);
    expect(metrics.navHeight).toBeGreaterThanOrEqual(44);
  });
}
