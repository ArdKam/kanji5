export const CUSTOM_STUDY_VERSION = "1.0.0";
const LEVELS = new Set(["all", "N5", "N4", "N3", "N2", "N1"]);
const FOCUSES = new Set(["available", "due", "new", "weak"]);

const n = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

export function normalizeCustomStudyFilter(filter = {}) {
  const input = filter && typeof filter === "object" ? filter : {};
  const level = LEVELS.has(String(input.level || "all")) ? String(input.level || "all") : "all";
  const focus = FOCUSES.has(String(input.focus || "available")) ? String(input.focus || "available") : "available";
  const limit = Math.max(1, Math.min(100, Math.round(n(input.limit) || 20)));
  return Object.freeze({ version: CUSTOM_STUDY_VERSION, level, focus, limit });
}

function isDue(card, now) {
  if (!card?.due) return false;
  const due = Date.parse(card.due);
  return Number.isFinite(due) && due <= now;
}

function isWeak(character, learner) {
  const attrs = learner?.kanji?.[character]?.attributes;
  if (!attrs || typeof attrs !== "object") return false;
  return Object.values(attrs).some((attr) => {
    const attempts = n(attr?.attempts);
    const accuracy = n(attr?.accuracy);
    const state = String(attr?.state || "");
    return state === "weak" || state === "recovering" || Boolean(attr?.repeatedFailure) || (attempts >= 2 && accuracy < 0.7);
  });
}

export function selectCustomStudyItems({ deck = [], cards = {}, learner = {}, filter = {}, now = Date.now(), dailyNew = 5, todayNew = 0 } = {}) {
  const normalized = normalizeCustomStudyFilter(filter);
  const allowed = Array.isArray(deck) ? deck.filter(Boolean) : [];
  const levelFiltered = normalized.level === "all"
    ? allowed
    : allowed.filter((item) => String(item?.jlpt || "") === normalized.level);

  const rows = levelFiltered.map((item, index) => {
    const id = String(item?.id || item?.character || "").trim();
    const character = String(item?.character || item?.id || "").trim();
    const card = cards?.[id]?.card || cards?.[character]?.card || null;
    const due = isDue(card, now);
    const isNew = !card;
    return { item, id, character, index, due, isNew, weak: isWeak(character, learner), dueAt: due ? Date.parse(card.due) : Infinity };
  });

  let eligible = rows;
  if (normalized.focus === "due") eligible = rows.filter((row) => row.due);
  else if (normalized.focus === "new") eligible = rows.filter((row) => row.isNew);
  else if (normalized.focus === "weak") eligible = rows.filter((row) => row.weak && row.due);
  else eligible = rows.filter((row) => row.due || row.isNew);

  eligible.sort((a, b) => {
    if (a.due !== b.due) return a.due ? -1 : 1;
    if (a.due && b.due) return a.dueAt - b.dueAt;
    return a.index - b.index;
  });

  let result = eligible;
  if (normalized.focus === "new" || normalized.focus === "available") {
    const newBudget = Math.max(0, Math.min(
      normalized.limit,
      Math.max(0, Math.round(n(dailyNew) || 5) - Math.max(0, Math.round(n(todayNew))))
    ));
    const dueRows = eligible.filter((row) => row.due);
    const newRows = eligible.filter((row) => row.isNew).slice(0, newBudget);
    result = [...dueRows, ...newRows];
    result.sort((a, b) => {
      if (a.due !== b.due) return a.due ? -1 : 1;
      if (a.due && b.due) return a.dueAt - b.dueAt;
      return a.index - b.index;
    });
  }

  return {
    ...normalized,
    available: result.length,
    ids: result.slice(0, normalized.limit).map((row) => row.id).filter(Boolean),
    characters: result.slice(0, normalized.limit).map((row) => row.character).filter(Boolean),
  };
}
