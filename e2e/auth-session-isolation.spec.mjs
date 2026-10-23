import { test, expect } from '@playwright/test';

test('in-flight account A sync cannot write A-derived payload to account B or stale local storage', async ({ page }) => {
  await page.goto('/e2e/fixtures/auth-session-isolation.html');

  await expect.poll(() => page.evaluate(() => {
    const harness = window.__KANJI5_AUTH_SESSION_HARNESS__;
    return harness?.reads?.length || 0;
  }), { timeout: 10000 }).toBe(1);

  const firstRead = await page.evaluate(() => {
    const harness = window.__KANJI5_AUTH_SESSION_HARNESS__;
    return harness.reads[0].userId;
  });
  expect(firstRead).toBe('account-A');

  await page.evaluate(() => {
    const harness = window.__KANJI5_AUTH_SESSION_HARNESS__;
    harness.switchTo({
      id: 'account-B',
      email: 'account-b@example.invalid',
      user_metadata: {}
    });
  });

  // Allow the auth callback's scheduled sync to contend with A's in-flight sync.
  await page.waitForTimeout(60);
  await page.evaluate(() => {
    const harness = window.__KANJI5_AUTH_SESSION_HARNESS__;
    harness.resolveRead(0, {
      data: {
        payload: {
          state: {
            schemaVersion: 1,
            settings: { dailyNew: 5, retention: 0.9, maxInterval: 36500, dailyGoal: 20, leechThreshold: 8 },
            cards: {},
            reviews: [],
            reviewSummary: null,
            today: '2026-10-23',
            todayNew: 0,
            todayReviewCount: 0,
            goalCelebrated: false,
            streak: { current: 0, longest: 0, lastActiveDate: null }
          },
          knowledge: {},
          deckVersion: 'v1.2-dataset-2136',
          educationSchemaVersion: 2,
          syncSchemaVersion: 1,
          v16SyncSchemaVersion: 2,
          sessionHistory: [],
          components: { accountAOnlyMarker: { marker: 'account-A-only-private-payload' } }
        },
        updated_at: window.__KANJI5_AUTH_SESSION_HARNESS__.matchedUpdatedAt
      },
      error: null
    });
  });

  // In the vulnerable implementation, the continuation uses mutable user B and can
  // conditionally write the response fetched for A into B's row, then persist it locally.
  // The fixed implementation aborts that stale response before either side effect.
  await page.waitForTimeout(150);
  const result = await page.evaluate(() => {
    const harness = window.__KANJI5_AUTH_SESSION_HARNESS__;
    const localData = Object.keys(localStorage)
      .filter(key => key.startsWith('kanji5-'))
      .map(key => [key, localStorage.getItem(key)]);
    return {
      currentUserId: window.__KANJI5_ACCOUNT__?.getState?.().user?.id || null,
      reads: harness.reads.map(read => read.userId),
      writes: harness.writes,
      localData: JSON.stringify(localData)
    };
  });

  expect(result.currentUserId).toBe('account-B');
  expect(result.reads).toEqual(['account-A']);
  expect(result.writes).toEqual([]);
  expect(result.localData).not.toContain('account-A-only-private-payload');
});
