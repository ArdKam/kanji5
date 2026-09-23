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
 
test('exercise result is submission-driven and does not cascade across new prompts',async({page})=>{
  await clean(page);
  await seedSeenCard(page);
  await page.getByRole('button',{name:'یادآوری فعال'}).click();
  await expect(page.locator('#root #exercise')).toBeVisible({timeout:10000});
  await expect.poll(async()=>page.locator('#root #exercise input, #root #exercise .production-choice').count(),{timeout:10000}).toBeGreaterThan(0);
  const input=page.locator('#root #exercise input').first();
  const choices=page.locator('#root #exercise .production-choice');
  if(await input.count()){
    await input.fill('zzzzzz');
    await page.getByRole('button',{name:'بررسی پاسخ'}).click();
  }else{
    await expect(choices).toHaveCount(4);
    await choices.first().click();
  }
  await expect(page.locator('#root #exercise')).toHaveClass(/exercise-result-(correct|wrong)/);
  await expect(page.locator('#root .actions')).toHaveCount(0);
  await page.waitForTimeout(900);
  await expect(page.locator('#root #exercise')).not.toHaveClass(/exercise-result-(correct|wrong)/);
  await expect(page.locator('#root #exercise')).toBeVisible();
});

test('typed-answer modes actually submit and produce immediate card feedback',async({page})=>{
  await clean(page);
  await page.evaluate(async()=>{
    const boundary=window.__KANJI5_V19_V2_BOUNDARY__;
    if(!boundary)throw new Error('exercise boundary unavailable');
    await boundary.updateSettings({production:false,vocabulary:false,context:false});
  });
  await page.getByRole('button',{name:'یادآوری فعال'}).click();
  await expect(page.locator('#root #exercise')).toBeVisible({timeout:15000});
  const input=page.locator('#root #exercise input').first();
  await expect(input).toBeVisible({timeout:5000});
  await input.fill('zzzzzz');
  await page.getByRole('button',{name:'بررسی پاسخ'}).click();
  await expect(page.locator('#root #exercise')).toHaveClass(/exercise-result-(correct|wrong)/);
  await expect(page.locator('#root .actions')).toHaveCount(0);
});
