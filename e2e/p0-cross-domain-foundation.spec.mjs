import { test, expect } from '@playwright/test';

async function cleanStart(page){
  await page.goto('/?legacy=1');
  await page.evaluate(()=>{
    for(const key of Object.keys(localStorage))if(key.startsWith('kanji5-'))localStorage.removeItem(key);
    sessionStorage.clear();localStorage.setItem('kanji5-onboarding-v2','complete');
  });
  await page.reload();
  await expect(page.locator('#app')).toBeVisible({timeout:20000});
}

test('P0 migrates legacy Kanji cards to typed identities without changing storage keys',async({page})=>{
  await cleanStart(page);
  const seeded=await page.evaluate(()=>{
    const deck=JSON.parse(localStorage.getItem('kanji5-deck')||'[]');
    const item=deck.find(x=>x?.id&&x?.character);
    if(!item)throw new Error('Kanji deck unavailable');
    const cards={};
    cards[item.id]={card:{due:new Date(Date.now()+86400000).toISOString()}};
    localStorage.setItem('kanji5-v1-cards',JSON.stringify(cards));
    return {id:item.id,character:item.character};
  });
  await page.reload();
  await expect(page.locator('#app')).toBeVisible({timeout:20000});
  const migrated=await page.evaluate(id=>JSON.parse(localStorage.getItem('kanji5-v1-cards')||'{}')[id]||null,seeded.id);
  expect(migrated).toMatchObject({
    identitySchemaVersion:1,
    domain:'kanji',
    contentId:'kanji:'+seeded.character,
    skill:'integrated',
    exercise:'scheduled-review'
  });
  expect(migrated.cardId).toBe('card:kanji:'+seeded.character+':integrated:scheduled-review');
  const keys=await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('kanji5-v1-cards')||'{}')));
  expect(keys).toContain(seeded.id);
});

test('P0 migrates context card metadata without changing the legacy storage key',async({page})=>{
  await cleanStart(page);
  const seeded=await page.evaluate(()=>{
    const deck=JSON.parse(localStorage.getItem('kanji5-deck')||'[]');
    const item=deck.find(x=>x?.character);
    if(!item)throw new Error('Kanji deck unavailable');
    const key='legacy-context-card';
    const cards={};
    cards[key]={domain:'context',sourceId:'tatoeba:123',card:{due:new Date(Date.now()+86400000).toISOString()}};
    localStorage.setItem('kanji5-v1-cards',JSON.stringify(cards));
    return {key};
  });
  await page.reload();
  await expect(page.locator('#app')).toBeVisible({timeout:20000});
  const migrated=await page.evaluate(key=>JSON.parse(localStorage.getItem('kanji5-v1-cards')||'{}')[key]||null,seeded.key);
  expect(migrated).toMatchObject({
    identitySchemaVersion:1,
    domain:'context',
    contentId:'context:tatoeba:123',
    skill:'integrated',
    exercise:'scheduled-review'
  });
  expect(migrated.cardId).toBe('card:context:tatoeba:123:integrated:scheduled-review');
  const keys=await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('kanji5-v1-cards')||'{}')));
  expect(keys).toContain(seeded.key);
});

test('P0 persists domain metadata on active sessions',async({page})=>{
  await cleanStart(page);
  await expect(page.locator('#v16Start')).toBeVisible({timeout:20000});
  await page.locator('#v16Start').click();
  const active=await page.evaluate(()=>JSON.parse(localStorage.getItem('kanji5-v1.6-session-history')||'[]').find(x=>x?.status==='active'));
  expect(active?.domain).toBe('kanji');
  expect(active?.domainSchemaVersion).toBe(1);
});

test('P0 preserves domain metadata on session mode results',async({page})=>{
  await cleanStart(page);
  await expect(page.locator('#v16Start')).toBeVisible({timeout:20000});
  await page.locator('#v16Start').click();
  await page.evaluate(()=>{
    document.dispatchEvent(new CustomEvent('kanji5:v1.6-education-result',{detail:{
      mode:'vocabulary',
      domain:'vocabulary',
      skill:'meaning',
      exercise:'type-answer',
      contentId:'vocabulary:test-1',
      correct:true,
      outcome:'correct',
      quality:'exact',
      score:1,
      schemaVersion:1,
      graderVersion:'p0-test',
      character:'日',
      sessionEligible:true,
      independent:true
    }}));
  });
  await expect.poll(async()=>page.evaluate(()=>{
    const row=JSON.parse(localStorage.getItem('kanji5-v1.6-session-history')||'[]').find(x=>x?.status==='active');
    return row?.modeResults?.vocabulary?.domain||'';
  }),{timeout:10000}).toBe('vocabulary');
  const active=await page.evaluate(()=>JSON.parse(localStorage.getItem('kanji5-v1.6-session-history')||'[]').find(x=>x?.status==='active'));
  expect(active.modeResults.vocabulary).toMatchObject({
    domain:'vocabulary',
    skill:'meaning',
    exercise:'type-answer',
    contentId:'vocabulary:test-1'
  });
});

test('P0 network content adapters expose stable content identities',async({page})=>{
  await page.route('https://kanjiapi.dev/v1/words/**',route=>route.fulfill({
    status:200,
    contentType:'application/json',
    body:JSON.stringify([{variants:[{written:'学校',pronounced:'がっこう'}],meanings:[{glosses:['school']}]}])
  }));
  await page.route('https://api.tatoeba.org/v1/sentences**',route=>route.fulfill({
    status:200,
    contentType:'application/json',
    body:JSON.stringify({data:[{id:123,text:'学校へ行く。',translations:[[{text:'I go to school.'}]]}]})
  }));
  const result=await page.evaluate(async()=>{
    const network=await import('./v1.5-network.js');
    return {
      words:await network.fetchWords('学'),
      sentences:await network.fetchContextSentences('学')
    };
  });
  expect(result.words[0].contentId).toMatch(/^vocabulary:[0-9a-f]{8}$/);
  expect(result.sentences[0].contentId).toBe('context:tatoeba:123');
});

test('P0 React shell has no horizontal overflow at mobile baselines',async({page})=>{
  for(const width of [360,375,390]){
    await page.setViewportSize({width,height:844});
    await page.goto('/');
    await expect(page.locator('#root .app-shell')).toBeVisible({timeout:20000});
    const metrics=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));
    expect(metrics.scrollWidth-metrics.clientWidth).toBeLessThanOrEqual(1);
  }
});
