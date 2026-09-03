import { test, expect } from '@playwright/test';

test.describe('Kanji 5 browser smoke', () => {
  test('loads the real app into the study screen', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto('/');

    await expect(page).toHaveTitle(/Kanji 5/);
    await expect(page.locator('#app')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#studyPanel')).toBeVisible();

    expect(pageErrors, pageErrors.join('\n')).toEqual([]);
  });

  test('persisted cards can enter active recall and use don\'t know', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto('/');
    await expect(page.locator('#app')).toBeVisible({ timeout: 20_000 });

    const firstCard = page.locator('.kanji');
    const firstKanji = (await firstCard.textContent())?.trim();
    const firstId = await firstCard.getAttribute('data-kanji-id');
    expect(firstKanji).toBeTruthy();
    expect(firstId).toBeTruthy();

    await page.locator('#revealBtn').click();
    await expect(page.locator('#ratings')).toHaveClass(/show/);
    await page.locator('.rate[data-r="Again"]').click();

    const cardWasPersisted = await page.evaluate(id => {
      const raw = localStorage.getItem('kanji5-v1-cards');
      const cards = raw ? JSON.parse(raw) : {};
      return Boolean(id && cards[id]);
    }, firstId);
    expect(cardWasPersisted).toBe(true);

    await page.reload();
    await expect(page.locator('#app')).toBeVisible({ timeout: 20_000 });

    const persistedTarget = await page.evaluate(id => {
      const raw = localStorage.getItem('kanji5-v1-cards');
      const cards = raw ? JSON.parse(raw) : {};
      const legacyRaw = localStorage.getItem('kanji5-v1');
      const legacy = legacyRaw ? JSON.parse(legacyRaw) : null;
      return {
        card: Boolean(id && cards[id]),
        legacyCard: Boolean(id && legacy?.cards?.[id]),
        buttonText: document.getElementById('revealBtn')?.textContent?.trim() || '',
      };
    }, firstId);
    expect(persistedTarget.card).toBe(true);
    expect(persistedTarget.legacyCard).toBe(true);

    await page.evaluate(id => {
      const key = 'kanji5-v1-cards';
      const raw = localStorage.getItem(key);
      const cards = raw ? JSON.parse(raw) : {};
      if (!id || !cards[id]?.card) throw new Error('persisted card missing');
      cards[id].card.due = new Date(Date.now() - 1000).toISOString();
      localStorage.setItem(key, JSON.stringify(cards));
    }, firstId);

    await page.reload();
    await expect(page.locator('#app')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.kanji')).toHaveAttribute('data-kanji-id', firstId);
    await expect(page.locator('#revealBtn')).toHaveText(/نمایش پاسخ/);

    const gate = page.locator('.v12-recall-gate');
    await page.locator('#revealBtn').click();
    await expect(gate).toBeVisible({ timeout: 10_000 });

    const prompt = await gate.innerText();
    expect(prompt).not.toContain('معنی هدف:');
    expect(prompt).not.toContain('خوانش هدف:');

    const diagnostics = await page.evaluate(() => ({
      ready: document.readyState,
      state: Boolean(window.__KANJI5_STATE__),
      bridge: Boolean(window.__KANJI5_RECALL_BRIDGE__),
      p0: Boolean(window.__KANJI5_V15_P0__),
      api: Boolean(window.__KANJI5_V15_RECALL_API__),
      scripts: [...document.scripts].map(script => script.src || script.id),
      gate: Boolean(document.querySelector('.v12-recall-gate')),
      input: Boolean(document.querySelector('.v12-recall-gate input')),
      button: Boolean(document.querySelector('#v15DontKnowRecall')),
      studyPanel: Boolean(document.getElementById('studyPanel')),
      study: Boolean(document.getElementById('study')),
      stateSource: document.querySelector('script[src*="v1.5-state.js"]')?.src || null,
    }));
    console.log('V15_DIAGNOSTIC', JSON.stringify(diagnostics));
    console.log('V15_PAGE_ERRORS', JSON.stringify(pageErrors));

    await expect(page.locator('#v15DontKnowRecall')).toBeVisible();
    await expect(page.locator('#ratings')).not.toHaveClass(/show/);

    const reviewsBefore = await page.evaluate(() => {
      const raw = localStorage.getItem('kanji5-v1-reviews');
      return raw ? JSON.parse(raw) : [];
    });
    expect(reviewsBefore.length).toBe(1);
    expect(reviewsBefore.at(-1).rating).toBe('Again');

    await page.locator('#v15DontKnowRecall').click();
    await expect(gate).toHaveCount(0);
    await expect(page.locator('#answerBox')).toHaveClass(/show/);
    await expect(page.locator('#ratings')).toHaveClass(/show/);

    const lastAttempt = await page.evaluate(() => {
      const raw = localStorage.getItem('kanji5-v1.2-last-attempt');
      return raw ? JSON.parse(raw) : null;
    });
    expect(lastAttempt).toMatchObject({ character: firstKanji, correct: false, unknown: true, hadAttempt: true });

    const componentEvidence = await page.evaluate(() => {
      const raw = localStorage.getItem('kanji5-v1.5-components');
      return raw ? JSON.parse(raw) : {};
    });
    const entry = componentEvidence[firstKanji || ''];
    expect(entry).toBeTruthy();
    const componentStats = Object.values(entry?.meaning || {}).concat(Object.values(entry?.reading || {}));
    expect(componentStats.some(stat => Number(stat?.attempts) >= 1 && Number(stat?.unknown) >= 1)).toBe(true);

    const reviewsAfterUnknown = await page.evaluate(() => {
      const raw = localStorage.getItem('kanji5-v1-reviews');
      return raw ? JSON.parse(raw) : [];
    });
    expect(reviewsAfterUnknown.length).toBe(1);
    expect(reviewsAfterUnknown.at(-1).rating).toBe('Again');

    await page.locator('.rate[data-r="Good"]').click();

    const reviewsAfterGood = await page.evaluate(() => {
      const raw = localStorage.getItem('kanji5-v1-reviews');
      return raw ? JSON.parse(raw) : [];
    });
    expect(reviewsAfterGood.length).toBe(2);
    expect(reviewsAfterGood.at(-1).rating).toBe('Good');

    expect(pageErrors, pageErrors.join('\n')).toEqual([]);
  });

  test('rating advances the queue and persists a review', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto('/');
    await expect(page.locator('#app')).toBeVisible({ timeout: 20_000 });

    const firstKanji = await page.locator('.kanji').textContent();
    await page.locator('#revealBtn').click();
    await expect(page.locator('#ratings')).toHaveClass(/show/);
    await page.locator('.rate[data-r="Good"]').click();

    await expect(page.locator('.kanji')).not.toHaveText(firstKanji || '', { timeout: 5_000 });
    const persistedReviews = await page.evaluate(() => {
      const raw = localStorage.getItem('kanji5-v1-reviews');
      return raw ? JSON.parse(raw) : [];
    });
    expect(persistedReviews.length).toBeGreaterThan(0);
    expect(persistedReviews.at(-1).rating).toBe('Good');
    expect(persistedReviews.at(-1).eventSchemaVersion).toBeGreaterThanOrEqual(1);

    expect(pageErrors, pageErrors.join('\n')).toEqual([]);
  });
});
