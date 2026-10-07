import { mergeSyncPayload, stablePayload, hashPayload } from './v1.5-sync-core.js';
import { mergeV16SyncData, V16_SYNC_SCHEMA_VERSION } from './v1.6-sync-core.js';

const storage=window.__KANJI5_STORAGE__||localStorage;

const K=window.__KANJI5_STORAGE_KEYS__;
if(!K)throw new Error("KANJI5_STORAGE_KEYS_NOT_LOADED");
const STORAGE_KEY=K.state;
const CARDS_STORAGE_KEY=K.cards;
const REVIEWS_STORAGE_KEY=K.reviews;
const REVIEW_SUMMARY_KEY=K.reviewSummary;
const KNOWLEDGE_KEY=K.knowledge;
const COMPONENT_KEY=K.components;
const SESSION_HISTORY_KEY=K.sessionHistory;
const SYNC_META_KEY = 'kanji5-v1.2-sync-meta';
const POLL_MS = 60000;
const MAX_SYNC_ATTEMPTS = 3;
const MAX_SYNC_PAYLOAD_BYTES = 5 * 1024 * 1024;
const SUPABASE_BROWSER_RUNTIME = './vendor/supabase-js-2.117.2.js';
let supabaseRuntimePromise = null;

const emptyState = {
  status: 'loading',
  user: null,
  syncStatus: 'idle',
  error: null,
  recoveryPending: false,
  syncSummary: { activeCards: 0, reviews: 0, personalMnemonics: 0, lastSyncedAt: null }
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
  state = { ...state, ...next, syncSummary: readSyncSummary() };
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
  const persisted = safeJSON(storage.getItem(STORAGE_KEY), null);
  const cards = safeJSON(storage.getItem(CARDS_STORAGE_KEY), persisted?.cards || {});
  const reviews = safeJSON(storage.getItem(REVIEWS_STORAGE_KEY), persisted?.reviews || []);
  const reviewSummary = safeJSON(storage.getItem(REVIEW_SUMMARY_KEY), persisted?.reviewSummary || null);
  const components = safeJSON(storage.getItem(COMPONENT_KEY), {});
  const history = safeJSON(storage.getItem(SESSION_HISTORY_KEY), []);
  return {
    state: persisted ? { ...persisted, cards, reviews, reviewSummary, queue: [], current: null, revealed: false, examples: {} } : null,
    knowledge: safeJSON(storage.getItem(KNOWLEDGE_KEY), {}),
    deckVersion: storage.getItem('kanji5-deck-version') || null,
    educationSchemaVersion: 2,
    syncSchemaVersion: 1,
    v16SyncSchemaVersion: V16_SYNC_SCHEMA_VERSION,
    sessionHistory: Array.isArray(history) ? history : [],
    components: components && typeof components === 'object' ? components : {},
    skillProfile: components?.v16SkillProfile && typeof components.v16SkillProfile === 'object' ? components.v16SkillProfile : null
  };
}

function assertSyncPayloadWithinLimit(payload){
  const bytes=typeof TextEncoder==='undefined'
    ? JSON.stringify(payload).length
    : new TextEncoder().encode(JSON.stringify(payload)).byteLength;
  if(bytes>MAX_SYNC_PAYLOAD_BYTES)throw new Error('SYNC_PAYLOAD_TOO_LARGE');
  return payload;
}

function safeJSON(raw, fallback) {
  try { return raw ? JSON.parse(raw) : fallback; } catch (_) { return fallback; }
}

function assertSyncPayloadWithinLimit(payload) {
  const json = JSON.stringify(stablePayload(payload || {}));
  const bytes = typeof TextEncoder === 'function' ? new TextEncoder().encode(json).byteLength : json.length;
  if (bytes > MAX_SYNC_PAYLOAD_BYTES) throw new Error('SYNC_PAYLOAD_TOO_LARGE');
  return payload;
}

