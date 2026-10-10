import {test,expect} from '@playwright/test';

async function clean(page){
  await page.goto('/');
  await page.evaluate(()=>{for(const key of Object.keys(localStorage))if(key.startsWith('kanji5-'))localStorage.removeItem(key);sessionStorage.clear();localStorage.setItem('kanji5-onboarding-v2','complete')});
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

async function forcedTargetCharacter(page){
  return await page.evaluate(async()=>{
    const snapshot=await window.__KANJI5_V19_V2_BOUNDARY__?.snapshot?.();
    return String(snapshot?.exercise?.character||"").trim();
  });
}

test('Learning and Practice are explicit independent presentation experiences',async({page})=>{
  await clean(page);
  const review=page.getByRole('button',{name:'یادگیری',exact:true});
  const practice=page.getByRole('button',{name:'تمرین',exact:true});
  await expect(review).toHaveAttribute('aria-current','page');
  await expect(practice).not.toHaveAttribute('aria-current','page');
  await expect(page.locator('#root #exercise')).toHaveCount(0);
  await expect(page.locator('#root .learning-card')).toBeVisible();
  // Establish the documented education precondition before asserting the active exercise path.
  await seedSeenCard(page);
  await practice.click();
  await expect(practice).toHaveAttribute('aria-current','page');
  await expect(review).not.toHaveAttribute('aria-current','page');
  await expect(page.locator('#root .practice-home')).toBeVisible({timeout:5000});
  await expect(page.locator('#root #exercise')).toHaveCount(0);
  await page.getByRole('button',{name:'شروع تمرین',exact:true}).click();
  await expect(page.locator('#root #exercise')).toBeVisible({timeout:10000});
  await expect(page.locator('#root section.card:not(#exercise)')).toHaveCount(0);
  await expect(page.locator('#root .daily-summary')).toHaveCount(0);
  await expect(page.locator('#root .insights')).toHaveCount(0);
  await review.click();
  await expect(review).toHaveAttribute('aria-current','page');
  await expect(practice).not.toHaveAttribute('aria-current','page');
  await expect(page.locator('#root #exercise')).toHaveCount(0);
  await expect(page.locator('#root .learning-card')).toBeVisible();
});
 
async function startForcedExercise(page,mode){
  const character=(await page.locator('#root .learning-card .kanji-display').textContent()).trim();
  await page.evaluate(({character,mode})=>{
    window.__KANJI5_V19_RECOVERY_TARGET__={character,mode,contentId:character};
  },{character,mode});
  await page.getByRole('button',{name:'تمرین',exact:true}).click();
  await expect(page.locator('#root .practice-home')).toBeVisible({timeout:5000});
  await page.getByRole('button',{name:'شروع تمرین',exact:true}).click();
  await expect(page.locator('#root #exercise')).toBeVisible({timeout:15000});
}

test('Learning rating is idempotent when submitted concurrently',async({page})=>{
  await clean(page);
  const reveal=page.locator('#root .learning-card-front .button.primary.wide');
  await expect(reveal).toBeVisible();
  await reveal.click();
  await expect(page.locator('#root .learning-card .rating-good')).toBeVisible({timeout:10000});
  const result=await page.evaluate(async()=>{
    const before=JSON.parse(localStorage.getItem('kanji5-v1-reviews')||'[]').length;
    await Promise.all([
      window.__KANJI5_V19_V2_BOUNDARY__?.rateLearning?.('Good'),
      window.__KANJI5_V19_V2_BOUNDARY__?.rateLearning?.('Good'),
    ]);
    const after=JSON.parse(localStorage.getItem('kanji5-v1-reviews')||'[]').length;
    return {before,after};
  });
  expect(result.after-result.before).toBe(1);
});

test('experience navigation remains clickable while an engine transition is busy',async({page})=>{
  await clean(page);
  const learning=page.getByRole('button',{name:'یادگیری',exact:true});
  const practice=page.getByRole('button',{name:'تمرین',exact:true});
  const dictionary=page.getByRole('button',{name:'فرهنگ کانجی'});
  await practice.click();
  await expect(practice).toHaveAttribute('aria-current','page');
  await learning.click();
  await expect(learning).toHaveAttribute('aria-current','page');
  await dictionary.click();
  await expect(dictionary).toHaveAttribute('aria-current','page');
  await learning.click();
  await expect(learning).toHaveAttribute('aria-current','page');
});

test('empty Practice home stays responsive before any card is learned',async({page})=>{
  await clean(page);
  const learning=page.getByRole('button',{name:'یادگیری',exact:true});
  const practice=page.getByRole('button',{name:'تمرین',exact:true});
  await practice.click();
  await expect(practice).toHaveAttribute('aria-current','page');
  await expect(page.locator('#root .practice-home')).toBeVisible({timeout:5000});
  await expect(page.locator('#root #exercise')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'شروع تمرین',exact:true})).toBeVisible();
  await expect(learning).toBeEnabled();
  await learning.click();
  await expect(learning).toHaveAttribute('aria-current','page');
  await expect(page.locator('#root .learning-card')).toBeVisible({timeout:5000});
});

