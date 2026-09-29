const MODES = Object.freeze(["vocabulary", "context"]);
const STATES = Object.freeze(["unseen", "introduced", "retrievable", "stable"]);
const VERSION = "1.9.0-content-evidence";
const DEFAULT_LIMIT = 384;

const safeObject = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const text = (value, limit = 240) => String(value ?? "").normalize("NFKC").trim().slice(0, limit);

function hash(value) {
  let h = 2166136261;
  const source = String(value ?? "");
  for (let i = 0; i < source.length; i++) {
    h ^= source.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function makeContentEvidenceKey(mode, contentId) {
  return `${text(mode, 24)}:${hash(`${mode}|${contentId}`)}`;
}

function normalizeRecord(raw, fallback = {}) {
  const source = safeObject(raw);
  const state = STATES.includes(source.state) ? source.state : "unseen";
  return {
    version: VERSION,
    mode: text(source.mode || fallback.mode, 24),
    contentId: text(source.contentId || fallback.contentId, 240),
    character: text(source.character || fallback.character, 16),
    contentKind: text(source.contentKind || fallback.contentKind, 24),
    provenance: text(source.provenance || fallback.provenance, 80),
    state,
    exposureCount: Math.max(0, Number(source.exposureCount) || 0),
    practiceCount: Math.max(0, Number(source.practiceCount) || 0),
    correctCount: Math.max(0, Number(source.correctCount) || 0),
    wrongCount: Math.max(0, Number(source.wrongCount) || 0),
    recentWrongCount: Math.max(0, Number(source.recentWrongCount) || 0),
    currentStreak: Math.max(0, Number(source.currentStreak) || 0),
    lastOutcome: text(source.lastOutcome, 24) || "",
    errorType: text(source.errorType, 40) || "",
    lastWrongAnswer: text(source.lastWrongAnswer, 80) || "",
    firstExposedAt: text(source.firstExposedAt, 80) || "",
    lastExposedAt: text(source.lastExposedAt, 80) || "",
    firstWrongAt: text(source.firstWrongAt, 80) || "",
    lastWrongAt: text(source.lastWrongAt, 80) || "",
    lastCorrectAt: text(source.lastCorrectAt, 80) || "",
    updatedAt: text(source.updatedAt, 80) || ""
  };
}

export function createContentEvidenceStore(adapter = {}, options = {}) {
  const readComponents = typeof adapter.readComponents === "function" ? adapter.readComponents : () => ({});
  const writeComponents = typeof adapter.writeComponents === "function" ? adapter.writeComponents : () => false;
  const now = typeof options.now === "function" ? options.now : () => new Date().toISOString();
  const limit = Math.max(64, Math.min(1000, Number(options.limit) || DEFAULT_LIMIT));

  function readAll() {
    const components = safeObject(readComponents());
    const value = components.v19ContentEvidence;
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function persist(all) {
    const components = safeObject(readComponents());
    return Boolean(writeComponents({ ...components, v19ContentEvidence: all }));
  }

  function prune(all) {
    const rows = Object.entries(all);
    if (rows.length <= limit) return all;
    rows.sort(([, a], [, b]) => String(b?.updatedAt || "").localeCompare(String(a?.updatedAt || "")));
    return Object.fromEntries(rows.slice(0, limit));
  }

  function get(mode, contentId) {
    if (!MODES.includes(String(mode)) || !text(contentId, 240)) return null;
    const key = makeContentEvidenceKey(mode, contentId);
    const record = readAll()[key];
    return record ? normalizeRecord(record) : null;
  }

  function readiness(mode, contentId) {
    return get(mode, contentId)?.state || "unseen";
  }

  function recordExposure(input = {}) {
    const mode = String(input.mode || "");
    const contentId = text(input.contentId, 240);
    if (!MODES.includes(mode) || !contentId) return null;
    const key = makeContentEvidenceKey(mode, contentId);
    const all = readAll();
    const existing = normalizeRecord(all[key], { mode, contentId });
    const stamp = now();
    const next = {
      ...existing,
      mode,
      contentId,
      character: text(input.character || existing.character, 16),
      contentKind: text(input.contentKind || existing.contentKind, 24),
      provenance: text(input.provenance || existing.provenance, 80),
      state: existing.state === "unseen" ? "introduced" : existing.state,
      exposureCount: existing.exposureCount + 1,
      firstExposedAt: existing.firstExposedAt || stamp,
      lastExposedAt: stamp,
      updatedAt: stamp
    };
    const pruned = prune({ ...all, [key]: next });
    persist(pruned);
    return next;
  }

  function recordOutcome(input = {}) {
    const mode = String(input.mode || "");
    const contentId = text(input.contentId, 240);
    const outcome = text(input.outcome, 24);
    if (!MODES.includes(mode) || !contentId || !["correct", "wrong", "unknown", "near_miss"].includes(outcome)) return null;
    const key = makeContentEvidenceKey(mode, contentId);
    const all = readAll();
    const existing = normalizeRecord(all[key], { mode, contentId });
    const stamp = now();
    const next = {
      ...existing,
      mode,
      contentId,
      character: text(input.character || existing.character, 16),
      contentKind: text(input.contentKind || existing.contentKind, 24),
      provenance: text(input.provenance || existing.provenance, 80),
      practiceCount: existing.practiceCount + 1,
      lastOutcome: outcome,
      updatedAt: stamp
    };
    if (outcome === "correct") {
      next.correctCount += 1;
      next.currentStreak += 1;
      next.recentWrongCount = 0;
      next.lastCorrectAt = stamp;
      next.state = next.correctCount >= 2 ? "stable" : "retrievable";
      next.errorType = "";
      next.lastWrongAnswer = "";
    } else {
      next.wrongCount += 1;
      next.recentWrongCount += 1;
      next.currentStreak = 0;
      next.lastWrongAnswer = text(input.selectedAnswer, 80);
      next.firstWrongAt = next.firstWrongAt || stamp;
      next.lastWrongAt = stamp;
      next.errorType = outcome === "near_miss" ? "near_miss" : existing.state === "unseen" ? "unseen_content" : next.wrongCount >= 2 ? "repeated_confusion" : "wrong_choice";
      if (existing.state === "unseen") next.state = "introduced";
    }
    const pruned = prune({ ...all, [key]: next });
    persist(pruned);
    return next;
  }

  function selectContent(items, mode, options = {}) {
    const list = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!list.length || !MODES.includes(String(mode))) return null;
    const idOf = typeof options.idOf === "function" ? options.idOf : item => item?.contentId || item?.id || item?.word || item?.text || "";
    const rows = list.map(item => {
      const contentId = text(idOf(item), 240);
      const record = get(mode, contentId);
      return { item, contentId, record, state: record?.state || "unseen" };
    }).filter(row => row.contentId);

    const exposed = rows.filter(row => row.state !== "unseen");
    const pool = exposed.length ? exposed : rows;
    const mature = pool.some(row => row.state === "introduced" || row.state === "retrievable");
    const activePool = mature ? pool.filter(row => row.state !== "stable") : pool;
    const targetPool = activePool.length ? activePool : pool;
    const stageRank = { introduced: 4, retrievable: 3, stable: 2, unseen: 1 };
    return targetPool.sort((a, b) => {
      const ar = a.record?.recentWrongCount || 0;
      const br = b.record?.recentWrongCount || 0;
      if (ar !== br) return br - ar;
      const as = stageRank[a.state] || 0;
      const bs = stageRank[b.state] || 0;
      if (as !== bs) return bs - as;
      const al = String(a.record?.lastExposedAt || a.record?.updatedAt || "");
      const bl = String(b.record?.lastExposedAt || b.record?.updatedAt || "");
      if (al !== bl) return al.localeCompare(bl);
      return String(a.contentId).localeCompare(String(b.contentId));
    })[0]?.item || null;
  }

  function listMistakes(options = {}) {
    const rows = Object.values(readAll())
      .map(value => normalizeRecord(value))
      .filter(row => MODES.includes(row.mode) && row.recentWrongCount > 0);
    const character = text(options.character, 16);
    const limitValue = Math.max(1, Math.min(50, Number(options.limit) || 20));
    return rows
      .filter(row => !character || row.character === character)
      .sort((a, b) => String(b.lastWrongAt || "").localeCompare(String(a.lastWrongAt || "")))
      .slice(0, limitValue);
  }

  return Object.freeze({
    version: VERSION,
    modes: MODES,
    states: STATES,
    get,
    readiness,
    recordExposure,
    recordOutcome,
    selectContent,
    listMistakes
  });
}