function readSyncSummary() {
  const cards = safeJSON(storage.getItem(CARDS_STORAGE_KEY), {});
  const reviews = safeJSON(storage.getItem(REVIEWS_STORAGE_KEY), []);
  const reviewSummary = safeJSON(storage.getItem(REVIEW_SUMMARY_KEY), null);
  const knowledge = safeJSON(storage.getItem(KNOWLEDGE_KEY), {});
  const meta = safeJSON(storage.getItem(SYNC_META_KEY), {});
  const activeCards = cards && typeof cards === 'object' ? Object.values(cards).filter(entry => entry?.card).length : 0;
  const personalMnemonics = knowledge && typeof knowledge === 'object' && knowledge.v2Mnemonics && typeof knowledge.v2Mnemonics === 'object'
    ? Object.values(knowledge.v2Mnemonics).filter(value => typeof value === 'string' && value.trim()).length
    : 0;
  return {
    activeCards,
    reviews: Math.max(Number(reviewSummary?.totalReviews) || 0, Array.isArray(reviews) ? reviews.length : 0),
    personalMnemonics,
    lastSyncedAt: typeof meta?.syncedAt === 'string' ? meta.syncedAt : null
  };
}

function writeLocal(payload, remoteUpdatedAt = null) {
  if (payload?.state) {
    const s = payload.state;
    storage.setItem(STORAGE_KEY, JSON.stringify({
      settings: s.settings,
      today: s.today,
      todayNew: s.todayNew,
      todayReviewCount: s.todayReviewCount,
      goalCelebrated: s.goalCelebrated,
      streak: s.streak
    }));
    storage.setItem(CARDS_STORAGE_KEY, JSON.stringify(s.cards || {}));
    storage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(s.reviews || []));
    if (s.reviewSummary && typeof s.reviewSummary === 'object') storage.setItem(REVIEW_SUMMARY_KEY, JSON.stringify(s.reviewSummary));
  }
  storage.setItem(KNOWLEDGE_KEY, JSON.stringify(payload?.knowledge || {}));
  if (payload?.deckVersion) storage.setItem('kanji5-deck-version', payload.deckVersion);
  const v16 = mergeV16SyncData(payload, payload);
  const currentComponents = safeJSON(storage.getItem(COMPONENT_KEY), {}) || {};
  storage.setItem(SESSION_HISTORY_KEY, JSON.stringify(v16.sessionHistory || payload?.sessionHistory || []));
  storage.setItem(COMPONENT_KEY, JSON.stringify({
    ...currentComponents,
    ...(v16.components || payload?.components || {}),
    ...(v16.skillProfile || payload?.skillProfile ? { v16SkillProfile: v16.skillProfile || payload.skillProfile } : {})
  }));
  storage.setItem(SYNC_META_KEY, JSON.stringify({
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

function loadSupabaseRuntime(){
  if(globalThis.supabase?.createClient)return Promise.resolve(globalThis.supabase.createClient);
  if(supabaseRuntimePromise)return supabaseRuntimePromise;
  supabaseRuntimePromise=new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-kanji5-supabase-runtime]');
    const finish=()=>{
      const factory=globalThis.supabase?.createClient;
      if(factory)resolve(factory);else reject(new Error('SUPABASE_JS_UNAVAILABLE'));
    };
    if(existing){
      existing.addEventListener('load',finish,{once:true});
      existing.addEventListener('error',()=>reject(new Error('SUPABASE_JS_LOAD_FAILED')),{once:true});
      return;
    }
    const script=document.createElement('script');
    script.src=SUPABASE_BROWSER_RUNTIME;
    script.async=true;
    script.dataset.kanji5SupabaseRuntime='true';
    script.onload=finish;
    script.onerror=()=>reject(new Error('SUPABASE_JS_LOAD_FAILED'));
    document.head.appendChild(script);
  });
  return supabaseRuntimePromise;
}

async function getClient() {
  if (client) return client;
  if (!configured()) throw new Error('KANJI5_SUPABASE_NOT_CONFIGURED');
  const createClient=await loadSupabaseRuntime();
  client=createClient(window.KANJI5_SUPABASE.url,window.KANJI5_SUPABASE.anonKey,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
  });
  return client;
}

async function readRemote() {
  const c = await getClient();
  const { data, error } = await c.from('user_learning_state')
    .select('payload,updated_at')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  if (data?.payload) assertSyncPayloadWithinLimit(data.payload);
  return data ? { payload: data.payload || null, updatedAt: data.updated_at || null } : null;
}