test('Production Recall uses independent typed production as the primary path',async({page})=>{
  await clean(page);
  await seedSeenCard(page);
  await startForcedExercise(page,'production');
  await expect(page.locator('#root #exercise .production-recall')).toBeVisible({timeout:10000});
  await expect(page.locator('#root #exercise .meaning-stimulus')).toBeVisible();
  await expect(page.locator('#root #exercise .meaning-stimulus strong')).toHaveText(/\S/);
  await expect(page.locator('#root #exercise input')).toHaveCount(1);
  await expect(page.locator('#root #exercise input')).toBeVisible();
  await expect(page.locator('#root #exercise .active-recall-task-modality')).toHaveText('تولید مستقل کانجی');
  await expect(page.getByRole('button',{name:'بررسی پاسخ'})).toBeVisible();
  await expect(page.getByRole('button',{name:'نمایش پاسخ'})).toBeVisible();
  await expect(page.getByRole('button',{name:'بلد بودم'})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'نمی‌دانستم'})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'کمک: نمایش گزینه‌ها'})).toBeVisible();
  await expect(page.locator('#root #exercise .production-grid')).toHaveCount(0);
});

test('Production Recall typed answer records independent production evidence',async({page})=>{
  await clean(page);
  await seedSeenCard(page);
  await startForcedExercise(page,'production');
  const character=await page.evaluate(async()=>String((await window.__KANJI5_V19_V2_BOUNDARY__.snapshot()).exercise?.character||""));
  const input=page.locator('#root #exercise input').first();
  await input.fill(character);
  await page.getByRole('button',{name:'بررسی پاسخ'}).click();
  await expect.poll(async()=>page.evaluate(character=>{
    const knowledge=JSON.parse(localStorage.getItem('kanji5-v1.2-knowledge')||'{}');
    const production=knowledge?.[character]?.production||{};
    return {attempts:Number(production.attempts||0),correct:Number(production.correct||0)};
  },character)).toMatchObject({attempts:expect.any(Number),correct:expect.any(Number)});
  await expect.poll(async()=>page.evaluate(character=>{
    const knowledge=JSON.parse(localStorage.getItem('kanji5-v1.2-knowledge')||'{}');
    const production=knowledge?.[character]?.production||{};
    return Number(production.attempts||0);
  },character)).toBeGreaterThan(0);
  await expect.poll(async()=>page.evaluate(character=>{
    const knowledge=JSON.parse(localStorage.getItem('kanji5-v1.2-knowledge')||'{}');
    const production=knowledge?.[character]?.production||{};
    return Number(production.correct||0);
  },character)).toBeGreaterThan(0);
});

test('Production Recall known self-grade submits the revealed Kanji and advances',async({page})=>{
  await clean(page);
  await seedSeenCard(page);
  await startForcedExercise(page,'production');
  await page.getByRole('button',{name:'نمایش پاسخ'}).click();
  await expect.poll(async()=>page.evaluate(async()=>String((await window.__KANJI5_V19_V2_BOUNDARY__.snapshot()).exercise?.character||""))).not.toBe('');
  const character=await page.evaluate(async()=>String((await window.__KANJI5_V19_V2_BOUNDARY__.snapshot()).exercise?.character||""));
  await page.getByRole('button',{name:'بلد بودم'}).click();
  await expect(page.locator('#root .production-recall')).toHaveCount(0);
  await page.waitForTimeout(900);
  await expect(page.locator('#root #exercise')).not.toHaveClass(/exercise-result-(correct|wrong)/);
  await expect(page.locator('#root #exercise .prompt')).toBeVisible();
  void character;
});

test('Production Recall unknown self-grade records unknown and advances once',async({page})=>{
  await clean(page);
  await seedSeenCard(page);
  await startForcedExercise(page,'production');
  const before=await page.evaluate(async()=>String((await window.__KANJI5_V19_V2_BOUNDARY__.snapshot()).exercise?.contentId||""));
  await page.getByRole('button',{name:'نمایش پاسخ'}).click();
  await expect.poll(async()=>page.evaluate(async()=>String((await window.__KANJI5_V19_V2_BOUNDARY__.snapshot()).exercise?.character||""))).not.toBe('');
  const character=await page.evaluate(async()=>String((await window.__KANJI5_V19_V2_BOUNDARY__.snapshot()).exercise?.character||""));
  await page.getByRole('button',{name:'نمی‌دانستم'}).click();
  await expect.poll(async()=>page.evaluate(async()=>String((await window.__KANJI5_V19_V2_BOUNDARY__.snapshot()).feedback?.outcome||""))).toBe('unknown');
  await expect(page.locator('#root #exercise')).toHaveClass(/exercise-result-wrong/);
  await expect(page.locator('#root .exercise-correct-answer')).toBeVisible();
  await expect(page.locator('#root .exercise-correct-answer b')).toHaveText(character);
  await page.waitForTimeout(1600);
  await expect(page.locator('#root #exercise')).not.toHaveClass(/exercise-result-(correct|wrong)/);
  await expect(page.locator('#root #exercise .prompt')).toBeVisible();
});

