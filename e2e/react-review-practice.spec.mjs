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
  await expect(page.locator('#root .exercise-feedback-overlay')).toContainText('درست');
  await expect(page.locator('#root .feedback')).toBeHidden();
  await expect(page.locator('#root #exercise .button.primary.wide')).toBeHidden();
  await expect(page.locator('#root #exercise .button.secondary.wide')).toBeHidden();
  await expect(page.locator('#root #exercise .actions')).toBeHidden();
  await expect.poll(async()=>page.locator('#root .exercise-feedback-overlay').count(),{timeout:3000}).toBe(0);
});

test('wrong exercise answers use the red result state and auto-advance',async({page})=>{
  await clean(page);
  await page.getByRole('button',{name:'یادآوری فعال'}).click();
  await expect(page.locator('#root #exercise')).toBeVisible({timeout:10000});
  await setFeedback(page,false);
  await expect(page.locator('#root #exercise')).toHaveClass(/exercise-result-wrong/);
  await expect(page.locator('#root .exercise-feedback-overlay')).toContainText('نادرست');
  await expect(page.locator('#root .feedback')).toBeHidden();
  await expect(page.locator('#root #exercise .button.primary.wide')).toBeHidden();
  await expect(page.locator('#root #exercise .button.secondary.wide')).toBeHidden();
  await expect(page.locator('#root #exercise .actions')).toBeHidden();
  await expect.poll(async()=>page.locator('#root .exercise-feedback-overlay').count(),{timeout:3000}).toBe(0);
});

