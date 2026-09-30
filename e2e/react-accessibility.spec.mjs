import { test, expect } from '@playwright/test';

async function clean(page){
  await page.goto('/');
  await page.evaluate(()=>{
    for(const key of Object.keys(localStorage)) if(key.startsWith('kanji5-')) localStorage.removeItem(key);
    sessionStorage.clear();
  });
  await page.reload();
  await expect(page.locator('#root .app-shell')).toBeVisible({timeout:20000});
}

test('React presentation meets core keyboard, focus, motion and touch-target accessibility checks with current rendered controls', async ({page})=>{
  await clean(page);

  const semantics=await page.evaluate(()=>({
    skipHref:document.querySelector('.skip-link')?.getAttribute('href'),
    progressRole:document.querySelector('.progress')?.getAttribute('role'),
    progressLabel:document.querySelector('.progress')?.getAttribute('aria-label'),
    navLabel:document.querySelector('.experience-nav')?.getAttribute('aria-label'),
    feedbackLive:document.querySelector('.feedback')?.getAttribute('aria-live'),
    feedbackTabIndex:document.querySelector('.feedback')?.getAttribute('tabindex'),
  }));
  expect(semantics.skipHref).toBe('#primary-content');
  expect(semantics.progressRole).toBe('progressbar');
  expect(semantics.progressLabel).toBeTruthy();
  expect(semantics.navLabel).toBe('مسیر یادگیری');

  const buttons=await page.locator('button:visible').evaluateAll(nodes=>nodes.map(node=>({
    text:(node.textContent||'').trim(),
    aria:node.getAttribute('aria-label')||'',
    classes:node.className,
    minHeight:parseFloat(getComputedStyle(node).minHeight),
  })));
  const undersized=buttons.filter(button=>button.minHeight<44);
  expect(undersized, JSON.stringify(undersized)).toEqual([]);

  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();

  await page.emulateMedia({reducedMotion:'reduce'});
  const motion=await page.evaluate(()=>({
    matches:matchMedia('(prefers-reduced-motion: reduce)').matches,
    progressTransition:getComputedStyle(document.querySelector('.progress > span')).transitionDuration
  }));
  expect(motion.matches).toBe(true);
  expect(parseFloat(motion.progressTransition)).toBeLessThanOrEqual(0.01);

  // Establish the documented education precondition: active recall requires at least one seen kanji.
  const reveal=page.locator('#root .learning-card-front .button.primary.wide');
  await expect(reveal).toBeVisible();
  await reveal.click();
  await page.getByRole('button',{name:'خوب',exact:true}).click();
  await page.getByRole('button',{name:'یادآوری فعال'}).click();
  await expect(page.locator('#root .practice-home')).toBeVisible({timeout:5000});
  await page.getByRole('button',{name:'شروع تمرین',exact:true}).click();
  await expect(page.locator('#exercise')).toBeVisible({timeout:10000});
  await expect(page.locator('#exercise')).toHaveAttribute('tabindex','-1');
});