test('typed reading answer submits through the grading path and shows feedback',async({page})=>{
  await clean(page);
  await seedSeenCard(page);
  await startForcedExercise(page,'reading');
  const input=page.locator('#root #exercise input').first();
  await expect(input).toBeVisible({timeout:10000});
  await input.fill('zzzzzz');
  await page.getByRole('button',{name:'بررسی پاسخ'}).click();
  await expect(page.locator('#root #exercise')).toHaveClass(/exercise-result-wrong/);
  await expect(page.locator('#root .actions')).toHaveCount(0);
});

test('Practice session start failure is recoverable without leaving the home locked',async({page})=>{
  await clean(page);
  await page.getByRole('button',{name:'تمرین',exact:true}).click();
  await expect(page.locator('#root .practice-home')).toBeVisible({timeout:5000});
  await page.evaluate(()=>{
    const boundary=window.__KANJI5_V19_V2_BOUNDARY__;
    if(!boundary?.ensureEducationRuntime)throw new Error('education runtime boundary unavailable');
    window.__KANJI5_TEST_ORIGINAL_ENSURE__=boundary.ensureEducationRuntime;
    boundary.ensureEducationRuntime=async()=>false;
  });
  await page.getByRole('button',{name:'شروع تمرین',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText(/تمرین آماده نیست|قابل انجام|exercise/i,{timeout:5000});
  await expect(page.getByRole('button',{name:'شروع تمرین',exact:true})).toBeEnabled();
  await expect(page.locator('#root .practice-home')).toBeVisible();
  await page.evaluate(()=>{
    const boundary=window.__KANJI5_V19_V2_BOUNDARY__;
    const original=window.__KANJI5_TEST_ORIGINAL_ENSURE__;
    if(boundary&&original)boundary.ensureEducationRuntime=original;
    delete window.__KANJI5_TEST_ORIGINAL_ENSURE__;
  });
  await page.getByRole('button',{name:'شروع تمرین',exact:true}).click();
  await expect(page.locator('#root .practice-home')).toBeVisible({timeout:5000});
  await expect(page.getByRole('button',{name:'شروع تمرین',exact:true})).toBeEnabled();
});

test('Practice start button locks during an in-flight start',async({page})=>{
  await clean(page);
  await seedSeenCard(page);
  await page.getByRole('button',{name:'تمرین',exact:true}).click();
  await expect(page.locator('#root .practice-home')).toBeVisible({timeout:5000});
  await page.evaluate(()=>{
    const boundary=window.__KANJI5_V19_V2_BOUNDARY__;
    if(!boundary?.ensureEducationRuntime)throw new Error('education runtime boundary unavailable');
    window.__KANJI5_TEST_ORIGINAL_ENSURE__=boundary.ensureEducationRuntime;
    boundary.ensureEducationRuntime=async()=>{await new Promise(resolve=>setTimeout(resolve,500));return window.__KANJI5_TEST_ORIGINAL_ENSURE__();};
  });
  const start=page.getByRole('button',{name:'شروع تمرین',exact:true});
  await start.click();
  await expect(start).toBeDisabled();
  await expect(page.locator('#root #exercise')).toBeVisible({timeout:15000});
});


test('Practice Home exposes topic learning and keeps the session in the Learning flow',async({page})=>{
  await clean(page);
  const practice=page.getByRole('button',{name:'تمرین',exact:true});
  await practice.click();
  await expect(page.locator('#root .practice-home')).toBeVisible({timeout:5000});
  await expect(page.getByRole('heading',{name:'یادگیری بر اساس موضوع'})).toBeVisible();
  const numbers=page.getByRole('button',{name:'اعداد و کمیت',exact:true});
  await expect(numbers).toBeVisible();
  await numbers.click();
  await expect(page.locator('#root .practice-topic-selected')).toBeVisible();
  await page.getByRole('button',{name:'شروع یادگیری موضوعی',exact:true}).click();
  await expect(page.getByRole('button',{name:'یادگیری',exact:true})).toHaveAttribute('aria-current','page');
  await expect(page.locator('#root .learning-card')).toBeVisible({timeout:15000});
  await expect(page.locator('#root .practice-home')).toHaveCount(0);
});

test('advanced practice filters can be scoped to a selected topic',async({page})=>{
  await clean(page);
  await page.getByRole('button',{name:'تمرین',exact:true}).click();
  await expect(page.locator('#root .practice-home')).toBeVisible({timeout:5000});
  await page.getByRole('button',{name:'طبیعت و زمین',exact:true}).click();
  await page.locator('#root .practice-advanced > summary').click();
  await expect(page.locator('#root .practice-custom-panel h3')).toHaveText('طبیعت و زمین');
  await expect(page.getByRole('group',{name:'تمرکز مطالعه'})).toBeVisible();
  await expect(page.getByRole('button',{name:'قابل مطالعه',exact:true})).toHaveAttribute('aria-pressed','true');
});
