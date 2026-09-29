import {test,expect} from '@playwright/test';

async function installContentFixtures(page){
  await page.addInitScript(()=>{
    const originalFetch=window.fetch.bind(window);
    window.fetch=async(input,init)=>{
      const url=typeof input==='string'?input:input instanceof Request?input.url:'';
      if(url.includes('kanjiapi.dev/v1/words/')){
        return new Response(JSON.stringify([{meanings:[{glosses:['student']}],variants:[{written:'学生',pronounced:'がくせい'}]}]),{status:200,headers:{'content-type':'application/json'}});
      }
      if(url.includes('api.tatoeba.org/v1/sentences')){
        return new Response(JSON.stringify({data:[{id:123456,text:'私は学生です。',translations:[[{text:'I am a student.'}]]}]}),{status:200,headers:{'content-type':'application/json'}});
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
  });
  await page.reload();
  await expect(page.locator('#root .app-shell')).toBeVisible({timeout:20000});
}

async function seedSeenCard(page){
  await expect(page.locator('#root .learning-card')).toBeVisible({timeout:10000});
  await page.locator('#root .learning-card .button.wide').click();
  await expect(page.locator('#root .learning-card .rating-good')).toBeVisible({timeout:5000});
  await page.locator('#root .learning-card .rating-good').click();
  await expect(page.locator('#root .learning-card')).toBeVisible({timeout:10000});
}

async function startForcedMode(page,mode){
  const character=(await page.locator('#root .learning-card .kanji-display').textContent()).trim();
  await page.evaluate(({character,mode})=>{window.__KANJI5_V19_RECOVERY_TARGET__={character,mode,contentId:character};},{character,mode});
  await page.getByRole('button',{name:'یادآوری فعال'}).click();
  await expect(page.locator('#root .practice-home')).toBeVisible({timeout:5000});
  await page.getByRole('button',{name:'شروع تمرین',exact:true}).click();
  await expect(page.locator('#root #exercise')).toBeVisible({timeout:15000});
  return character;
}

test('fresh Active Recall starts with core recall rather than higher-order content',async({page})=>{
  await clean(page);
  await seedSeenCard(page);
  await page.getByRole('button',{name:'یادآوری فعال'}).click();
  await expect(page.getByRole('button',{name:'شروع تمرین',exact:true})).toBeVisible({timeout:5000});
  await page.getByRole('button',{name:'شروع تمرین',exact:true}).click();
  await expect(page.locator('#root #exercise')).toBeVisible({timeout:15000});
  const mode=await page.evaluate(async()=>String((await window.__KANJI5_V19_V2_BOUNDARY__.snapshot()).exercise?.mode||''));
  expect(['meaning','reading']).toContain(mode);
});

test('unseen vocabulary is introduced before recall and wrong answers support recovery',async({page})=>{
  await clean(page);
  await seedSeenCard(page);
  const character=await startForcedMode(page,'vocabulary');
  const intro=await page.evaluate(async()=>await window.__KANJI5_V19_V2_BOUNDARY__.snapshot());
  expect(intro.exercise.mode).toBe('vocabulary');
  expect(intro.exercise.contentStage).toBe('introduction');
  expect(intro.exercise.stimulus.kind).toBe('vocabulary-intro');
  await expect(page.locator('#root .content-intro-stimulus')).toBeVisible();
  await expect(page.locator('#root .active-recall-intro-hint')).toBeVisible();
  await expect(page.getByRole('button',{name:'تمرین بعدی',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'تمرین بعدی',exact:true}).click();
  await expect(page.locator('#root .active-recall-choice-grid')).toBeVisible();
  const guided=await page.evaluate(async()=>await window.__KANJI5_V19_V2_BOUNDARY__.snapshot());
  expect(guided.exercise.contentStage).not.toBe('introduction');
  expect(guided.exercise.contentId).toContain(character+':');
  const choiceData=await page.evaluate(async()=>{
    const snapshot=await window.__KANJI5_V19_V2_BOUNDARY__.snapshot();
    return {target:String(snapshot.exercise?.character||''),choices:Array.from(document.querySelectorAll('#root #exercise .active-recall-choice')).map(node=>String(node.textContent||'').replace(/[1-4]/g,'').trim())};
  });
  const wrong=choiceData.choices.find(value=>value&&value!==choiceData.target);
  expect(wrong).toBeTruthy();
  await page.locator('#root #exercise .active-recall-choice').filter({hasText:wrong}).click();
  await expect(page.locator('#root #exercise')).toHaveClass(/exercise-result-wrong/);
  await expect(page.locator('#root .active-recall-answer').filter({hasText:wrong})).toBeVisible();
  await expect(page.locator('#root .exercise-correct-answer')).toBeVisible();
  await expect(page.locator('#root .active-recall-feedback-actions')).toBeVisible();
  const beforeRetry=await page.evaluate(async()=>String((await window.__KANJI5_V19_V2_BOUNDARY__.snapshot()).exercise?.contentId||''));
  await page.getByRole('button',{name:'تکرار همین مهارت',exact:true}).click();
  await expect.poll(async()=>page.evaluate(async()=>String((await window.__KANJI5_V19_V2_BOUNDARY__.snapshot()).exercise?.contentId||'')),{timeout:10000}).toBe(beforeRetry);
  await expect(page.locator('#root .active-recall-choice-grid')).toBeVisible({timeout:10000});
});

test('unseen context is introduced as content exposure, not a recall failure',async({page})=>{
  await clean(page);
  await seedSeenCard(page);
  await startForcedMode(page,'context');
  const snapshot=await page.evaluate(async()=>await window.__KANJI5_V19_V2_BOUNDARY__.snapshot());
  expect(snapshot.exercise.mode).toBe('context');
  expect(snapshot.exercise.contentStage).toBe('introduction');
  expect(snapshot.exercise.stimulus.kind).toBe('context-intro');
  await expect(page.locator('#root .content-intro-stimulus')).toBeVisible();
  await expect(page.locator('#root .active-recall-feedback')).toHaveCount(0);
});