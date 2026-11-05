import {test,expect} from '@playwright/test';

async function installContentFixtures(page){
  await page.addInitScript(()=>{
    const originalFetch=window.fetch.bind(window);
    window.fetch=async(input,init)=>{
      const url=typeof input==='string'?input:input instanceof Request?input.url:'';
      if(url.includes('kanjiapi.dev/v1/words/')){
        const character=decodeURIComponent(url.split('/').pop()||'').trim()||'学';
        const word=character+'生';
        return new Response(JSON.stringify([{meanings:[{glosses:['student']}],variants:[{written:word,pronounced:'がくせい'}]}]),{status:200,headers:{'content-type':'application/json'}});
      }
      if(url.includes('api.tatoeba.org/v1/sentences')){
        const match=/[?&]q=([^&]+)/.exec(url),character=match?decodeURIComponent(match[1]).trim():'学';
        const sentence='私は'+character+'を知っています。';
        return new Response(JSON.stringify({data:[{id:123456,text:sentence,translations:[[{text:'I know this character.'}]]}]}),{status:200,headers:{'content-type':'application/json'}});
      }
      return originalFetch(input,init);
    };
  });
}
async function clean(page){
  await installContentFixtures(page);
  await page.goto('/');
  await page.evaluate(()=>{
    for(const key of Object.keys(localStorage))if(key.startsWith('kanji5-'))localStorage.removeItem(key);
    sessionStorage.clear();
    localStorage.setItem('kanji5-onboarding-v2','complete');
  });
  await page.reload();
  await expect(page.locator('#root .app-shell')).toBeVisible({timeout:20000});
}
async function seedSeenCard(page){
  await expect(page.locator('#root .learning-card')).toBeVisible({timeout:10000});
  await page.locator('#root .learning-card .button.wide').click();
  await expect(page.locator('#root .learning-card .rating-good')).toBeVisible({timeout:5000});
  await page.locator('#root .learning-card .rating-good').click();
  await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('kanji5-v1-reviews')||'[]').length),{timeout:10000}).toBeGreaterThan(0);
}
for(const mode of ['vocabulary','context']){
  test('recovery does not substitute an unrelated '+mode+' target',async({page})=>{
    await clean(page);
    await seedSeenCard(page);
    const target=await page.evaluate(mode=>{
      const character=String(document.querySelector('#root .learning-card .kanji-display')?.textContent||'').trim();
      const contentId=character+':__missing_recovery_target__';
      return {character,mode,contentId,taskId:character+':'+mode+':'+contentId};
    },mode);
    expect(target.character).not.toBe('');
    const result=await page.evaluate(async target=>{
      let unavailable=null;
      document.addEventListener('kanji5:v1.9-recovery-target-unavailable',event=>{unavailable=event.detail},{once:true});
      const started=await window.__KANJI5_EDU_BRIDGE__.start(target);
      return {started,unavailable};
    },target);
    expect(result.started).toMatchObject({started:false,reason:'recovery-target-unavailable'});
    expect(result.started.cause).toBe(mode==='vocabulary'?'vocabulary-target-unavailable':'context-target-unavailable');
    expect(result.unavailable).toMatchObject({reason:'recovery-target-unavailable',taskId:target.taskId,contentId:target.contentId});
  });
}
