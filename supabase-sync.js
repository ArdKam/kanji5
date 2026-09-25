import { mergeSyncPayload, stablePayload, hashPayload } from './v1.5-sync-core.js';
import { mergeV16SyncData, V16_SYNC_SCHEMA_VERSION } from './v1.6-sync-core.js';

const STORAGE_KEY = 'kanji5-v1';
const CARDS_STORAGE_KEY = 'kanji5-v1-cards';
const REVIEWS_STORAGE_KEY = 'kanji5-v1-reviews';
const KNOWLEDGE_KEY = 'kanji5-v1.2-knowledge';
const COMPONENT_KEY = 'kanji5-v1.5-components';
const SESSION_HISTORY_KEY = 'kanji5-v1.6-session-history';
const SYNC_META_KEY = 'kanji5-v1.2-sync-meta';
const POLL_MS = 15000;
const MAX_SYNC_ATTEMPTS = 3;
const SUPABASE_UMD = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/dist/umd/supabase.js';
const SUPABASE_JS_CANDIDATES = [
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/+esm',
  'https://esm.sh/@supabase/supabase-js@2.57.4'
];

const emptyState = {
  status: 'loading',
  user: null,
  syncStatus: 'idle',
  error: null
};

let state = { ...emptyState };
let client = null;
let user = null;
let syncPromise = null;
let pollTimer = null;
let syncDebounce = null;
const listeners = new Set();

const clone = value => value == null ? value : structuredClone(value);
const configured = () => {
  const cfg = window.KANJI5_SUPABASE;
  return Boolean(cfg?.url && cfg?.anonKey && !String(cfg.url).includes('YOUR_PROJECT_ID') && !String(cfg.anonKey).includes('YOUR_SUPABASE'));
};

function notify() {
  const snapshot = { ...state, user: state.user ? { ...state.user } : null };
  for (const listener of listeners) listener(snapshot);
}

function setState(next) {
  state = { ...state, ...next };
  notify();
}

function mapUser(value) {
  if (!value) return null;
  const meta = value.user_metadata || {};
  return {
    id: String(value.id),
    email: value.email || null,
    name: meta.full_name || meta.name || value.email || null,
    avatarUrl: meta.avatar_url || meta.picture || null
  };
}

function localPayload() {
  const persisted = safeJSON(localStorage.getItem(STORAGE_KEY), null);
  const cards = safeJSON(localStorage.getItem(CARDS_STORAGE_KEY), persisted?.cards || {});
  const reviews = safeJSON(localStorage.getItem(REVIEWS_STORAGE_KEY), persisted?.reviews || []);
  const components = safeJSON(localStorage.getItem(COMPONENT_KEY), {});
  const history = safeJSON(localStorage.getItem(SESSION_HISTORY_KEY), []);
  return {
    state: persisted ? { ...persisted, cards, reviews, queue: [], current: null, revealed: false, examples: {} } : null,
    knowledge: safeJSON(localStorage.getItem(KNOWLEDGE_KEY), {}),
    deckVersion: localStorage.getItem('kanji5-deck-version') || null,
    educationSchemaVersion: 2,
    syncSchemaVersion: 1,
    v16SyncSchemaVersion: V16_SYNC_SCHEMA_VERSION,
    sessionHistory: Array.isArray(history) ? history : [],
    components: components && typeof components === 'object' ? components : {},
    skillProfile: components?.v16SkillProfile && typeof components.v16SkillProfile === 'object' ? components.v16SkillProfile : null
  };
}

function safeJSON(raw, fallback) {
  try { return raw ? JSON.parse(raw) : fallback; } catch (_) { return fallback; }
}

