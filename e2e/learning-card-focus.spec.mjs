import {test,expect} from '@playwright/test';

async function clean(page){
  await page.goto('/');
  await page.evaluate(()=>{for(const key of Object.keys(localStorage))if(key.startsWith('kanji5-'))localStorage.removeItem(key);sessionStorage.clear()});
  await page.reload();
  await expect(page.locator('#root .app-shell')).toBeVisible({timeout:20000});
}

test('learning card reveal never leaves focus inside an aria-hidden face',async({page})=>{
  const ariaWarnings=[];
  page.on('console',message=>{
    if(message.type()==='warning'&&message.text().includes('Blocked aria-hidden'))ariaWarnings.push(message.text());
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
