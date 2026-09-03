(() => {
  const V12 = "kanji5-v1.2";
  const KNOWLEDGE_KEY = `${V12}-knowledge`;
  const CARDS_KEY = "kanji5-v1-cards";
  const $ = (sel, root = document) => root.querySelector(sel);

  let activePrompt = null;
  let activeCharacter = null;
  let originalRevealButton = null;
  let allowNativeReveal = false;
  let deckIndex = null;
  let deckLoadPromise = null;

  const normalize = value => String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s\u3000]+/g, "")
    .replace(/[。、・,.;:!?！？\-ー]/g, "");

  const ROMAJI_VARIANTS = [
    ["shi", "し"], ["chi", "ち"], ["tsu", "つ"], ["fu", "ふ"], ["ji", "じ"], ["dzu", "づ"],
    ["sha", "しゃ"], ["shu", "しゅ"], ["sho", "しょ"], ["cha", "ちゃ"], ["chu", "ちゅ"], ["cho", "ちょ"],
    ["ja", "じゃ"], ["ju", "じゅ"], ["jo", "じょ"],
    ["kya", "きゃ"], ["kyu", "きゅ"], ["kyo", "きょ"], ["gya", "ぎゃ"], ["gyu", "ぎゅ"], ["gyo", "ぎょ"],
    ["nya", "にゃ"], ["nyu", "にゅ"], ["nyo", "にょ"], ["hya", "ひゃ"], ["hyu", "ひゅ"], ["hyo", "ひょ"],
    ["mya", "みゃ"], ["myu", "みゅ"], ["myo", "みょ"], ["rya", "りゃ"], ["ryu", "りゅ"], ["ryo", "りょ"],
    ["bya", "びゃ"], ["byu", "びゅ"], ["byo", "びょ"], ["pya", "ぴゃ"], ["pyu", "ぴゅ"], ["pyo", "ぴょ"],
    ["ja", "ぢゃ"], ["ju", "ぢゅ"], ["jo", "ぢょ"],
    ["a", "あ"], ["i", "い"], ["u", "う"], ["e", "え"], ["o", "お"],
    ["ka", "か"], ["ki", "き"], ["ku", "く"], ["ke", "け"], ["ko", "こ"],
    ["sa", "さ"], ["su", "す"], ["se", "せ"], ["so", "そ"],
    ["ta", "た"], ["te", "て"], ["to", "と"],
    ["na", "な"], ["ni", "に"], ["nu", "ぬ"], ["ne", "ね"], ["no", "の"],
    ["ha", "は"], ["hi", "ひ"], ["he", "へ"], ["ho", "ほ"],
    ["ma", "ま"], ["mi", "み"], ["mu", "む"], ["me", "め"], ["mo", "も"],
    ["ya", "や"], ["yu", "ゆ"], ["yo", "よ"], ["ra", "ら"], ["ri", "り"], ["ru", "る"], ["re", "れ"], ["ro", "ろ"],
    ["wa", "わ"], ["wo", "を"], ["n", "ん"],
    ["ga", "が"], ["gi", "ぎ"], ["gu", "ぐ"], ["ge", "げ"], ["go", "ご"],
    ["za", "ざ"], ["zu", "ず"], ["ze", "ぜ"], ["zo", "ぞ"],
    ["da", "だ"], ["de", "で"], ["do", "ど"], ["ba", "ば"], ["bi", "び"], ["bu", "ぶ"], ["be", "べ"], ["bo", "ぼ"],
    ["pa", "ぱ"], ["pi", "ぴ"], ["pu", "ぷ"], ["pe", "ぺ"], ["po", "ぽ"],
    ["va", "ゔぁ"], ["vi", "ゔぃ"], ["ve", "ゔぇ"], ["vo", "ゔぉ"], ["vu", "ゔ"],
    ["di", "ぢ"], ["du", "づ"], ["ti", "ち"], ["tu", "つ"], ["si", "し"], ["hu", "ふ"], ["zi", "じ"], ["wi", "うぃ"], ["we", "うぇ"]
  ];

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
    const input = String(value || "")
      .normalize("NFKC")
      .replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60))
      .replace(/ー/g, "");
    let out = "";
    for (let i = 0; i < input.length;) {
      if (input[i] === "っ") {
        const pair = input.slice(i + 1, i + 3);
        const tri = input.slice(i + 1, i + 4);
        const next = HIRA_TO_ROMAJI.get(tri) || HIRA_TO_ROMAJI.get(pair) || HIRA_TO_ROMAJI.get(input[i + 1]) || "";
        out += next && /^[bcdfghjklmnpqrstvwxyz]/.test(next) ? next[0] : "";
        i += 1;
        continue;
      }
      const tri = input.slice(i, i + 3);
      const pair = input.slice(i, i + 2);
      if (HIRA_TO_ROMAJI.has(tri)) { out += HIRA_TO_ROMAJI.get(tri); i += 3; continue; }
      if (HIRA_TO_ROMAJI.has(pair)) { out += HIRA_TO_ROMAJI.get(pair); i += 2; continue; }
      out += HIRA_TO_ROMAJI.get(input[i]) || input[i];
      i += 1;
    }
    return out;
  }

  function normalizeRomaji(value) {
    let s = normalize(value).replace(/[^a-z]/g, "");
    const variants = [
      [/shi/g,"shi"],[/si/g,"shi"],[/chi/g,"chi"],[/ti/g,"chi"],[/tsu/g,"tsu"],[/tu/g,"tsu"],[/fu/g,"fu"],[/hu/g,"fu"],
      [/ji/g,"ji"],[/zi/g,"ji"],[/dzu/g,"zu"],[/du/g,"zu"],[/di/g,"ji"],[/wo/g,"o"]
    ];
    for (const [re, replacement] of variants) s = s.replace(re, replacement);
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

  function getStats(character, mode) {
    const byChar = loadKnowledge()[character] || {};
    return byChar[mode] || { attempts: 0, correct: 0, lastAt: null };
  }

  function score(character, mode) {
    const stats = getStats(character, mode);
    return (stats.correct + 1) / (stats.attempts + 2);
  }

  function choosePrompt(character) {
    const meaning = getStats(character, "meaning");
    const reading = getStats(character, "reading");
    if (!meaning.attempts && !reading.attempts) return Math.random() < 0.5 ? "meaning" : "reading";
    if (!meaning.attempts) return "meaning";
    if (!reading.attempts) return "reading";
    const meaningScore = score(character, "meaning");
    const readingScore = score(character, "reading");
    if (Math.abs(meaningScore - readingScore) >= 0.10) return meaningScore < readingScore ? "meaning" : "reading";
    return loadKnowledge()[character]?.lastPrompt === "meaning" ? "reading" : "meaning";
  }

  async function loadDeckIndex() {
    if (deckIndex) return deckIndex;
    if (deckLoadPromise) return deckLoadPromise;
    deckLoadPromise = (async () => {
      try {
        const raw = localStorage.getItem("kanji5-deck");
        const cached = raw ? JSON.parse(raw) : null;
        if (Array.isArray(cached) && cached.length) {
          deckIndex = new Map(cached.map(item => [item.character, item]));
          return deckIndex;
        }
        const response = await fetch("./kanji-data.json", { cache: "force-cache" });
        if (!response.ok) throw new Error("dataset load failed");
        const data = await response.json();
        const items = Array.isArray(data) ? data : data.kanji || [];
        deckIndex = new Map(items.map(item => [item.character, item]));
      } catch (_) { deckIndex = new Map(); }
      return deckIndex;
    })();
    return deckLoadPromise;
  }

  function gradeMeaningCanonical(value, meanings) {
    const core = window.__KANJI5_EDU_CORE__;
    if (core?.gradeMeaning) return Boolean(core.gradeMeaning(value, meanings).correct);
    const answer = normalize(value);
    return Array.isArray(meanings) && meanings.some(meaning => answer === normalize(meaning));
  }

  function checkRecall(character, mode, value) {
    const item = deckIndex?.get(character);
    if (!item) return null;
    const answer = normalize(value);
    if (!answer) return false;
    if (mode === "meaning") return gradeMeaningCanonical(value, item.meaning || []);

    const answerKana = answer;
    const answerRomaji = normalizeRomaji(answer);
    return [...(item.on || []), ...(item.kun || [])].some(reading => {
      const canonicalKana = normalize(reading);
      const canonicalRomaji = normalizeRomaji(kanaToRomaji(canonicalKana));
      return answerKana === canonicalKana || (answerRomaji && answerRomaji === canonicalRomaji);
    });
  }

  function recordAttempt(character, mode, correct) {
    const knowledge = loadKnowledge();
    const byChar = knowledge[character] || {};
    const stats = byChar[mode] || { attempts: 0, correct: 0, lastAt: null };
    stats.attempts += 1;
    if (correct === true) stats.correct += 1;
    stats.lastAt = new Date().toISOString();
    byChar[mode] = stats;
    byChar.lastPrompt = mode;
    knowledge[character] = byChar;
    saveKnowledge(knowledge);
  }

  function makeRecallGate() {
    activeCharacter = $(".kanji")?.textContent?.trim() || "";
    activePrompt = choosePrompt(activeCharacter);
    originalRevealButton = document.getElementById("revealBtn");
    const prompt = activePrompt === "meaning"
      ? "معنی این کانجی چیست؟ سعی کن حداقل یک معنی را از حافظه بنویسی."
      : "حداقل یک خوانش رایج این کانجی را از حافظه بنویس؛ kana یا romaji هر دو قابل قبول‌اند.";
    const gate = document.createElement("div");
    gate.className = "v12-recall-gate";
    gate.innerHTML = `
      <div style="border:1px solid var(--line);background:#f9fafb;border-radius:16px;padding:16px;margin-top:14px">
        <div style="font-weight:800;margin-bottom:8px">یادآوری فعال</div>
        <div style="color:var(--muted);margin-bottom:10px">${prompt}</div>
        <input id="v12RecallInput" type="text" autocomplete="off" style="width:100%;border:1px solid var(--line);border-radius:12px;padding:11px 12px" />
        <div class="v12-recall-result" aria-live="polite"></div>
        <button id="v12SubmitRecall" class="primary" type="button" style="width:100%;margin-top:9px">بررسی پاسخ</button>
      </div>`;
    originalRevealButton?.insertAdjacentElement("afterend", gate);
    window.__KANJI5_V15_RECALL_API__?.refresh?.();
    const input = $("#v12RecallInput", gate);
    input?.focus();
  }

  async function submitRecall() {
    const gate = $(".v12-recall-gate");
    const input = $("#v12RecallInput", gate);
    if (!gate || !input) return;
    if (!deckIndex) await loadDeckIndex();
    const answer = input.value;
    const correct = checkRecall(activeCharacter, activePrompt, answer);
    if (correct === null) return;
    const result = $(".v12-recall-result", gate);
    if (correct) {
      result.className = "v12-recall-result good";
      result.textContent = "✅ پاسخ درست بود";
    } else {
      result.className = "v12-recall-result bad";
      result.textContent = "❌ پاسخ درست نبود";
    }
    recordAttempt(activeCharacter, activePrompt, correct);
    allowNativeReveal = true;
    gate.remove();
    originalRevealButton?.click();
    allowNativeReveal = false;
  }

  document.addEventListener("click", async event => {
    const target = event.target;
    if (target?.id === "revealBtn" && !allowNativeReveal) {
      const kanjiEl = document.querySelector(".kanji[data-kanji-id]");
      const id = kanjiEl?.dataset?.kanjiId;
      let isFirstExposure = false;
      try {
        const raw = localStorage.getItem(CARDS_KEY);
        const cards = raw ? JSON.parse(raw) : null;
        isFirstExposure = !!id && !cards?.[id];
      } catch (_) {}
      if (isFirstExposure) return;
      event.preventDefault(); event.stopImmediatePropagation(); makeRecallGate(); return;
    }
    if (target?.id === "v12SubmitRecall") { event.preventDefault(); await submitRecall(); }
  }, true);

  const observer = new MutationObserver(async () => {
    if (!(document.querySelector(".kanji[data-kanji-id]"))) return;
    if (!deckIndex) await loadDeckIndex();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",()=>loadDeckIndex(),{once:true});
  else loadDeckIndex();
})();
