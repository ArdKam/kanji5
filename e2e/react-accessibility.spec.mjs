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
