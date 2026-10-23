import { chromium } from '@playwright/test';
import { isDeepStrictEqual } from 'node:util';

const baseUrl = String(process.env.KANJI5_LIVE_URL || 'https://ardkam.github.io/kanji5').replace(/\/$/, '');
const email = String(process.env.KANJI5_LIVE_SYNC_EMAIL || '').trim().toLowerCase();
const password = String(process.env.KANJI5_LIVE_SYNC_PASSWORD || '');
const confirmation = String(process.env.KANJI5_LIVE_SYNC_CONFIRM || '');

if (!email || !password) throw new Error('LIVE_SYNC_TEST_CREDENTIALS_REQUIRED');
if (confirmation !== 'I_UNDERSTAND_TEST_ACCOUNT') throw new Error('LIVE_SYNC_CONFIRMATION_REQUIRED');

const browser = await chromium.launch({ headless: true });
let contextA;
let contextB;
let cfgA = null;
let baseline = null;
let testStarted = false;
const TEST_GOALS = new Set([710101, 720202, 730303]);

async function waitForSignedIn(page) {
  await page.waitForFunction(() => window.__KANJI5_ACCOUNT__?.getState?.().status === 'signed-in', null, { timeout: 30000 });
  await page.waitForFunction(() => window.__KANJI5_ACCOUNT__?.getState?.().syncStatus === 'synced', null, { timeout: 30000 });
}

async function signIn(page) {
  await page.addInitScript(() => {
    localStorage.setItem('kanji5-ui-language', 'en');
    localStorage.setItem('kanji5-onboarding-v2', 'complete');
  });
  await page.goto(baseUrl + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('#root .app-shell').waitFor({ state: 'visible', timeout: 30000 });
  await page.evaluate(async ({ email, password }) => {
    await window.__KANJI5_ACCOUNT__.signInWithPassword(email, password);
  }, { email, password });
  await waitForSignedIn(page);
}

async function authContext(page) {
  const result = await page.evaluate(() => {
    const values = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      const raw = localStorage.getItem(key);
      if (key.endsWith('-auth-token') && raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.access_token) values.push({ key, accessToken: parsed.access_token });
        } catch {}
      }
    }
    const account = window.__KANJI5_ACCOUNT__?.getState?.();
    const cfg = window.KANJI5_SUPABASE;
    return {
      accessToken: values[0]?.accessToken || '',
      userId: account?.user?.id || '',
      url: cfg?.url || '',
      anonKey: cfg?.anonKey || ''
    };
  });
  if (!result.accessToken || !result.userId || !result.url || !result.anonKey) {
    throw new Error('LIVE_SYNC_AUTH_CONTEXT_UNAVAILABLE');
  }
  return result;
}

async function restGet(cfg) {
  const response = await fetch(
    cfg.url + '/rest/v1/user_learning_state?select=payload,updated_at&user_id=eq.' + encodeURIComponent(cfg.userId),
    { headers: { apikey: cfg.anonKey, Authorization: 'Bearer ' + cfg.accessToken } }
  );
  if (!response.ok) throw new Error('LIVE_SYNC_REMOTE_GET_' + response.status);
  const rows = await response.json();
  return rows[0] || null;
}

