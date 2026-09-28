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


test('dictionary accordion controls only reference panels that are present in the DOM', async ({page})=>{
  await clean(page);

  await page.getByRole('button',{name:'واژه‌نامه'}).click();
  await expect(page.locator('.dictionary-page')).toBeVisible({timeout:10000});
  const tile=page.locator('.kanji-catalog-tile').first();
  await expect(tile).toBeVisible({timeout:10000});
  await tile.click();

  const dialog=page.locator('.dictionary-card-dialog:visible');
  await expect(dialog).toBeVisible();
  const structure=dialog.getByRole('button',{name:'ساختار',exact:true});
  await expect(structure).toHaveAttribute('aria-expanded','false');
  await expect(structure).not.toHaveAttribute('aria-controls',/.+/);

  await structure.click();
  await expect(structure).toHaveAttribute('aria-expanded','true');
  const controls=await structure.getAttribute('aria-controls');
  expect(controls).toBeTruthy();
  await expect(dialog.locator('#'+controls)).toBeVisible();

  await structure.click();
  await expect(structure).toHaveAttribute('aria-expanded','false');
  await expect(dialog.locator('#'+controls)).toHaveCount(0);
  await expect(structure).not.toHaveAttribute('aria-controls',/.+/);
});

test('stroke-order accordion control keeps aria-controls synchronized with its rendered panel', async ({page})=>{
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
  await expect(pager).toBeVisible();
  const pages=card.locator(".learning-back-page");
  for(let i=0;i<4;i++) await pages.nth(0).locator("xpath=..").locator(".pager-button").last().dispatchEvent("click");
  const trigger=card.locator(".stroke-order-tool-trigger");
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded","false");
  await expect(trigger).not.toHaveAttribute("aria-controls",/.+/);

  await trigger.click();
  const panel=card.locator(".stroke-order-panel.is-expanded");
  await expect(panel).toBeVisible();
  const toggle=panel.locator(".stroke-order-toggle");
  await expect(toggle).toHaveAttribute("aria-expanded","true");
  await expect(toggle).toHaveAttribute("aria-controls","stroke-order-content");
  await expect(panel.locator("#stroke-order-content")).toBeVisible();
});