test('dictionary card uses stable tabs with one active content viewport', async ({page})=>{
  await clean(page);

  await page.getByRole('button',{name:'فرهنگ کانجی'}).click();
  await expect(page.locator('.dictionary-page')).toBeVisible({timeout:10000});
  const tile=page.locator('.kanji-catalog-tile').first();
  await expect(tile).toBeVisible({timeout:10000});
  await tile.dispatchEvent('click');

  const dialog=page.locator('.dictionary-card-dialog:visible');
  await expect(dialog).toBeVisible();
  const dialogBounds=await dialog.boundingBox();
  expect(dialogBounds?.height ?? 0).toBeGreaterThan(400);
  const tabs=dialog.getByRole('tab');
  await expect(tabs).toHaveCount(5);
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(100);
  const mobileNav=dialog.locator('.dictionary-section-nav');
  const mobileMetrics=await mobileNav.evaluate((nav)=>({
    clientWidth:nav.clientWidth,
    scrollWidth:nav.scrollWidth,
    tabs:Array.from(nav.querySelectorAll('.dictionary-section-tab')).map((tab)=>{
      const r=tab.getBoundingClientRect();
      return {left:r.left,right:r.right,width:r.width};
    }),
  }));
  expect(mobileMetrics.scrollWidth).toBeLessThanOrEqual(mobileMetrics.clientWidth+1);
  const navBounds=await mobileNav.boundingBox();
  expect(navBounds).not.toBeNull();
  const navLeft=navBounds?.x ?? 0;
  const navRight=navLeft+(navBounds?.width ?? 0);
  for(const tab of mobileMetrics.tabs){
    expect(tab.width).toBeGreaterThanOrEqual(40);
    expect(tab.left).toBeGreaterThanOrEqual(navLeft-1);
    expect(tab.right).toBeLessThanOrEqual(navRight+1);
  }
  const overview=dialog.getByRole('tab',{name:'نمای کلی',exact:true});
  const structure=dialog.getByRole('tab',{name:'کالبد',exact:true});
  await expect(overview).toHaveAttribute('aria-selected','true');
  await expect(structure).toHaveAttribute('aria-selected','false');
  await expect(dialog.locator('.dictionary-tabpanel')).toHaveCount(1);

  const initialScroll=await dialog.evaluate((node)=>node.scrollTop);
  expect(initialScroll).toBe(0);

  await structure.click();
  await expect(structure).toHaveAttribute('aria-selected','true');
  await expect(overview).toHaveAttribute('aria-selected','false');
  const controls=await structure.getAttribute('aria-controls');
  expect(controls).toBeTruthy();
  await expect(dialog.locator('#'+controls)).toBeVisible();
  await expect(dialog.locator('.dictionary-tabpanel')).toHaveCount(1);

  const content=dialog.locator('.dictionary-card-content');
  await expect(content).toHaveCount(1);
  const structureScroll=await content.evaluate((node)=>node.scrollTop);
  expect(structureScroll).toBe(0);
  await structure.press('ArrowRight');
  await expect(overview).toHaveAttribute('aria-selected','true');
  await overview.press('ArrowLeft');
  await expect(structure).toHaveAttribute('aria-selected','true');
});

test('learning card reveal moves focus out of the aria-hidden face and emits no aria-hidden focus warning', async ({page})=>{
  const ariaWarnings=[];
  page.on('console',message=>{
    if(message.type()==='warning'&&message.text().includes('Blocked aria-hidden')) ariaWarnings.push(message.text());
  });

  await clean(page);

  const reveal=page.locator('#root .learning-card-front .button.primary.wide');
  await expect(reveal).toBeVisible();
  await reveal.focus();
  await expect(reveal).toBeFocused();

  await reveal.click();

  await expect(page.locator('#root .learning-card-back')).toHaveAttribute('aria-hidden','false');
  await expect.poll(async()=>page.evaluate(()=>{
    const active=document.activeElement;
    const front=document.querySelector('.learning-card-front');
    const back=document.querySelector('.learning-card-back');
    return {
      inFront:active instanceof Node&&front?.contains(active)===true,
      inBack:active instanceof Node&&back?.contains(active)===true,
    };
  })).toEqual({inFront:false,inBack:true});

  expect(ariaWarnings).toEqual([]);
});


test('changing the learning-card information page clears focus before hiding the previous page', async ({page})=>{
  const ariaWarnings=[];
  page.on('console',message=>{
    if(message.type()==='warning'&&message.text().includes('Blocked aria-hidden')) ariaWarnings.push(message.text());
  });

  await clean(page);
  const card=page.locator('#root .learning-card');
  await card.getByRole('button',{name:'نمایش اطلاعات کانجی'}).click();
  await expect(card.locator('.learning-back-page.active')).toBeVisible();

  const overviewAudio=card.locator('.learning-back-page.active .audio-button').first();
  await expect(overviewAudio).toBeVisible();
  await overviewAudio.focus();
  await expect(overviewAudio).toBeFocused();

  await card.locator('.learning-back-page-nav .pager-button').last().click();
  await expect(card.locator('.learning-back-page.active')).toHaveAttribute('aria-label','نمونهٔ واژگانی');
  await expect.poll(async()=>page.evaluate(()=>{
    const active=document.activeElement;
    const hiddenPage=document.querySelector('.learning-back-page[aria-hidden="true"]');
    return active instanceof Node&&hiddenPage?.contains(active)===true;
  })).toBe(false);

  expect(ariaWarnings).toEqual([]);
});