async function restConditionalPatch(cfg, payload, expectedUpdatedAt) {
  const response = await fetch(
    cfg.url + '/rest/v1/user_learning_state?user_id=eq.' + encodeURIComponent(cfg.userId) +
      '&updated_at=eq.' + encodeURIComponent(expectedUpdatedAt),
    {
      method: 'PATCH',
      headers: {
        apikey: cfg.anonKey,
        Authorization: 'Bearer ' + cfg.accessToken,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({ payload, updated_at: new Date().toISOString() })
    }
  );
  if (!response.ok) throw new Error('LIVE_SYNC_REMOTE_PATCH_' + response.status);
  return response.json();
}

async function restConditionalDelete(cfg, expectedUpdatedAt) {
  const response = await fetch(
    cfg.url + '/rest/v1/user_learning_state?user_id=eq.' + encodeURIComponent(cfg.userId) +
      '&updated_at=eq.' + encodeURIComponent(expectedUpdatedAt),
    {
      method: 'DELETE',
      headers: {
        apikey: cfg.anonKey,
        Authorization: 'Bearer ' + cfg.accessToken,
        Prefer: 'return=representation'
      }
    }
  );
  if (!response.ok) throw new Error('LIVE_SYNC_REMOTE_DELETE_' + response.status);
  return response.json();
}


async function cleanupRemote() {
  if (!testStarted || !cfgA) return;
  const current = await restGet(cfgA);
  const currentGoal = current?.payload?.state?.settings?.dailyGoal;
  if (baseline === null) {
    if (!current) return;
    if (!TEST_GOALS.has(Number(currentGoal))) {
      throw new Error('LIVE_SYNC_CLEANUP_PRECONDITION_FAILED');
    }
    const deleted = await restConditionalDelete(cfgA, current.updated_at);
    if (!Array.isArray(deleted) || deleted.length !== 1) {
      throw new Error('LIVE_SYNC_BASELINE_DELETE_FAILED');
    }
    if (await restGet(cfgA)) throw new Error('LIVE_SYNC_BASELINE_DELETE_VERIFY_FAILED');
    return;
  }

  if (!current || !TEST_GOALS.has(Number(currentGoal))) {
    throw new Error('LIVE_SYNC_CLEANUP_PRECONDITION_FAILED');
  }
  const restored = await restConditionalPatch(cfgA, baseline.payload, current.updated_at);
  if (!Array.isArray(restored) || restored.length !== 1) {
    throw new Error('LIVE_SYNC_BASELINE_RESTORE_FAILED');
  }
  const restoredRemote = await restGet(cfgA);
  if (!isDeepStrictEqual(restoredRemote?.payload, baseline.payload)) {
    throw new Error('LIVE_SYNC_BASELINE_RESTORE_MISMATCH');
  }
}

async function setGoal(page, value) {
  await page.evaluate(value => {
    const api = window.__KANJI5_STATE__;
    const state = api.loadState();
    state.settings = { ...(state.settings || {}), dailyGoal: value };
    api.saveState(state);
  }, value);
}

async function getGoal(page) {
  return page.evaluate(() => window.__KANJI5_STATE__.loadState().settings.dailyGoal);
}

try {
  contextA = await browser.newContext({ serviceWorkers: 'allow' });
  contextB = await browser.newContext({ serviceWorkers: 'allow' });
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  await signIn(pageA);
  await signIn(pageB);

  cfgA = await authContext(pageA);
  const cfgB = await authContext(pageB);
  if (cfgA.userId !== cfgB.userId) throw new Error('LIVE_SYNC_USER_ID_MISMATCH');

  baseline = await restGet(cfgA);

  const goalA = 710101;
  const goalB = 720202;
  const goalConflict = 730303;
  testStarted = true;

  await setGoal(pageA, goalA);
  await pageA.evaluate(() => window.__KANJI5_ACCOUNT__.syncNow());
  await pageA.waitForFunction(() => window.__KANJI5_ACCOUNT__.getState().syncStatus === 'synced', null, { timeout: 30000 });

  const afterA = await restGet(cfgA);
  const remoteGoalA = afterA?.payload?.state?.settings?.dailyGoal;
  if (remoteGoalA !== goalA) throw new Error('LIVE_SYNC_FIRST_WRITE_FAILED');

  await setGoal(pageB, goalB);

  let conflictTriggered = false;
  await pageB.route('**/rest/v1/user_learning_state*', async route => {
    if (!conflictTriggered && route.request().method() === 'PATCH') {
      conflictTriggered = true;
      await setGoal(pageA, goalConflict);
      await pageA.evaluate(() => window.__KANJI5_ACCOUNT__.syncNow());
      await pageA.waitForFunction(() => window.__KANJI5_ACCOUNT__.getState().syncStatus === 'synced', null, { timeout: 30000 });
    }
    await route.continue();
  });

  await pageB.evaluate(() => window.__KANJI5_ACCOUNT__.syncNow());
  await pageB.unroute('**/rest/v1/user_learning_state*');

  if (!conflictTriggered) throw new Error('LIVE_SYNC_CONFLICT_INTERCEPT_NOT_REACHED');
  await pageB.waitForFunction(() => window.__KANJI5_ACCOUNT__.getState().syncStatus === 'synced', null, { timeout: 30000 });

  const mergedRemote = await restGet(cfgA);
  const mergedGoal = mergedRemote?.payload?.state?.settings?.dailyGoal;
  const mergedLocalB = await getGoal(pageB);
  if (mergedGoal !== goalConflict) throw new Error('LIVE_SYNC_CONFLICT_MERGE_FAILED_REMOTE');
  if (mergedLocalB !== goalConflict) throw new Error('LIVE_SYNC_CONFLICT_MERGE_FAILED_LOCAL');

  await cleanupRemote();
  console.log('LIVE_SUPABASE_SYNC_CONFLICT_E2E_VERIFIED');
} finally {
  try {
    await cleanupRemote();
  } catch (cleanupError) {
    console.error('LIVE_SYNC_CLEANUP_FAILED', cleanupError?.message || cleanupError);
    throw cleanupError;
  } finally {
    await contextB?.close();
    await contextA?.close();
    await browser.close();
  }
}
