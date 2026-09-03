import { mergeSyncPayload, stablePayload, hashPayload, SYNC_SCHEMA_VERSION } from './v1.5-sync-core.js';
const V12 = "kanji5-v1.2";
const STORAGE_KEY = "kanji5-v1";
const CARDS_STORAGE_KEY = "kanji5-v1-cards";
const REVIEWS_STORAGE_KEY = "kanji5-v1-reviews";
const KNOWLEDGE_KEY = `${V12}-knowledge`;
const SYNC_META_KEY = `${V12}-sync-meta`;
const POLL_MS = 15000;
const MAX_SYNC_ATTEMPTS = 3;
const SUPABASE_JS = "https://esm.sh/@supabase/supabase-js@2.57.4";
const EDUCATION_SCHEMA_VERSION = 2;

// Date-aware merge semantics are implemented in v1.5-sync-core (sameDayLocal/sameDayRemote).
(() => {
  if (!window.KANJI5_SUPABASE) return;
  const cfg = window.KANJI5_SUPABASE;
  if (!cfg.url || !cfg.anonKey || cfg.url.includes("YOUR_PROJECT_ID") || cfg.anonKey.includes("YOUR_SUPABASE")) {
    console.info("Kanji 5 sync is not configured yet.");
    return;
  }

  let client = null;
  let user = null;
  let syncPromise = null;
  let pollTimer = null;

  const byId = id => document.getElementById(id);
  const safeJSON = (raw, fallback) => { try { return raw ? JSON.parse(raw) : fallback; } catch (_) { return fallback; } };
  const localPayload = () => {
    const persisted = safeJSON(localStorage.getItem(STORAGE_KEY), null);
    const cards = safeJSON(localStorage.getItem(CARDS_STORAGE_KEY), persisted?.cards || {});
    const reviews = safeJSON(localStorage.getItem(REVIEWS_STORAGE_KEY), persisted?.reviews || []);
    const state = persisted ? { ...persisted, cards, reviews, queue: [], current: null, revealed: false, examples: {} } : null;
    return { state, knowledge: safeJSON(localStorage.getItem(KNOWLEDGE_KEY), {}), deckVersion: localStorage.getItem("kanji5-deck-version") || null, educationSchemaVersion: EDUCATION_SCHEMA_VERSION, syncSchemaVersion: SYNC_SCHEMA_VERSION };
  };
  const readRemote = async () => {
    const { data, error } = await client.from("user_learning_state").select("payload,updated_at").eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    return data ? { payload: data.payload || null, updatedAt: data.updated_at || null } : null;
  };
  const writeLocal = (payload, remoteUpdatedAt = null) => {
    if (payload.state) {
      const state = payload.state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings: state.settings, today: state.today, todayNew: state.todayNew, todayReviewCount: state.todayReviewCount, goalCelebrated: state.goalCelebrated, streak: state.streak }));
      localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(state.cards || {}));
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(state.reviews || []));
    }
    localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(payload.knowledge || {}));
    if (payload.deckVersion) localStorage.setItem("kanji5-deck-version", payload.deckVersion);
    localStorage.setItem(SYNC_META_KEY, JSON.stringify({ educationSchemaVersion: EDUCATION_SCHEMA_VERSION, syncSchemaVersion: SYNC_SCHEMA_VERSION, syncedAt: new Date().toISOString(), remoteUpdatedAt: remoteUpdatedAt || null, payloadHash: hashPayload(payload) }));
  };
  const setStatus = (text, tone = "") => { const el = byId("syncStatusText"); if (el) { el.textContent = text; el.dataset.tone = tone; } };
  async function withSyncLock(task) { if (syncPromise) return syncPromise; syncPromise = (async () => { try { return await task(); } finally { syncPromise = null; } })(); return syncPromise; }
  async function replaceRemote(payload, expectedUpdatedAt = null) {
    const now = new Date().toISOString(), rowPayload = { ...stablePayload(payload), clientUpdatedAt: now };
    if (expectedUpdatedAt) {
      const { data, error } = await client.from("user_learning_state").update({ payload: rowPayload, updated_at: now }).eq("user_id", user.id).eq("updated_at", expectedUpdatedAt).select("updated_at").maybeSingle();
      if (error) throw error;
      if (!data) return { conflict: true, updatedAt: expectedUpdatedAt };
      return { conflict: false, updatedAt: data.updated_at || now };
    }
    const { data, error } = await client.from("user_learning_state").insert({ user_id: user.id, payload: rowPayload, updated_at: now }).select("updated_at").maybeSingle();
    if (error) { if (String(error.code || "") === "23505") return { conflict: true, updatedAt: null }; throw error; }
    return { conflict: false, updatedAt: data?.updated_at || now };
  }
  async function syncOnce() {
    const local = localPayload(), remoteRow = await readRemote();
    if (!remoteRow?.payload) {
      const result = await replaceRemote(local, null);
      if (result.conflict) return { retry: true };
      writeLocal(stablePayload(local), result.updatedAt); setStatus("همگام شد", "ok"); return { retry: false };
    }
    const merged = mergeSyncPayload(local, remoteRow.payload), localHash = hashPayload(local), mergedHash = hashPayload(merged), remoteHash = hashPayload(remoteRow.payload);
    if (mergedHash === localHash && mergedHash === remoteHash) {
      localStorage.setItem(SYNC_META_KEY, JSON.stringify({ educationSchemaVersion: EDUCATION_SCHEMA_VERSION, syncSchemaVersion: SYNC_SCHEMA_VERSION, syncedAt: new Date().toISOString(), remoteUpdatedAt: remoteRow.updatedAt, payloadHash: mergedHash }));
      setStatus("همگام است", "ok"); return { retry: false };
    }
    if (mergedHash === remoteHash) {
      writeLocal(merged, remoteRow.updatedAt); setStatus("داده‌های جدید دریافت شد", "ok"); setTimeout(() => location.reload(), 250); return { retry: false };
    }
    const result = await replaceRemote(merged, remoteRow.updatedAt);
    if (result.conflict) return { retry: true };
    writeLocal(merged, result.updatedAt);
    if (mergedHash !== localHash) { setStatus("داده‌های ادغام‌شده دریافت شد", "ok"); setTimeout(() => location.reload(), 250); } else setStatus("همگام شد", "ok");
    return { retry: false };
  }
  async function pullAndMerge() {
    if (!user) return;
    return withSyncLock(async () => {
      for (let attempt = 1; attempt <= MAX_SYNC_ATTEMPTS; attempt += 1) {
        try { const result = await syncOnce(); if (!result.retry) return; }
        catch (e) { console.warn("Kanji 5 sync attempt failed", e); if (attempt === MAX_SYNC_ATTEMPTS) { setStatus("اتصال به sync ناموفق", "error"); return; } }
      }
      setStatus("تغییرات همزمان دریافت شد؛ دوباره تلاش کن", "error");
    });
  }
  async function getClient() { if (client) return client; const mod = await import(SUPABASE_JS); client = mod.createClient(cfg.url, cfg.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }); return client; }
  function ensureUI() {
    if (byId("syncBtn")) return;
    const wrap = document.querySelector("header > div:last-child"); if (!wrap) return;
    const button = document.createElement("button"); button.className = "iconbtn"; button.id = "syncBtn"; button.setAttribute("aria-label", "حساب و همگام‌سازی"); button.textContent = "☁️"; button.addEventListener("click", openAuth); wrap.prepend(button);
    const dialog = document.createElement("dialog"); dialog.id = "syncDialog"; dialog.innerHTML = `<div class="modal"><h2>حساب و همگام‌سازی</h2><div id="syncContent"></div><div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px"><button class="secondary" id="closeSync">بستن</button></div></div>`; document.body.appendChild(dialog); byId("closeSync").addEventListener("click", () => dialog.close());
  }
  function openAuth() {
    const dialog = byId("syncDialog"), content = byId("syncContent"); if (!dialog || !content) return;
    if (user) {
      content.innerHTML = `<p>ورود با <b id="syncUserEmail"></b></p><p id="syncStatusText" style="color:#6b7280">همگام‌سازی خودکار فعال است.</p><div style="display:flex;gap:8px"><button class="primary" id="syncNow">همگام‌سازی الآن</button><button class="secondary" id="signOut">خروج</button></div>`;
      const emailEl = byId("syncUserEmail"); if (emailEl) emailEl.textContent = user.email || "Google";
      byId("syncNow").addEventListener("click", pullAndMerge); byId("signOut").addEventListener("click", async () => { await client.auth.signOut(); dialog.close(); });
    } else {
      content.innerHTML = `<button class="primary" id="googleLogin" style="width:100%;margin-bottom:10px">ورود با Google</button><div style="text-align:center;color:#6b7280;margin:8px 0">یا</div><input id="syncEmail" type="email" placeholder="ایمیل" autocomplete="email" style="width:100%;border:1px solid var(--line);border-radius:10px;padding:10px;box-sizing:border-box"><input id="syncPassword" type="password" placeholder="رمز عبور" autocomplete="current-password" style="width:100%;border:1px solid var(--line);border-radius:10px;padding:10px;box-sizing:border-box;margin-top:8px"><div style="display:flex;gap:8px;margin-top:10px"><button class="primary" id="emailLogin">ورود</button><button class="secondary" id="emailSignup">ساخت حساب</button></div><p id="syncMsg" style="color:#6b7280;font-size:12px;margin-top:10px"></p>`;
      byId("googleLogin").addEventListener("click", async () => { try { const c = await getClient(); const { error } = await c.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.href } }); if (error) byId("syncMsg").textContent = error.message; } catch (e) { byId("syncMsg").textContent = e.message || String(e); } });
      byId("emailLogin").addEventListener("click", () => emailAuth(false)); byId("emailSignup").addEventListener("click", () => emailAuth(true));
    }
    dialog.showModal();
  }
  async function emailAuth(signup) {
    const email = byId("syncEmail")?.value.trim(), password = byId("syncPassword")?.value || "", msg = byId("syncMsg");
    if (!email || password.length < 6) { if (msg) msg.textContent = "ایمیل و رمز عبور حداقل ۶ کاراکتری را وارد کن."; return; }
    try { const c = await getClient(); const result = signup ? await c.auth.signUp({ email, password, options: { emailRedirectTo: location.href } }) : await c.auth.signInWithPassword({ email, password }); if (result.error) { if (msg) msg.textContent = result.error.message; return; } if (signup && !result.data.session && msg) msg.textContent = "ایمیل تأیید برایت ارسال شد."; }
    catch (e) { if (msg) msg.textContent = e.message || String(e); }
  }
  async function boot() {
    ensureUI();
    try {
      const c = await getClient(); const { data } = await c.auth.getSession(); user = data.session?.user || null;
      if (user) { setStatus("در حال همگام‌سازی…"); await pullAndMerge(); clearInterval(pollTimer); pollTimer = setInterval(pullAndMerge, POLL_MS); window.addEventListener("online", pullAndMerge); window.addEventListener("storage", event => { if ([STORAGE_KEY, CARDS_STORAGE_KEY, REVIEWS_STORAGE_KEY, KNOWLEDGE_KEY].includes(event.key)) pullAndMerge(); }); document.addEventListener("visibilitychange", () => { if (!document.hidden) pullAndMerge(); }); }
      c.auth.onAuthStateChange(async (_event, session) => { user = session?.user || null; if (user) { await pullAndMerge(); clearInterval(pollTimer); pollTimer = setInterval(pullAndMerge, POLL_MS); } else { clearInterval(pollTimer); setStatus("وارد نشده"); } });
    } catch (e) { console.warn("Kanji 5 sync unavailable", e); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true }); else boot();
})();