test('rating a revealed learning card clears focus before the back face is hidden', async ({page})=>{
  const ariaWarnings=[];
  page.on('console',message=>{
    if(message.type()==='warning'&&message.text().includes('Blocked aria-hidden')) ariaWarnings.push(message.text());
  });

  await clean(page);
  const card=page.locator('#root .learning-card');
  await card.getByRole('button',{name:'نمایش اطلاعات کانجی'}).click();
  await expect(card).toHaveClass(/is-revealed/,{timeout:10000});
  await page.waitForTimeout(520);
  const rating=card.locator('.rating-grid button').nth(2);
  await expect(rating).toBeEnabled();
  await rating.focus();
  await expect(rating).toBeFocused();
  await rating.click();

  await expect.poll(async()=>page.evaluate(()=>{
    const active=document.activeElement;
    const back=document.querySelector('.learning-card-back');
    return active instanceof Node&&back?.contains(active)===true;
  })).toBe(false);
  expect(ariaWarnings).toEqual([]);
});

test('learning-card Stroke Order exposes pause and resume while playing', async ({page})=>{
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg"><g id="kvg:StrokePaths_05b66"><path id="kvg:05b66-s1" d="M10,10 L30,30"/><path id="kvg:05b66-s2" d="M30,30 L50,10"/></g></svg>`;
  await page.route("https://raw.githubusercontent.com/KanjiVG/kanjivg/422b5538595676da918c288a4230cb5e22a1ee7e/kanji/**.svg", async route => {
    await route.fulfill({status:200,contentType:"image/svg+xml",body:svg});
  });
  await page.addInitScript(()=>localStorage.setItem("kanji5-ui-language","en"));
  await page.goto("/");
  const card=page.locator("#root .learning-card");
  await expect(card).toBeVisible({timeout:20000});
  await card.getByRole("button",{name:"Show kanji information"}).click();
  const pager=card.locator(".learning-back-page-nav");
  const nextPage=pager.locator(".pager-button").last();
  await nextPage.dispatchEvent("click");
  await nextPage.dispatchEvent("click");
  await nextPage.dispatchEvent("click");
  const panel=card.locator(".learning-back-page.active .stroke-order-panel");
  await expect(panel).toBeVisible();
  const play=panel.getByRole("button",{name:"Play stroke order"});
  await expect(play).toBeVisible();
  await play.click();
  await expect(panel.getByRole("button",{name:"Pause"})).toBeVisible();
  await panel.getByRole("button",{name:"Pause"}).click();
  await expect(panel.getByRole("button",{name:"Play stroke order"})).toBeVisible();
});

test('secondary pages hide the persistent experience navigation', async ({page})=>{
  await clean(page);
  await page.getByRole('button',{name:'تنظیمات'}).click();
  await expect(page.locator('.secondary-page-host')).toBeVisible({timeout:5000});
  await expect(page.locator('.experience-nav')).toHaveCount(0);
  const close=page.locator('.secondary-page-host').getByRole('button',{name:'بستن',exact:true});
  await close.click();
  await expect(page.locator('.experience-nav')).toBeVisible();
});

