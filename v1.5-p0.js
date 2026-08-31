(() => {
  "use strict";

  if (window.__KANJI5_V15_P0__) return;
  window.__KANJI5_V15_P0__ = true;
  const V15_P0_VERSION = "1.4";

  const KNOW_KEY = "kanji5-v1.2-knowledge";
  const COMPONENT_KEY = "kanji5-v1.5-components";
  const REVIEW_SIGNAL_KEY = "kanji5-v1.5-review-signals";

  const $ = (selector, root = document) => root.querySelector(selector);

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const value = JSON.parse(raw);
      return value && typeof value === "object" ? value : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  function normalize(value) {
    return String(value == null ? "" : value)
      .trim()
      .toLowerCase()
      .normalize("NFKC")
      .replace(/[\s\u3000]+/g, "");
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>\"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '\"': "&quot;",
      "'": "&#39;"
    }[ch]));
  }

  function getDeck() {
    return Array.isArray(window.__KANJI5_P0_DATA)
      ? window.__KANJI5_P0_DATA
      : [];
  }

  function ensureComponentEntry(character) {
    const all = readJSON(COMPONENT_KEY, {});
    if (!all[character] || typeof all[character] !== "object") {
      all[character] = { meaning: {}, reading: {}, updatedAt: null };
    }
    if (!all[character].meaning || typeof all[character].meaning !== "object") {
      all[character].meaning = {};
    }
    if (!all[character].reading || typeof all[character].reading !== "object") {
      all[character].reading = {};
    }
    return all;
  }

  function componentAccuracy(stats) {
    const attempts = Math.max(0, Number(stats && stats.attempts) || 0);
    const correct = Math.min(attempts, Math.max(0, Number(stats && stats.correct) || 0));
    return attempts ? (correct + 1) / (attempts + 2) : 0;
  }

  function getFocusComponent(character, mode) {
    const item = getDeck().find((entry) => entry && entry.character === character);
    if (!item) return null;

    const all = ensureComponentEntry(character);
    const componentState = all[character][mode];
    const values = mode === "reading"
      ? [...(item.on || []), ...(item.kun || [])]
      : [...(item.meaning || [])];

    const candidates = values.map((raw) => ({
      raw,
      key: normalize(raw),
      accuracy: componentAccuracy(componentState[normalize(raw)] || {})
    }));

    candidates.sort((a, b) => a.accuracy - b.accuracy);
    return candidates[0] || null;
  }

  function gradeFocusedRecall(mode, answer, focus) {
    const core = window.__KANJI5_EDU_CORE__;
    if (!core || !focus) return false;
    if (mode === "reading") {
      return Boolean(core.gradeReading(answer, [focus]).correct);
    }
    return Boolean(core.gradeMeaning(answer, [focus]).correct);
  }

  function recordFocusedRecall(character, mode, focus, correct) {
    const all = ensureComponentEntry(character);
    const bucket = all[character][mode];
    const key = normalize(focus);
    const stats = bucket[key] || { attempts: 0, correct: 0, lastAt: null };
    stats.attempts += 1;
    if (correct) stats.correct += 1;
    stats.lastAt = new Date().toISOString();
    bucket[key] = stats;
    all[character].updatedAt = stats.lastAt;
    writeJSON(COMPONENT_KEY, all);
  }

  function enhanceRecall() {
    const gate = document.querySelector(".v12-recall-gate");
    const kanji = document.querySelector(".kanji");
    if (!gate || !kanji) return;

    const character = String(kanji.textContent || "").trim();
    if (!character || gate.dataset.v15Ready === character) return;

    const mode = String(gate.textContent || "").includes("خوانش") ? "reading" : "meaning";
    const focus = getFocusComponent(character, mode);
    gate.dataset.v15Ready = character;
    gate.dataset.v15Mode = mode;
    if (!focus) return;

    gate.dataset.v15Focus = focus.raw;

    const prompt = [...gate.querySelectorAll("div")].find((node) => {
      const text = String(node.textContent || "").trim();
      return text.includes("معنی این کانجی") || text.includes("حداقل یک خوانش");
    });

    if (prompt) {
      prompt.textContent = mode === "meaning"
        ? `معنی هدف: «${focus.raw}» — سعی کن همین معنی را از حافظه به یاد بیاوری.`
        : `خوانش هدف: «${focus.raw}» — سعی کن همین خوانش را از حافظه به یاد بیاوری.`;
    }
  }

  function recordRecall(event) {
    const gate = event.target && event.target.closest
      ? event.target.closest(".v12-recall-gate")
      : null;
    const button = event.target && event.target.closest
      ? event.target.closest("button")
      : null;

    if (!gate || !button) return;

    const kanji = document.querySelector(".kanji");
    const input = gate.querySelector("input,textarea");
    if (!kanji || !input) return;

    const character = String(kanji.textContent || "").trim();
    const answer = String(input.value || "").trim();
    const mode = gate.dataset.v15Mode || "meaning";
    const focus = gate.dataset.v15Focus || "";
    if (!character || !answer || !focus) return;

    const correct = gradeFocusedRecall(mode, answer, focus);
    recordFocusedRecall(character, mode, focus, correct);
  }

  function getProductionTarget(input) {
    const wrap = input ? input.closest(".v14-edu-wrap") : null;
    if (!wrap) return null;

    const visibleTexts = [...wrap.querySelectorAll("div")]
      .map((node) => String(node.textContent || "").trim())
      .filter(Boolean);

    for (const item of getDeck()) {
      if (!item || !Array.isArray(item.meaning)) continue;
      for (const meaning of item.meaning) {
        const normalizedMeaning = normalize(meaning);
        if (visibleTexts.some((text) =>
          text.split(" · ").map(normalize).includes(normalizedMeaning))) {
          return item;
        }
      }
    }
    return null;
  }

  function getProductionChoices(target) {
    const core = window.__KANJI5_EDU_CORE__;
    const history = readJSON(KNOW_KEY, {})[target.character];
    const distractorHistory = history && history.distractors ? history.distractors : {};

    const candidates = [target];
    if (core && typeof core.chooseDistractors === "function") {
      candidates.push(...core.chooseDistractors(target, getDeck(), distractorHistory, 6));
    }

    const result = [];
    const seen = new Set();

    for (const candidate of candidates) {
      if (!candidate || !candidate.character || seen.has(candidate.character)) continue;
      seen.add(candidate.character);
      result.push(candidate);
      if (result.length === 4) return result;
    }

    for (const candidate of getDeck()) {
      if (!candidate || !candidate.character || seen.has(candidate.character)) continue;
      seen.add(candidate.character);
      result.push(candidate);
      if (result.length === 4) return result;
    }

    return result;
  }

  function enhanceProduction() {
    const input = $("#v14EduProductionInput");
    if (!input) return;

    const wrap = input.closest(".v14-edu-wrap");
    if (!wrap) return;

    const prompt = $(".v14-edu-prompt", wrap);
    if (prompt) prompt.textContent = "برای معنی زیر، کانجی مناسب را انتخاب کن.";

    const submit = $("#v14EduSubmit", wrap);
    if (submit) submit.style.display = "none";

    if (input.dataset.v15Replaced === "1" || $(".v15-production-grid", wrap)) {
      return;
    }

    const target = getProductionTarget(input);
    if (!target) return;

    const choices = getProductionChoices(target);
    if (choices.length < 4) return;

    input.type = "hidden";
    input.setAttribute("aria-hidden", "true");
    input.tabIndex = -1;
    input.style.display = "none";
    input.dataset.v15Replaced = "1";

    const grid = document.createElement("div");
    grid.className = "v14-edu-grid v15-production-grid";
    grid.setAttribute("role", "group");
    grid.setAttribute("aria-label", "انتخاب کانجی");

    for (const choice of choices) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "secondary v15-production-choice";
      button.dataset.v15Production = choice.character;
      button.textContent = choice.character;
      grid.appendChild(button);
    }

    input.parentNode.insertBefore(grid, input);
  }

  function chooseProduction(event) {
    const button = event.target && event.target.closest
      ? event.target.closest("[data-v15-production]")
      : null;
    if (!button) return;

    const input = $("#v14EduProductionInput");
    if (!input) return;

    input.value = button.dataset.v15Production || "";

    const submit = $("#v14EduSubmit");
    if (submit) submit.click();
  }

  function addDontKnow() {
    const ratings = $("#ratings");
    if (!ratings || !ratings.classList.contains("show")) return;
    if ($("#v15DontKnowReview", ratings)) return;

    const button = document.createElement("button");
    button.type = "button";
    button.id = "v15DontKnowReview";
    button.className = "rate";
    button.textContent = "نمی‌دانم";
    button.title = "این کارت را نمی‌دانم";

    button.addEventListener("click", () => {
      const kanji = document.querySelector(".kanji");
      const id = kanji && kanji.dataset ? kanji.dataset.kanjiId : "";
      if (id) {
        const signals = readJSON(REVIEW_SIGNAL_KEY, {});
        signals[id] = (Number(signals[id]) || 0) + 1;
        writeJSON(REVIEW_SIGNAL_KEY, signals);
      }

      const again = $(".rate.again", ratings);
      if (again) again.click();
    });

    ratings.appendChild(button);
  }

  const observer = new MutationObserver(() => {
    enhanceRecall();
    enhanceProduction();
    addDontKnow();
  });

  function start() {
    observer.observe(document.body, { childList: true, subtree: true });
    enhanceRecall();
    enhanceProduction();
    addDontKnow();
  }

  document.addEventListener("click", recordRecall, true);
  document.addEventListener("click", chooseProduction, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