function writeLocal(payload, remoteUpdatedAt = null) {
  if (payload?.state) {
    const s = payload.state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      settings: s.settings,
      today: s.today,
      todayNew: s.todayNew,
      todayReviewCount: s.todayReviewCount,
      goalCelebrated: s.goalCelebrated,
      streak: s.streak
    }));
    localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(s.cards || {}));
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(s.reviews || []));
  }
  localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(payload?.knowledge || {}));
  if (payload?.deckVersion) localStorage.setItem('kanji5-deck-version', payload.deckVersion);
  const v16 = mergeV16SyncData(payload, payload);
  const currentComponents = safeJSON(localStorage.getItem(COMPONENT_KEY), {}) || {};
  localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(v16.sessionHistory || payload?.sessionHistory || []));
  localStorage.setItem(COMPONENT_KEY, JSON.stringify({
    ...currentComponents,
    ...(v16.components || payload?.components || {}),
    ...(v16.skillProfile || payload?.skillProfile ? { v16SkillProfile: v16.skillProfile || payload.skillProfile } : {})
  }));
  localStorage.setItem(SYNC_META_KEY, JSON.stringify({
    educationSchemaVersion: Number(payload?.educationSchemaVersion) || 2,
    syncSchemaVersion: Number(payload?.syncSchemaVersion) || 1,
    v16SyncSchemaVersion: Number(payload?.v16SyncSchemaVersion) || V16_SYNC_SCHEMA_VERSION,
    syncedAt: new Date().toISOString(),
    remoteUpdatedAt: remoteUpdatedAt || null,
    payloadHash: hashPayload(payload)
  }));
}

function mergedPayload(local, remote) {
  const base = mergeSyncPayload(local, remote);
  const v16 = mergeV16SyncData(local, remote);
  return {
    ...base,
    v16SyncSchemaVersion: V16_SYNC_SCHEMA_VERSION,
    sessionHistory: v16.sessionHistory || base.sessionHistory || [],
    components: v16.components || base.components || {},
    skillProfile: v16.skillProfile || base.skillProfile || null
  };
}

