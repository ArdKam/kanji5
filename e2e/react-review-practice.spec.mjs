import {test,expect} from '@playwright/test';

async function clean(page){
  await page.goto('/');
  await page.evaluate(()=>{for(const key of Object.keys(localStorage))if(key.startsWith('kanji5-'))localStorage.removeItem(key);sessionStorage.clear()});
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

test('Learning and Active Recall are explicit independent presentation experiences',async({page})=>{
  await clean(page);
  const review=page.getByRole('button',{name:'یادگیری'});
  const practice=page.getByRole('button',{name:'یادآوری فعال'});
  await expect(review).toHaveAttribute('aria-current','page');
  await expect(practice).not.toHaveAttribute('aria-current','page');
  await expect(page.locator('#root #exercise')).toHaveCount(0);
  await expect(page.locator('#root .card')).toBeVisible();
  await practice.click();
  await expect(practice).toHaveAttribute('aria-current','page');
  await expect(review).not.toHaveAttribute('aria-current','page');
  await expect(page.locator('#root #exercise')).toBeVisible({timeout:10000});
  await expect(page.locator('#root section.card:not(#exercise)')).toHaveCount(0);
  await expect(page.locator('#root .daily-summary')).toHaveCount(0);
  await expect(page.locator('#root .insights')).toHaveCount(0);
  await review.click();
  await expect(review).toHaveAttribute('aria-current','page');
  await expect(practice).not.toHaveAttribute('aria-current','page');
  await expect(page.locator('#root #exercise')).toHaveCount(0);
  await expect(page.locator('#root .card')).toBeVisible();
});
 
async function startForcedExercise(page,mode){
  const character=(await page.locator('#root .learning-card .kanji-display').textContent()).trim();
  await page.evaluate(({character,mode})=>{
    window.__KANJI5_V19_RECOVERY_TARGET__={character,mode,contentId:character};
  },{character,mode});
  await page.getByRole('button',{name:'یادآوری فعال'}).click();
  await expect(page.locator('#root #exercise')).toBeVisible({timeout:15000});
}

test('wrong production answer turns the card red once and then advances once',async({page})=>{
  await clean(page);
  await seedSeenCard(page);
  await startForcedExercise(page,'production');
  await expect(page.locator('#root #exercise .production-choice')).toHaveCount(4,{timeout:10000});
  const before=await page.evaluate(async()=>{const s=await window.__KANJI5_V19_V2_BOUNDARY__.snapshot();return String(s.exercise.contentId)});
  const character=await page.evaluate(async()=>String((await window.__KANJI5_V19_V2_BOUNDARY__.snapshot()).exercise.character));
  const wrong=page.locator('#root #exercise .production-choice').filter({hasNotText:character}).first();
  await wrong.click();
  await expect(page.locator('#root #exercise')).toHaveClass(/exercise-result-wrong/);
  await expect(page.locator('#root .actions')).toHaveCount(0);
  await page.waitForTimeout(900);
  await expect(page.locator('#root #exercise')).not.toHaveClass(/exercise-result-(correct|wrong)/);
  await expect.poll(async()=>String((await page.evaluate(async()=>{const s=await window.__KANJI5_V19_V2_BOUNDARY__.snapshot();return String(s.exercise.contentId)})))).not.toBe(before);
  await expect(page.locator('#root #exercise .prompt')).toBeVisible();
});

test('correct production answer turns the card green and advances once',async({page})=>{
  await clean(page);
  await seedSeenCard(page);
  await startForcedExercise(page,'production');
  const before=await page.evaluate(async()=>String((await window.__KANJI5_V19_V2_BOUNDARY__.snapshot()).exercise.contentId));
  const character=await page.evaluate(async()=>String((await window.__KANJI5_V19_V2_BOUNDARY__.snapshot()).exercise.character));
  await page.getByRole('button',{name:character}).click();
  await expect(page.locator('#root #exercise')).toHaveClass(/exercise-result-correct/);
  await expect(page.locator('#root .actions')).toHaveCount(0);
  await page.waitForTimeout(900);
  await expect(page.locator('#root #exercise')).not.toHaveClass(/exercise-result-(correct|wrong)/);
  await expect.poll(async()=>String((await page.evaluate(async()=>{const s=await window.__KANJI5_V19_V2_BOUNDARY__.snapshot();return String(s.exercise.contentId)})))).not.toBe(before);
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
