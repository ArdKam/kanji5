(() => {
  "use strict";

  const STORAGE = "kanji5-v1";
  const KNOWLEDGE_KEY = "kanji5-v1.2-knowledge";
  const WORDS_URL = ch => "https://kanjiapi.dev/v1/words/" + encodeURIComponent(ch);
  const $ = (sel, root = document) => root.querySelector(sel);

  let active = null;
  let deckIndex = null;
  let wordsCache = new Map();

  const normalize = value => String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\s\u3000]+/g, "")
    .replace(/[。、・,.;:!?！？\-ー]/g, "");

  const HIRA_TO_ROMAJI = new Map([
    ["あ","a"],["い","i"],["う","u"],["え","e"],["お","o"],["か","ka"],["き","ki"],["く","ku"],["け","ke"],["こ","ko"],
    ["さ","sa"],["し","shi"],["す","su"],["せ","se"],["そ","so"],["た","ta"],["ち","chi"],["つ","tsu"],["て","te"],["と","to"],
    ["な","na"],["に","ni"],["ぬ","nu"],["ね","ne"],["の","no"],["は","ha"],["ひ","hi"],["ふ","fu"],["へ","he"],["ほ","ho"],
    ["ま","ma"],["み","mi"],["む","mu"],["め","me"],["も","mo"],["や","ya"],["ゆ","yu"],["よ","yo"],["ら","ra"],["り","ri"],["る","ru"],["れ","re"],["ろ","ro"],
    ["わ","wa"],["を","o"],["ん","n"],["が","ga"],["ぎ","gi"],["ぐ","gu"],["げ","ge"],["ご","go"],["ざ","za"],["じ","ji"],["ず","zu"],["ぜ","ze"],["ぞ","zo"],
    ["だ","da"],["ぢ","ji"],["づ","zu"],["で","de"],["ど","do"],["ば","ba"],["び","bi"],["ぶ","bu"],["べ","be"],["ぼ","bo"],
    ["ぱ","pa"],["ぴ","pi"],["ぷ","pu"],["ぺ","pe"],["ぽ","po"],["ゔ","vu"],
    ["きゃ","kya"],["きゅ","kyu"],["きょ","kyo"],["しゃ","sha"],["しゅ","shu"],["しょ","sho"],["ちゃ","cha"],["ちゅ","chu"],["ちょ","cho"],
    ["にゃ","nya"],["にゅ","nyu"],["にょ","nyo"],["ひゃ","hya"],["ひゅ","hyu"],["ひょ","hyo"],["みゃ","mya"],["みゅ","myu"],["みょ","myo"],
    ["りゃ","rya"],["りゅ","ryu"],["りょ","ryo"],["ぎゃ","gya"],["ぎゅ","gyu"],["ぎょ","gyo"],["じゃ","ja"],["じゅ","ju"],["じょ","jo"],
    ["びゃ","bya"],["びゅ","byu"],["びょ","byo"],["ぴゃ","pya"],["ぴゅ","pyu"],["ぴょ","pyo"]
  ]);

  function kanaToRomaji(value) {
    let input = String(value || "").normalize("NFKC").replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
    let out = "";
    for (let i = 0; i < input.length;) {
      if (input[i] === "っ") {
        const next = HIRA_TO_ROMAJI.get(input.slice(i + 1, i + 3)) || HIRA_TO_ROMAJI.get(input[i + 1]) || "";
        if (next && /^[bcdfghjklmnpqrstvwxyz]/.test(next)) out += next[0];
        i += 1;
        continue;
      }
      const pair = input.slice(i, i + 2);
      const one = input[i];
      if (HIRA_TO_ROMAJI.has(pair)) { out += HIRA_TO_ROMAJI.get(pair); i += 2; continue; }
      out += HIRA_TO_ROMAJI.get(one) || one;
      i += 1;
    }
    return out;
  }

  function normalizeRomaji(value) {
    let s = normalize(value).replace(/[^a-z]/g, "");
    s = s.replace(/shi/g, "shi").replace(/si/g, "shi").replace(/chi/g, "chi").replace(/ti/g, "chi")
      .replace(/tsu/g, "tsu").replace(/tu/g, "tsu").replace(/fu/g, "fu").replace(/hu/g, "fu")
      .replace(/ji/g, "ji").replace(/zi/g, "ji").replace(/du/g, "zu").replace(/dzu/g, "zu")
      .replace(/di/g, "ji").replace(/wo/g, "o");
    return s;
  }

  function loadKnowledge() {
    try {
      const raw = localStorage.getItem(KNOWLEDGE_KEY);
      const value = raw ? JSON.parse(raw) : {};
      return value && typeof value === "object" ? value : {};
    } catch (_) { return {}; }
  }

  function saveKnowledge(value) {
    try { localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(value)); } catch (_) {}
  }

  function statsFor(character, mode) {
    const node = loadKnowledge()[character] || {};
    return node[mode] || { attempts: 0, correct: 0, lastAt: null };
  }

  function mastery(character, mode) {
    const s = statsFor(character, mode);
    return (s.correct + 1) / (s.attempts + 2);
  }

  function loadDeck() {
    if (deckIndex) return deckIndex;
    try {
      const raw = localStorage.getItem("kanji5-deck");
      const data = raw ? JSON.parse(raw) : [];
      deckIndex = new Map((Array.isArray(data) ? data : []).map(item => [item.character, item]));
    } catch (_) { deckIndex = new Map(); }
    return deckIndex;
  }

  async function loadWords(character) {
    if (wordsCache.has(character)) return wordsCache.get(character);
    let words = [];
    try {
      const response = await fetch(WORDS_URL(character), { cache: "force-cache" });
      if (response.ok) {
        const data = await response.json();
        const seen = new Set();
        for (const entry of data) {
          for (const variant of (entry.variants || [])) {
            const written = variant.written || "";
            const reading = variant.pronounced || "";
            if (written.includes(character) && reading && !seen.has(written)) {
              seen.add(written);
              words.push({ word: written, reading });
            }
            if (words.length >= 8) break;
          }
          if (words.length >= 8) break;
        }
      }
    } catch (_) {}
    wordsCache.set(character, words);
    return words;
  }

  function chooseMode(character) {
    const core = ["meaning", "reading", "production"];
    const knowledge = loadKnowledge()[character] || {};
    const attempted = core.filter(mode => (knowledge[mode]?.attempts || 0) > 0);
    const unattempted = core.filter(mode => !(knowledge[mode]?.attempts || 0));

    // Early reviews establish meaning/reading before introducing production.
    if (unattempted.length) return unattempted[Math.random() < 0.6 ? 0 : Math.min(1, unattempted.length - 1)];

    const ranked = attempted.slice().sort((a, b) => mastery(character, a) - mastery(character, b));
    return ranked[0] || "meaning";
  }

  function record(character, mode, correct) {
    const knowledge = loadKnowledge();
    const node = knowledge[character] || {};
    const current = node[mode] || { attempts: 0, correct: 0, lastAt: null };
    current.attempts += 1;
    if (correct === true) current.correct += 1;
    current.lastAt = new Date().toISOString();
    node[mode] = current;
    node.lastPrompt = mode;
    knowledge[character] = node;
    saveKnowledge(knowledge);
  }

  function getActiveCharacter() {
    return $(".kanji")?.textContent?.trim() || "";
  }

  function getActiveId() {
    return $(".kanji")?.dataset?.kanjiId || "";
  }

  function isFirstExposure() {
    const id = getActiveId();
    if (!id) return false;
    try {
      const raw = localStorage.getItem(STORAGE);
      const state = raw ? JSON.parse(raw) : null;
      return !state?.cards?.[id];
    } catch (_) { return false; }
  }

  async function showP1Gate() {
    const character = getActiveCharacter();
    const item = loadDeck().get(character);
    if (!character || !item) return false;

    const mode = chooseMode(character);
    active = { character, item, mode };
    const oldButton = document.getElementById("revealBtn");
    if (!oldButton) return false;

    const gate = document.createElement("div");
    gate.className = "v13-p1-gate";
    gate.innerHTML = `
      <div class="v13-p1-card">
        <div class="v13-p1-title">🧠 ${mode === "meaning" ? "بازیابی معنی" : mode === "reading" ? "بازیابی خوانش" : "تولید کانجی"}</div>
        <div id="v13P1Prompt" class="v13-p1-prompt">در حال آماده‌سازی تمرین...</div>
        <div id="v13P1Body"></div>
        <div class="v13-p1-actions"><button id="v13P1Submit" class="primary">بررسی پاسخ</button></div>
      </div>`;
    oldButton.replaceWith(gate);

    const prompt = $("#v13P1Prompt");
    const body = $("#v13P1Body");

    if (mode === "meaning") {
      prompt.textContent = "حداقل یک معنی این کانجی را از حافظه بنویس.";
      body.innerHTML = '<input id="v13P1Input" class="v13-p1-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="مثلاً: school">';
    } else if (mode === "reading") {
      prompt.textContent = "یک خوانش رایج این کانجی را از حافظه بنویس؛ Hiragana یا Romaji هر دو قابل قبول‌اند.";
      body.innerHTML = '<input id="v13P1Input" class="v13-p1-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="مثلاً: gaku یا がく">';
    } else {
      prompt.innerHTML = `معنی: <strong>${(item.meaning || []).join(" · ") || "—"}</strong><br>یک کانجی مناسب بنویس.`;
      body.innerHTML = '<input id="v13P1Input" class="v13-p1-input v13-p1-kanji" type="text" inputmode="text" autocomplete="off" placeholder="کانجی">';
    }

    setTimeout(() => $("#v13P1Input")?.focus(), 0);
    return true;
  }

  async function submitP1() {
    if (!active) return;
    const input = $("#v13P1Input");
    const value = input?.value || "";
    if (!normalize(value)) { input?.focus(); return; }

    let correct = false;
    let extra = "";
    if (active.mode === "meaning") {
      const answer = normalize(value);
      correct = (active.item.meaning || []).some(m => {
        const canonical = normalize(m);
        return canonical && (answer === canonical || answer.includes(canonical) || canonical.includes(answer));
      });
    } else if (active.mode === "reading") {
      const answers = [...(active.item.on || []), ...(active.item.kun || [])];
      const candidateKana = normalize(value);
      const candidateRomaji = normalizeRomaji(value);
      correct = answers.some(r => candidateKana === normalize(r) || candidateRomaji === normalizeRomaji(kanaToRomaji(r)));
    } else {
      correct = normalize(value) === normalize(active.character);
    }

    record(active.character, active.mode, correct);
    const gate = input?.closest(".v13-p1-gate");
    if (!gate) return;
    const label = correct ? "✅ درست" : "❌ درست نبود";
    const answer = active.mode === "meaning"
      ? (active.item.meaning || []).join(" · ")
      : active.mode === "reading"
        ? [...(active.item.on || []), ...(active.item.kun || [])].join(" · ")
        : active.character;
    extra = `<div class="v13-p1-result ${correct ? "good" : "bad"}">${label}</div><div class="v13-p1-answer">پاسخ: <strong>${answer}</strong></div>`;
    gate.insertAdjacentHTML("beforeend", extra);
    const submit = $("#v13P1Submit");
    if (submit) submit.disabled = true;

    const original = document.createElement("button");
    original.id = "revealBtn";
    original.className = "reveal";
    original.textContent = "نمایش پاسخ کامل";
    gate.replaceWith(original);
    original.addEventListener("click", () => originalClickWithoutGate(original), { once: true });
    originalClickWithoutGate(original);
    active = null;
  }

  function originalClickWithoutGate(button) {
    // Re-dispatch on a cloned button so v1.2's capture listener does not see this
    // synthetic click; then invoke the application's native reveal handler.
    const clone = button.cloneNode(true);
    button.replaceWith(clone);
    const parent = clone.parentNode;
    if (!parent) return;
    const answerBox = $("#answerBox");
    if (answerBox) return;
    clone.click();
  }

  // Vocabulary completion is exposed as a separate practice card after a gate.
  async function maybeAddVocabularyPractice() {
    const answerBox = $("#answerBox");
    if (!answerBox || answerBox.dataset.v13P1Vocab === "1") return;
    const character = getActiveCharacter();
    if (!character) return;
    const words = await loadWords(character);
    if (!words.length) return;
    answerBox.dataset.v13P1Vocab = "1";
    const selected = words[Math.floor(Math.random() * words.length)];
    const masked = selected.word.replace(character, "＿");
    const block = document.createElement("div");
    block.className = "v13-p1-vocab";
    block.innerHTML = `<div class="v13-p1-vocab-title">✍️ تمرین واژه</div><div class="v13-p1-vocab-word">${masked}</div><div class="v13-p1-vocab-reading">${selected.reading}</div><input id="v13P1VocabInput" class="v13-p1-input" maxlength="2" placeholder="کانجی گمشده"><button id="v13P1VocabSubmit" class="secondary" style="width:100%;margin-top:8px">بررسی</button><div id="v13P1VocabResult"></div>`;
    answerBox.appendChild(block);
    $("#v13P1VocabSubmit")?.addEventListener("click", () => {
      const value = $("#v13P1VocabInput")?.value || "";
      const ok = value.includes(character);
      $("#v13P1VocabResult").innerHTML = `<div class="v13-p1-result ${ok ? "good" : "bad"}">${ok ? "✅ درست" : "❌ جواب صحیح: " + character}</div>`;
      record(character, "vocabulary", ok);
    });
  }

  document.addEventListener("click", event => {
    const target = event.target;
    if (target?.id === "revealBtn") {
      if (isFirstExposure()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      void showP1Gate();
    }
  }, true);

  document.addEventListener("click", event => {
    if (event.target?.id === "v13P1Submit") { event.preventDefault(); void submitP1(); }
  }, true);

  document.addEventListener("keydown", event => {
    if (event.target?.id === "v13P1Input" && (event.key === "Enter" || ((event.ctrlKey || event.metaKey) && event.key === "Enter"))) {
      event.preventDefault(); void submitP1();
    }
  }, true);

  const observer = new MutationObserver(() => { void maybeAddVocabularyPractice(); });
  observer.observe(document.body, { childList: true, subtree: true });
})();
