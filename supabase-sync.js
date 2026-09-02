import { mergeModeStats as mergeEducationModeStats, mergeKnowledgeEntry as mergeEducationKnowledgeEntry, mergeKnowledge as mergeEducationKnowledge } from './v1.5-education-sync-core.js';
import { mergeReviewEvents, replayCards } from './v1.5-fsrs-sync-core.js';
import { fsrs } from './vendor/ts-fsrs-5.4.1.mjs';
const V12 = "kanji5-v1.2";
const STORAGE_KEY = "kanji5-v1";
const CARDS_STORAGE_KEY = "kanji5-v1-cards";
const REVIEWS_STORAGE_KEY = "kanji5-v1-reviews";
const KNOWLEDGE_KEY = `${V12}-knowledge`;
const SYNC_META_KEY = `${V12}-sync-meta`;
const POLL_MS = 15000;
const SUPABASE_JS = "https://esm.sh/@supabase/supabase-js@2.57.4";
const EDUCATION_SCHEMA_VERSION = 2;
const EDUCATION_MODES = ["meaning", "reading", "production", "vocabulary", "context"];

(() => {
  if (!window.KANJI5_SUPABASE) return;
  const cfg = window.KANJI5_SUPABASE;
  if (!cfg.url || !cfg.anonKey || cfg.url.includes("YOUR_PROJECT_ID") || cfg.anonKey.includes("YOUR_SUPABASE")) {
    console.info("Kanji 5 sync is not configured yet.");
    return;
  }

  let client = null;
  let user = null;
  let syncing = false;
  let syncPromise = null;
  let pollTimer = null;

  const byId = id => document.getElementById(id);
  const safeJSON = (raw, fallback) => { try { return raw ? JSON.parse(raw) : fallback; } catch (_) { return fallback; } };
  const localPayload = () => {
    const persisted = safeJSON(localStorage.getItem(STORAGE_KEY), null);
    const cards = safeJSON(localStorage.getItem(CARDS_STORAGE_KEY), persisted?.cards || {});
    const reviews = safeJSON(localStorage.getItem(REVIEWS_STORAGE_KEY), persisted?.reviews || []);
    const state = persisted ? { ...persisted, cards, reviews, queue: [], current: null, revealed: false, examples: {} } : null;
    return { state, knowledge: safeJSON(localStorage.getItem(KNOWLEDGE_KEY), {}), deckVersion: localStorage.getItem("kanji5-deck-version") || null, educationSchemaVersion: EDUCATION_SCHEMA_VERSION };
  };
  const reviewsFor = state => Array.isArray(state?.reviews) ? state.reviews : [];
  const stablePayload = payload => ({ state: payload.state || null, knowledge: payload.knowledge || {}, deckVersion: payload.deckVersion || null, educationSchemaVersion: payload.educationSchemaVersion || EDUCATION_SCHEMA_VERSION });
  const hash = value => { const s = JSON.stringify(stablePayload(value)); let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };
  const lastReviewAt = (state, id) => {
    let latest = "";
    for (const review of reviewsFor(state)) if (review.id === id && review.at && review.at > latest) latest = review.at;
    const card = state?.cards?.[id];
    if (card?.learnedAt && card.learnedAt > latest) latest = card.learnedAt;
    return latest;
  };
  const mergeState = (local, remote) => {
    if (!local) return remote || null;
    if (!remote) return local;
    const merged = { ...local, ...remote, settings: { ...(local.settings || {}), ...(remote.settings || {}) } };
    const ids = new Set([...Object.keys(local.cards || {}), ...Object.keys(remote.cards || {})]);
    merged.cards = {};
    for (const id of ids) {
      const lc = local.cards?.[id], rc = remote.cards?.[id];
      if (!lc) merged.cards[id] = rc;
      else if (!rc) merged.cards[id] = lc;
      else merged.cards[id] = lastReviewAt(local, id) >= lastReviewAt(remote, id) ? lc : rc;
    }
    merged.reviews = mergeReviewEvents(reviewsFor(local), reviewsFor(remote), 5000);
    const replayable = merged.reviews.filter(event => event.eventId && event.baseRecord);
    if (replayable.length) {
      const settings = { retention: Number(merged.settings?.retention) || 0.90, maxInterval: Number(merged.settings?.maxInterval) || 36500 };
      merged.cards = replayCards(merged.cards, replayable, () => { const scheduler=fsrs({request_retention:settings.retention,maximum_interval:settings.maxInterval,enable_fuzz:true,enable_short_term:true,learning_steps:["1m","10m"],relearning_steps:["10m"]}); return {next:scheduler.next.bind(scheduler),Rating:{Again:1,Hard:2,Good:3,Easy:4}}; }, Number(merged.settings?.leechThreshold) || 8);
    }
    const currentToday = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const localToday = String(local.today || ""), remoteToday = String(remote.today || "");
    merged.today = localToday >= remoteToday ? (localToday || remoteToday) : remoteToday;
    if (!merged.today || merged.today < currentToday) merged.today = currentToday;
    const sameDayLocal = localToday === merged.today;
    const sameDayRemote = remoteToday === merged.today;
    merged.todayNew = Math.max(sameDayLocal ? Number(local.todayNew) || 0 : 0, sameDayRemote ? Number(remote.todayNew) || 0 : 0);
    merged.todayReviewCount = Math.max(sameDayLocal ? Number(local.todayReviewCount) || 0 : 0, sameDayRemote ? Number(remote.todayReviewCount) || 0 : 0);
    merged.goalCelebrated = Boolean((sameDayLocal && local.goalCelebrated) || (sameDayRemote && remote.goalCelebrated));
    merged.streak = (local.streak?.lastActiveDate || "") >= (remote.streak?.lastActiveDate || "") ? local.streak : remote.streak;
    merged.queue = [];
    merged.current = null;
    merged.revealed = false;
    merged.examples = {};
    return merged;
  };
  const mergeModeStats = (local, remote) => mergeEducationModeStats(local, remote);
  const mergeKnowledgeEntry = (localEntry, remoteEntry) => mergeEducationKnowledgeEntry(localEntry, remoteEntry);
  const mergeKnowledge = (local, remote) => mergeEducationKnowledge(local, remote);
  const writeLocal = payload => {
    if (payload.state) {
      const state = payload.state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings: state.settings, today: state.today, todayNew: state.todayNew, todayReviewCount: state.todayReviewCount, goalCelebrated: state.goalCelebrated, streak: state.streak }));
      localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(state.cards || {}));
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(state.reviews || []));
    }
    localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(payload.knowledge || {}));
    if (payload.deckVersion) localStorage.setItem("kanji5-deck-version", payload.deckVersion);
    localStorage.setItem(SYNC_META_KEY, JSON.stringify({ educationSchemaVersion: EDUCATION_SCHEMA_VERSION, syncedAt: new Date().toISOString() }));
  };
  const setStatus = (text, tone = "") => { const el = byId("syncStatusText"); if (el) { el.textContent = text; el.dataset.tone = tone; } };

  async function withSyncLock(task) {
    if (syncPromise) return syncPromise;
    syncPromise = (async () => {
      syncing = true;
      try { return await task(); }
      finally { syncing = false; syncPromise = null; }
    })();
    return syncPromise;
  }

  async function pushUnlocked(local, remote) {
    if (!user) return;
    const merged = { state: mergeState(local.state, remote?.state), knowledge: mergeKnowledge(local.knowledge, remote?.knowledge), deckVersion: local.deckVersion || remote?.deckVersion || null, educationSchemaVersion: EDUCATION_SCHEMA_VERSION };
    writeLocal(merged);
    const now = new Date().toISOString();
    const { error } = await client.from("user_learning_state").upsert({ user_id: user.id, payload: { ...merged, clientUpdatedAt: now }, updated_at: now }, { onConflict: "user_id" });
    if (error) throw error;
    setStatus("همگام شد", "ok");
  }

  async function push(local, remote) {
    if (!user) return;
    return withSyncLock(async () => {
      try { await pushUnlocked(local, remote); }
      catch (e) { console.warn("Kanji 5 sync push failed", e); setStatus("همگام‌سازی ناموفق", "error"); }
    });
  }

  async function pullAndMerge() {
    if (!user) return;
    return withSyncLock(async () => {
      try {
        const local = localPayload();
        const { data, error } = await client.from("user_learning_state").select("payload,updated_at").eq("user_id", user.id).maybeSingle();
        if (error) throw error;
        const remote = data?.payload || null;
        if (!remote) { await pushUnlocked(local, null); return; }
        const remoteStable = stablePayload(remote);
        const merged = { state: mergeState(local.state, remote.state), knowledge: mergeKnowledge(local.knowledge, remote.knowledge), deckVersion: local.deckVersion || remote.deckVersion || null, educationSchemaVersion: EDUCATION_SCHEMA_VERSION };
        const localHash = hash(local), mergedHash = hash(merged), remoteHash = hash(remoteStable);
        if (mergedHash !== localHash) {
          writeLocal(merged);
          setStatus("داده‌های جدید دریافت شد", "ok");
          setTimeout(() => location.reload(), 250);
        } else setStatus("همگام است", "ok");
        if (mergedHash !== remoteHash) await pushUnlocked(merged, remote);
      } catch (e) {
        console.warn("Kanji 5 sync pull failed", e);
        setStatus("اتصال به sync ناموفق", "error");
      }
    });
  }

  async function getClient() {
    if (client) return client;
    const mod = await import(SUPABASE_JS);
    client = mod.createClient(cfg.url, cfg.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    return client;
  }

  function ensureUI() {
    if (byId("syncBtn")) return;
    const wrap = document.querySelector("header > div:last-child");
    if (!wrap) return;
    const button = document.createElement("button"); button.className = "iconbtn"; button.id = "syncBtn"; button.setAttribute("aria-label", "حساب و همگام‌سازی"); button.textContent = "☁️"; button.addEventListener("click", openAuth); wrap.prepend(button);
    const dialog = document.createElement("dialog"); dialog.id = "syncDialog"; dialog.innerHTML = `<div class="modal"><h2>حساب و همگام‌سازی</h2><div id="syncContent"></div><div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px"><button class="secondary" id="closeSync">بستن</button></div></div>`; document.body.appendChild(dialog); byId("closeSync").addEventListener("click", () => dialog.close());
  }

  function openAuth() {
    const dialog = byId("syncDialog"), content = byId("syncContent"); if (!dialog || !content) return;
    if (user) {
      content.innerHTML = `<p>ورود با <b id="syncUserEmail"></b></p><p id="syncStatusText" style="color:#6b7280">همگام‌سازی خودکار فعال است.</p><div style="display:flex;gap:8px"><button class="primary" id="syncNow">همگام‌سازی الآن</button><button class="secondary" id="signOut">خروج</button></div>`;
      const emailEl = byId("syncUserEmail");
      if (emailEl) emailEl.textContent = user.email || "Google";
      byId("syncNow").addEventListener("click", pullAndMerge); byId("signOut").addEventListener("click", async () => { await client.auth.signOut(); dialog.close(); });
    } else {
      content.innerHTML = `<button class="primary" id="googleLogin" style="width:100%;margin-bottom:10px">ورود با Google</button><div style="text-align:center;color:#6b7280;margin:8px 0">یا</div><input id="syncEmail" type="email" placeholder="ایمیل" autocomplete="email" style="width:100%;border:1px solid var(--line);border-radius:10px;padding:10px;box-sizing:border-box"><input id="syncPassword" type="password" placeholder="رمز عبور" autocomplete="current-password" style="width:100%;border:1px solid var(--line);border-radius:10px;padding:10px;box-sizing:border-box;margin-top:8px"><div style="display:flex;gap:8px;margin-top:10px"><button class="primary" id="emailLogin">ورود</button><button class="secondary" id="emailSignup">ساخت حساب</button></div><p id="syncMsg" style="color:#6b7280;font-size:12px;margin-top:10px"></p>`;
      byId("googleLogin").addEventListener("click", async () => { const c = await getClient(); const { error } = await c.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.href } }); if (error) byId("syncMsg").textContent = error.message; });
      byId("emailLogin").addEventListener("click", () => emailAuth(false)); byId("emailSignup").addEventListener("click", () => emailAuth(true));
    }
    dialog.showModal();
  }

  async function emailAuth(signup) {
    const email = byId("syncEmail")?.value.trim(), password = byId("syncPassword")?.value || "", msg = byId("syncMsg");
    if (!email || password.length < 6) { if (msg) msg.textContent = "ایمیل و رمز عبور حداقل ۶ کاراکتری را وارد کن."; return; }
    const c = await getClient();
    const result = signup ? await c.auth.signUp({ email, password, options: { emailRedirectTo: location.href } }) : await c.auth.signInWithPassword({ email, password });
    if (result.error) { if (msg) msg.textContent = result.error.message; return; }
    if (signup && !result.data.session && msg) msg.textContent = "ایمیل تأیید برایت ارسال شد.";
  }

  async function boot() {
    ensureUI();
    try {
      const c = await getClient(); const { data } = await c.auth.getSession(); user = data.session?.user || null;
      if (user) { setStatus("در حال همگام‌سازی…"); await pullAndMerge(); clearInterval(pollTimer); pollTimer = setInterval(pullAndMerge, POLL_MS); window.addEventListener("online", pullAndMerge); document.addEventListener("visibilitychange", () => { if (!document.hidden) pullAndMerge(); }); }
      c.auth.onAuthStateChange(async (_event, session) => { user = session?.user || null; if (user) { await pullAndMerge(); clearInterval(pollTimer); pollTimer = setInterval(pullAndMerge, POLL_MS); } else { clearInterval(pollTimer); setStatus("وارد نشده"); } });
    } catch (e) { console.warn("Kanji 5 sync unavailable", e); }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true }); else boot();
})();
