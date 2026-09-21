import {test,expect} from '@playwright/test';

async function clean(page){
  await page.goto('/');
  await page.evaluate(()=>{for(const key of Object.keys(localStorage))if(key.startsWith('kanji5-'))localStorage.removeItem(key);sessionStorage.clear()});
  await page.reload();
  await expect(page.locator('#root .app-shell')).toBeVisible({timeout:20000});
}

test('Review and Practice are explicit independent presentation experiences',async({page})=>{
  await clean(page);
  const review=page.getByRole('button',{name:'مرور'});
  const practice=page.getByRole('button',{name:'تمرین'});
  await expect(review).toHaveAttribute('aria-current','page');
  await expect(practice).not.toHaveAttribute('aria-current','page');
  await expect(page.locator('#root #exercise')).toHaveCount(0);
  await practice.click();
  await expect(practice).toHaveAttribute('aria-current','page');
  await expect(review).not.toHaveAttribute('aria-current','page');
  await expect(page.locator('#root #exercise')).toBeVisible({timeout:10000});
  await review.click();
  await expect(review).toHaveAttribute('aria-current','page');
  await expect(practice).not.toHaveAttribute('aria-current','page');
  await expect(page.locator('#root #exercise')).toHaveCount(0);
});