test('learning-card Stroke Order is permanently open and has no accordion trigger', async ({page})=>{
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg">
<g id="kvg:StrokePaths_05b66">
  <path id="kvg:05b66-s1" d="M10,10 L30,30"/>
  <path id="kvg:05b66-s2" d="M30,30 L50,10"/>
  <path id="kvg:05b66-s3" d="M50,10 L70,30"/>
</g>
</svg>`;
  await page.route("https://raw.githubusercontent.com/KanjiVG/kanjivg/422b5538595676da918c288a4230cb5e22a1ee7e/kanji/**.svg", async route => {
    await route.fulfill({status:200,contentType:"image/svg+xml",body:svg});
  });
  await page.addInitScript(()=>localStorage.setItem("kanji5-ui-language","en"));
  await page.goto("/");
  const card=page.locator("#root .learning-card");
  await expect(card).toBeVisible({timeout:20000});
  await card.getByRole("button",{name:"Show kanji information"}).click();
  await expect(card).toHaveClass(/is-revealed/,{timeout:10000});
  const pager=card.locator(".learning-back-page-nav");
  const nextPage=pager.locator(".pager-button").last();
  for(let i=0;i<3;i++){
    await expect(nextPage).toBeEnabled();
    await nextPage.dispatchEvent("click");
    await page.waitForTimeout(520);
  }

  const panel=card.locator(".learning-back-page.active .stroke-order-panel");
  await expect(panel).toBeVisible();
  await expect(panel).toHaveClass(/is-expanded/);
  await expect(panel).toHaveAttribute("data-stroke-order-open","true");
  await expect(card.locator(".stroke-order-tool-trigger")).toHaveCount(0);
  await expect(panel.locator(".stroke-order-toggle")).toHaveCount(0);
  await expect(panel.locator("#stroke-order-content")).toHaveCount(1);
  await expect(panel).toHaveAttribute("aria-labelledby","stroke-order-title");
});

test('dictionary search exposes a stable no-results state and selection dialog restores focus',async({page})=>{
  await clean(page);
  await page.getByRole('button',{name:'فرهنگ کانجی'}).click();
  await expect(page.locator('.dictionary-page')).toBeVisible({timeout:10000});
  const search=page.locator('.dictionary-page-search input');
  await search.fill('zzzzzz-no-kanji');
  await expect(page.locator('.dictionary-empty[role="status"]')).toBeVisible();
  await expect(page.locator('.kanji-catalog-tile')).toHaveCount(0);
  await search.fill('学');
  const tile=page.locator('.kanji-catalog-tile').filter({hasText:'学'}).first();
  await expect(tile).toBeVisible({timeout:10000});
  await tile.focus();
  await tile.click();
  const dialog=page.locator('.dictionary-card-dialog:visible');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button',{name:'بستن',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(tile).toBeFocused();
});


test('React presentation stays usable at the narrow 320px boundary without horizontal overflow',async({page})=>{
  await clean(page);
  await page.setViewportSize({width:320,height:800});
  await page.reload();
  await expect(page.locator('#root .app-shell')).toBeVisible({timeout:20000});
  const metrics=await page.evaluate(()=>({
    viewport:document.documentElement.clientWidth,
    scrollWidth:document.documentElement.scrollWidth,
    bodyScrollWidth:document.body.scrollWidth,
    contentWidth:document.querySelector('.app-shell')?.getBoundingClientRect().width??0,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewport+1);
  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.viewport+1);
  expect(metrics.contentWidth).toBeLessThanOrEqual(metrics.viewport+1);
  await expect(page.locator('.experience-nav')).toBeVisible();
  await expect(page.getByRole('button',{name:'یادآوری فعال'})).toBeVisible();
});


test('dictionary search clear, detailed bounds, and persistent dismiss affordance remain stable',async({page})=>{
  await clean(page);
  await page.getByRole('button',{name:'فرهنگ کانجی'}).click();
  const pageRoot=page.locator('.dictionary-page');
  await expect(pageRoot).toBeVisible({timeout:10000});

  const search=pageRoot.locator('.dictionary-page-search input');
  await search.fill('学');
  const clear=pageRoot.getByRole('button',{name:'پاک کردن جست‌وجو',exact:true});
  await expect(clear).toBeVisible();
  await clear.click();
  await expect(search).toHaveValue('');
  await expect(pageRoot.locator('.kanji-catalog-tile')).toHaveCount(2136);

  const matrix=pageRoot.getByRole('button',{name:'نمای شبکه',exact:true});
  const detailed=pageRoot.getByRole('button',{name:'نمای جزئیات',exact:true});
  await expect(matrix).toHaveAttribute('aria-pressed','true');
  await expect(matrix).toBeVisible();
  await expect(detailed).toBeVisible();
  await expect(matrix.locator('.dictionary-view-icon svg')).toHaveCount(1);
  await expect(detailed.locator('.dictionary-view-icon svg')).toHaveCount(1);
  await expect(detailed).toHaveAttribute('aria-pressed','false');
  await detailed.click();
  await expect(matrix).toHaveAttribute('aria-pressed','false');
  await expect(detailed).toHaveAttribute('aria-pressed','true');
  await expect(pageRoot.locator('.kanji-catalog-grid')).toHaveClass(/is-detailed/);
  await expect(pageRoot.locator('.kanji-catalog-tile.is-detailed')).toHaveCount(160);
  await expect(pageRoot.getByRole('button',{name:'نمایش بیشتر',exact:true})).toBeVisible();
  await expect(pageRoot.getByText('۱۶۰ از ۲۱۳۶ نتیجه نمایش داده شده',{exact:true})).toBeVisible();
  await pageRoot.getByRole('button',{name:'نمایش بیشتر',exact:true}).click();
  await expect(pageRoot.locator('.kanji-catalog-tile.is-detailed')).toHaveCount(320);
  await expect(pageRoot.getByText('۳۲۰ از ۲۱۳۶ نتیجه نمایش داده شده',{exact:true})).toBeVisible();

  const tile=pageRoot.locator('.kanji-catalog-tile.is-detailed').first();
  await tile.click();
  const dialog=page.locator('.dictionary-card-dialog:visible');
  const close=dialog.getByRole('button',{name:'بستن',exact:true});
  await expect(close).toBeVisible();
  await page.waitForTimeout(4500);
  await expect(close).toBeVisible();
});

test('English dictionary presentation localizes card controls and uses the shared audio icon',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('kanji5-ui-language','en'));
  await page.goto('/');
  await expect(page.locator('#root .app-shell')).toBeVisible({timeout:20000});
  await page.getByRole('button',{name:'Kanji dictionary'}).click();
  await expect(page.locator('.dictionary-page')).toBeVisible({timeout:10000});
  const tile=page.locator('.kanji-catalog-tile').first();
  await expect(tile).toBeVisible({timeout:10000});
  await tile.click();
  const dialog=page.locator('.dictionary-card-dialog:visible');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.dictionary-section-nav')).toHaveAttribute('aria-label','Card options');
  await expect(dialog.getByRole('tab',{name:'Overview'})).toBeVisible();
  await expect(dialog.getByRole('tab',{name:'Anatomy'})).toBeVisible();
  await expect(dialog.getByRole('tab',{name:'Writing'})).toBeVisible();
  await expect(dialog.getByRole('tab',{name:'Words'})).toBeVisible();
  await expect(dialog.getByRole('tab',{name:'Mnemonic'})).toHaveCount(1);
  const dictionaryAudio = dialog.locator('.dictionary-audio-button');
  expect(await dictionaryAudio.count()).toBeGreaterThan(0);
  await expect(dictionaryAudio.first()).toHaveAttribute('aria-label',/Play kanji pronunciation/);
  await expect(dictionaryAudio.first().locator('svg')).toHaveCount(1);
});


test('English shell does not retain Persian presentation labels',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('kanji5-ui-language','en'));
  await page.goto('/');
  await expect(page.locator('#root .app-shell')).toBeVisible({timeout:20000});
  await expect(page.locator('.header .eyebrow')).toHaveText('Smart learning');
  await expect(page.locator('.header h1')).toHaveText('Kanji-yar');
  await expect(page.locator('.daily-summary')).toHaveAttribute('aria-label',"Today’s summary");
  await expect(page.locator('.header-menu-trigger')).toHaveAttribute('aria-label','More');
  await page.locator('.header-menu-trigger').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('button',{name:'Close menu'})).toBeVisible();
});
