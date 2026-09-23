import {test,expect} from '@playwright/test';

async function clean(page){
  await page.goto('/');
  await page.evaluate(()=>{for(const key of Object.keys(localStorage))if(key.startsWith('kanji5-'))localStorage.removeItem(key);sessionStorage.clear()});
  await page.reload();
  await expect(page.locator('#root .app-shell')).toBeVisible({timeout:20000});
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
 
async function setFeedback(page, correct){
  await page.evaluate(async correctValue=>{
    const boundary=window.__KANJI5_V19_V2_BOUNDARY__;
    const snapshot=await boundary?.snapshot?.();
    if(!boundary||!snapshot?.exercise)throw new Error('exercise snapshot unavailable');
    await boundary.setFeedback({
      mode:snapshot.exercise.mode,
      outcome:correctValue?'correct':'wrong',
      correct:correctValue,
      score:correctValue?1:0,
      graderVersion:'2.0.0-test',
      reason:correctValue?'':'test wrong answer'
    });
  },correct);
}

test('exercise answers show an in-card result and auto-advance without manual transition controls',async({page})=>{
  await clean(page);
  await page.getByRole('button',{name:'یادآوری فعال'}).click();
  await expect(page.locator('#root #exercise')).toBeVisible({timeout:10000});
  await setFeedback(page,true);
  await expect(page.locator('#root #exercise')).toHaveClass(/exercise-result-correct/);
  const correctVisual=await page.locator('#root #exercise').evaluate(el=>({result:el.getAttribute('data-result'),label:el.getAttribute('aria-label'),actions:el.querySelector('.actions'),wideButtons:el.querySelectorAll('.button.wide').length}));
  expect(correctVisual.result).toBe('correct');
  expect(correctVisual.label).toBe('درست');
  expect(correctVisual.actions).toBeNull();
  expect(correctVisual.wideButtons).toBe(0);
  await expect(page.locator('#root .button.wide')).toHaveCount(0);
  await expect(page.locator('#root .actions')).toHaveCount(0);
  await page.waitForTimeout(900);
  await expect(page.locator('#root #exercise')).not.toHaveClass(/exercise-result-(correct|wrong)/);
});

test('wrong exercise answers use the red result state and auto-advance',async({page})=>{
  await clean(page);
  await page.getByRole('button',{name:'یادآوری فعال'}).click();
  await expect(page.locator('#root #exercise')).toBeVisible({timeout:10000});
  await setFeedback(page,false);
  await expect(page.locator('#root #exercise')).toHaveClass(/exercise-result-wrong/);
  const wrongVisual=await page.locator('#root #exercise').evaluate(el=>({result:el.getAttribute('data-result'),label:el.getAttribute('aria-label'),actions:el.querySelector('.actions'),wideButtons:el.querySelectorAll('.button.wide').length}));
  expect(wrongVisual.result).toBe('wrong');
  expect(wrongVisual.label).toBe('نادرست');
  expect(wrongVisual.actions).toBeNull();
  expect(wrongVisual.wideButtons).toBe(0);
  await expect(page.locator('#root .button.wide')).toHaveCount(0);
  await expect(page.locator('#root .actions')).toHaveCount(0);
  await page.waitForTimeout(900);
  await expect(page.locator('#root #exercise .exercise-feedback')).toHaveCount(0);
});

