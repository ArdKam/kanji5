import { test, expect } from '@playwright/test';

test('v2 restores the visible FSRS review-card flow', async ({page}) => {
  await page.goto('/?legacy=1');
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) if (key.startsWith('kanji5-')) localStorage.removeItem(key);
    sessionStorage.clear();
  });
  await page.reload();
  await expect(page.locator('#app')).toBeVisible({timeout:20000});

  await page.locator('#revealBtn').click();
  await expect(page.locator('#ratings')).toHaveClass(/show/);
  const target = (await page.locator('.kanji').first().textContent())?.trim();
  expect(target).toBeTruthy();
  await page.locator('.rate[data-r="Good"]').click();
  await expect(page.locator('#revealBtn')).toBeVisible();
  await page.evaluate((character) => {
    const state = window.__KANJI5_STATE__;
    if (!state?.transaction || !state?.readDeck) throw new Error('canonical state persistence API unavailable');
    const item = state.readDeck().find(x => x?.character === character);
    if (!item) throw new Error('seeded deck item not found');
    state.transaction(draft => {
      if (!draft.cards?.[item.id]?.card) throw new Error('seeded card not found');
      draft.cards[item.id].card.due = new Date(Date.now() - 60_000).toISOString();
      return draft;
    });
  }, target);
  await page.reload();
  await expect(page.locator('#app')).toBeVisible({timeout:20000});

  await page.goto('/');
  await expect(page.locator('#v2ReviewCard')).toBeVisible({timeout:10000});
  await expect(page.locator('#v2ReviewKanji')).toHaveText(target);
  await expect(page.locator('#v2ReviewReveal')).toBeVisible();
  await page.locator('#v2ReviewReveal').click();
  await expect(page.locator('#v2ReviewRecallHost #v12RecallInput')).toBeVisible({timeout:10000});
  const recallAnswer = await page.evaluate(() => {
    const attr = document.querySelector('#v2ReviewRecallHost .v12-recall-gate')?.dataset.v17Attribute;
    const target = document.querySelector('#v2ReviewKanji')?.textContent?.trim();
    const deck = JSON.parse(localStorage.getItem('kanji5-deck') || '[]');
    const item = deck.find(x => x?.character === target);
    if (attr === 'reading') return item?.on?.[0] || item?.kun?.[0] || '';
    return item?.meaning?.[0] || '';
  });
  expect(recallAnswer).toBeTruthy();
  await page.locator('#v2ReviewRecallHost #v12RecallInput').fill(recallAnswer);
  await page.locator('#v2ReviewRecallHost #v12SubmitRecall').click();
  await expect(page.locator('.v2-learning-meanings')).toBeVisible({timeout:10000});
  await expect(page.locator('.v2-learning-ratings')).toBeVisible();
  await page.locator('button[data-rating="Good"]').click();
  await expect.poll(async () => page.locator('#v2ReviewCard, #v2LearningCard, #v2Exercise').count(), {timeout:10000}).toBeGreaterThan(0);
  await expect(page.locator('#v2App')).toBeVisible();
});