async function replaceRemote(payload, expectedUpdatedAt = null) {
  const c = await getClient();
  const now = new Date().toISOString();
  assertSyncPayloadWithinLimit(payload);
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
  const local = assertSyncPayloadWithinLimit(localPayload());
  const remoteRow = await readRemote();
  if (!remoteRow?.payload) {
    const result = await replaceRemote(local);
    if (result.conflict) return { retry: true };
    writeLocal(local, result.updatedAt);
    setSyncStatus('synced');
    return { retry: false };
  }

  const merged = assertSyncPayloadWithinLimit(mergedPayload(local, remoteRow.payload));
  const localHash = hashPayload(local);
  const mergedHash = hashPayload(merged);
  const remotePayload = assertSyncPayloadWithinLimit(remoteRow.payload);
  const remoteHash = hashPayload(remotePayload);

  if (mergedHash === localHash && mergedHash === remoteHash) {
    storage.setItem(SYNC_META_KEY, JSON.stringify({
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
          window.__KANJI5_OBSERVABILITY__?.capture?.('sync-failure',error,{attempts:MAX_SYNC_ATTEMPTS,code:String(error?.code||'')});
          setSyncStatus('error', 'SYNC_FAILED');
          return;
        }
      }
    }
    window.__KANJI5_OBSERVABILITY__?.capture?.('sync-conflict',{message:'SYNC_CONFLICT'},{attempts:MAX_SYNC_ATTEMPTS});
    setSyncStatus('error', 'SYNC_CONFLICT');
  });
}

function scheduleSync() {
  if (!user) return;
  if (syncDebounce) window.clearTimeout(syncDebounce);
  syncDebounce = window.setTimeout(() => { syncDebounce = null; void syncNow(); }, 900);
}

function onStorage(event) {
  if ([STORAGE_KEY, CARDS_STORAGE_KEY, REVIEWS_STORAGE_KEY, REVIEW_SUMMARY_KEY, KNOWLEDGE_KEY, COMPONENT_KEY, SESSION_HISTORY_KEY].includes(event.key)) scheduleSync();
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
    c.auth.onAuthStateChange((event, session) => {
      user = session?.user || null;
      const recoveryPending = event === 'PASSWORD_RECOVERY' ? true : state.recoveryPending;
      setState({
        status: user ? 'signed-in' : 'signed-out',
        user: mapUser(user),
        syncStatus: user ? 'syncing' : 'idle',
        recoveryPending,
        error: null
      });
      if (user) {
        startSyncLifecycle();
        window.setTimeout(() => { void syncNow(); }, 0);
      } else {
        stopSyncLifecycle();
        setState({ recoveryPending: false });
      }
    });

    const { data, error } = await c.auth.getSession();
    if (error) throw error;
    user = data.session?.user || null;
    setState({
      status: user ? 'signed-in' : 'signed-out',
      user: mapUser(user),
      syncStatus: user ? 'syncing' : 'idle',
      recoveryPending: state.recoveryPending,
      error: null
    });
    if (user) {
      await syncNow();
      startSyncLifecycle();
    }
  } catch (error) {
    console.warn('Kanji 5 account unavailable', error);
    setState({ status: 'unavailable', syncStatus: 'error', error: 'AUTH_UNAVAILABLE', recoveryPending: false });
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
  async sendPasswordReset(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) throw new Error('AUTH_RESET_EMAIL_REQUIRED');
    const c = await getClient();
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await c.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });
    if (error) throw new Error('AUTH_RESET_FAILED');
  },
  async setPassword(newPassword) {
    if (!newPassword) throw new Error('AUTH_PASSWORD_REQUIRED');
    if (newPassword.length < 6) throw new Error('AUTH_PASSWORD_TOO_SHORT');
    const c = await getClient();
    const { data, error } = await c.auth.updateUser({ password: newPassword });
    if (error) throw new Error('AUTH_SET_PASSWORD_FAILED');
    user = data.user || user;
    setState({ status: 'signed-in', user: mapUser(user), recoveryPending: false, error: null });
  },
  async signOut() {
    const c = await getClient();
    const { error } = await c.auth.signOut();
    if (error) throw error;
  },
  async syncNow() {
    await syncNow();
  },
  getSyncSummary() {
    return { ...readSyncSummary() };
  }
};

window.__KANJI5_ACCOUNT__ = api;
void boot();