async function getClient() {
  if (client) return client;
  if (!configured()) throw new Error('KANJI5_SUPABASE_NOT_CONFIGURED');
  if (globalThis.supabase?.createClient) {
    client = globalThis.supabase.createClient(window.KANJI5_SUPABASE.url, window.KANJI5_SUPABASE.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return client;
  }
  let lastError = null;
  for (const source of SUPABASE_JS_CANDIDATES) {
    try {
      const mod = await import(source);
      client = mod.createClient(window.KANJI5_SUPABASE.url, window.KANJI5_SUPABASE.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      return client;
    } catch (error) {
      lastError = error;
      console.warn('Kanji 5 Supabase client source failed', source, error);
    }
  }
  throw lastError || new Error('SUPABASE_JS_UNAVAILABLE');
  /*
  client = mod.createClient(window.KANJI5_SUPABASE.url, window.KANJI5_SUPABASE.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  return client;
  */
}

async function readRemote() {
  const c = await getClient();
  const { data, error } = await c.from('user_learning_state')
    .select('payload,updated_at')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? { payload: data.payload || null, updatedAt: data.updated_at || null } : null;
}

async function replaceRemote(payload, expectedUpdatedAt = null) {
  const c = await getClient();
  const now = new Date().toISOString();
  const rowPayload = stablePayload({ ...payload });
  if (expectedUpdatedAt) {
    const { data, error } = await c.from('user_learning_state')
      .update({ payload: rowPayload, updated_at: now })
      .eq('user_id', user.id)
      .eq('updated_at', expectedUpdatedAt)
      .select('updated_at')
      .maybeSingle();
    if (error) throw error;
    if (!data) return { conflict: true, updatedAt: expectedUpdatedAt };
    return { conflict: false, updatedAt: data.updated_at || now };
  }
  const { data, error } = await c.from('user_learning_state')
    .insert({ user_id: user.id, payload: rowPayload, updated_at: now })
    .select('updated_at')
    .maybeSingle();
  if (error) {
    if (String(error.code || '') === '23505') return { conflict: true, updatedAt: null };
    throw error;
  }
  return { conflict: false, updatedAt: data?.updated_at || now };
}

async function withSyncLock(task) {
  if (syncPromise) return syncPromise;
  syncPromise = (async () => {
    try { return await task(); }
    finally { syncPromise = null; }
  })();
  return syncPromise;
}

function setSyncStatus(syncStatus, error = null) {
  setState({ syncStatus, error });
}

async function refreshPresentationAfterSync() {
  const boundary = window.__KANJI5_V19_V2_BOUNDARY__;
  if (!boundary?.snapshot) return;
  try {
    const viewModel = await boundary.snapshot();
    if (!viewModel) return;
    window.__KANJI5_V19_V2_LAST_SNAPSHOT__ = viewModel;
    document.dispatchEvent(new CustomEvent('kanji5:v1.9-v2-view-models', { detail: viewModel }));
  } catch (error) {
    console.warn('Kanji 5 presentation refresh after sync failed', error);
  }
}

async function syncOnce() {
  const local = localPayload();
  const remoteRow = await readRemote();
  if (!remoteRow?.payload) {
    const result = await replaceRemote(local);
    if (result.conflict) return { retry: true };
    writeLocal(local, result.updatedAt);
    setSyncStatus('synced');
    return { retry: false };
  }

  const merged = mergedPayload(local, remoteRow.payload);
  const localHash = hashPayload(local);
  const mergedHash = hashPayload(merged);
  const remoteHash = hashPayload(remoteRow.payload);

  if (mergedHash === localHash && mergedHash === remoteHash) {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify({
      educationSchemaVersion: 2,
      syncSchemaVersion: 1,
      v16SyncSchemaVersion: V16_SYNC_SCHEMA_VERSION,
      syncedAt: new Date().toISOString(),
      remoteUpdatedAt: remoteRow.updatedAt,
      payloadHash: mergedHash
    }));
    setSyncStatus('synced');
    return { retry: false };
  }

  if (mergedHash === remoteHash) {
    writeLocal(merged, remoteRow.updatedAt);
    setSyncStatus('synced');
    await refreshPresentationAfterSync();
    return { retry: false };
  }

  const result = await replaceRemote(merged, remoteRow.updatedAt);
  if (result.conflict) return { retry: true };
  writeLocal(merged, result.updatedAt);
  setSyncStatus('synced');
  if (mergedHash !== localHash) await refreshPresentationAfterSync();
  return { retry: false };
}

async function syncNow() {
  if (!user) return;
  return withSyncLock(async () => {
    setSyncStatus('syncing');
    for (let attempt = 1; attempt <= MAX_SYNC_ATTEMPTS; attempt += 1) {
      try {
        const result = await syncOnce();
        if (!result.retry) return;
      } catch (error) {
        console.warn('Kanji 5 sync attempt failed', error);
        if (attempt === MAX_SYNC_ATTEMPTS) {
          setSyncStatus('error', 'SYNC_FAILED');
          return;
        }
      }
    }
    setSyncStatus('error', 'SYNC_CONFLICT');
  });
}

function scheduleSync() {
  if (!user) return;
  if (syncDebounce) window.clearTimeout(syncDebounce);
  syncDebounce = window.setTimeout(() => { syncDebounce = null; void syncNow(); }, 900);
}

function onStorage(event) {
  if ([STORAGE_KEY, CARDS_STORAGE_KEY, REVIEWS_STORAGE_KEY, KNOWLEDGE_KEY, COMPONENT_KEY, SESSION_HISTORY_KEY].includes(event.key)) scheduleSync();
}

function onVisibilityChange() {
  if (!document.hidden) scheduleSync();
}

function stopSyncLifecycle() {
  clearInterval(pollTimer);
  pollTimer = null;
  if (syncDebounce) {
    window.clearTimeout(syncDebounce);
    syncDebounce = null;
  }
  window.removeEventListener('online', scheduleSync);
  window.removeEventListener('storage', onStorage);
  document.removeEventListener('visibilitychange', onVisibilityChange);
}

function startSyncLifecycle() {
  clearInterval(pollTimer);
  pollTimer = window.setInterval(() => { void syncNow(); }, POLL_MS);
  window.removeEventListener('online', scheduleSync);
  window.addEventListener('online', scheduleSync);
  window.removeEventListener('storage', onStorage);
  window.addEventListener('storage', onStorage);
  document.removeEventListener('visibilitychange', onVisibilityChange);
  document.addEventListener('visibilitychange', onVisibilityChange);
}

async function boot() {
  if (!configured()) {
    setState({ status: 'unavailable', syncStatus: 'error', error: null });
    return;
  }
  try {
    const c = await getClient();
    const { data, error } = await c.auth.getSession();
    if (error) throw error;
    user = data.session?.user || null;
    setState({ status: user ? 'signed-in' : 'signed-out', user: mapUser(user), syncStatus: user ? 'syncing' : 'idle', error: null });
    if (user) {
      await syncNow();
      startSyncLifecycle();
    }
    c.auth.onAuthStateChange((_event, session) => {
      user = session?.user || null;
      setState({ status: user ? 'signed-in' : 'signed-out', user: mapUser(user), syncStatus: user ? 'syncing' : 'idle', error: null });
      if (user) {
        startSyncLifecycle();
        window.setTimeout(() => { void syncNow(); }, 0);
      } else {
        stopSyncLifecycle();
      }
    });
  } catch (error) {
    console.warn('Kanji 5 account unavailable', error);
    setState({ status: 'unavailable', syncStatus: 'error', error: 'AUTH_UNAVAILABLE' });
  }
}

const api = {
  getState: () => ({ ...state, user: state.user ? { ...state.user } : null }),
  subscribe(listener) {
    listeners.add(listener);
    listener(api.getState());
    return () => listeners.delete(listener);
  },
  async signInWithGoogle() {
    const c = await getClient();
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await c.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    });
    if (error) throw error;
  },
  async signInWithPassword(email, password) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !password) throw new Error('AUTH_EMAIL_PASSWORD_REQUIRED');
    const c = await getClient();
    const { error } = await c.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });
    if (error) throw error;
  },
  async signUpWithPassword(email, password) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !password) throw new Error('AUTH_EMAIL_PASSWORD_REQUIRED');
    if (password.length < 6) throw new Error('AUTH_PASSWORD_TOO_SHORT');
    const c = await getClient();
    const { data, error } = await c.auth.signUp({
      email: normalizedEmail,
      password
    });
    if (error) throw error;
    return { needsEmailConfirmation: !data.session };
  },
  async updateProfile(name) {
    const normalizedName = String(name || '').trim();
    if (!normalizedName) throw new Error('AUTH_PROFILE_NAME_REQUIRED');
    if (Array.from(normalizedName).length > 40) throw new Error('AUTH_PROFILE_NAME_TOO_LONG');
    const c = await getClient();
    const { data, error } = await c.auth.updateUser({
      data: { full_name: normalizedName }
    });
    if (error) throw error;
    user = data.user || user;
    setState({ status: 'signed-in', user: mapUser(user), error: null });
  },
  async updatePassword(currentPassword, newPassword) {
    if (!currentPassword || !newPassword) throw new Error('AUTH_PASSWORD_REQUIRED');
    if (newPassword.length < 6) throw new Error('AUTH_PASSWORD_TOO_SHORT');
    if (!user?.email) throw new Error('AUTH_EMAIL_REQUIRED');
    const c = await getClient();
    const { error: reauthError } = await c.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    });
    if (reauthError) throw new Error('AUTH_CURRENT_PASSWORD_INVALID');
    const { data, error } = await c.auth.updateUser({ password: newPassword });
    if (error) throw error;
    user = data.user || user;
    setState({ status: 'signed-in', user: mapUser(user), error: null });
  },
  async sendMagicLink(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) throw new Error('AUTH_EMAIL_REQUIRED');
    const c = await getClient();
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await c.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true
      }
    });
    if (error) throw error;
  },
  async signOut() {
    const c = await getClient();
    const { error } = await c.auth.signOut();
    if (error) throw error;
  },
  async syncNow() {
    await syncNow();
  }
};

window.__KANJI5_ACCOUNT__ = api;
void boot();
