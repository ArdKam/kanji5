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

test('React presentation meets core keyboard, focus, motion and touch-target accessibility checks', async ({page})=>{
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
  await expect(page.locator('#exercise')).toBeVisible({timeout:10000});
  await expect(page.locator('#exercise')).toHaveAttribute('tabindex','-1');
});
