(() => {
  const V12 = "kanji5-v1.2";
  const KNOWLEDGE_KEY = `${V12}-knowledge`;
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

  function loadKnowledge() {
    try {
      const raw = localStorage.getItem(KNOWLEDGE_KEY);
      const value = raw ? JSON.parse(raw) : {};
      return value && typeof value === "object" ? value : {};
    } catch (_) {
      return {};
    }
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

    if (!meaning.attempts && !reading.attempts) {
      return Math.random() < 0.5 ? "meaning" : "reading";
    }
    if (!meaning.attempts) return "meaning";
    if (!reading.attempts) return "reading";

    const meaningScore = score(character, "meaning");
    const readingScore = score(character, "reading");

    if (Math.abs(meaningScore - readingScore) >= 0.10) {
      return meaningScore < readingScore ? "meaning" : "reading";
    }

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
      } catch (_) {
        deckIndex = new Map();
      }
      return deckIndex;
    })();

    return deckLoadPromise;
  }

  function checkRecall(character, mode, value) {
    const item = deckIndex?.get(character);
    if (!item) return null;
    const answer = normalize(value);
    if (!answer) return false;

    if (mode === "meaning") {
      return (item.meaning || []).some(meaning => {
        const canonical = normalize(meaning);
        return canonical && (answer === canonical || answer.includes(canonical) || canonical.includes(answer));
      });
    }

    return [...(item.on || []), ...(item.kun || [])].some(reading => {
      const canonical = normalize(reading);
      return canonical && answer === canonical;
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
      : "حداقل یک خوانش رایج این کانجی را به kana از حافظه بنویس.";

    const gate = document.createElement("div");
    gate.className = "v12-recall-gate";
    gate.innerHTML = `
      <div style="border:1px solid var(--line);background:#f9fafb;border-radius:16px;padding:14px;margin-top:14px">
        <div style="font-weight:800;margin-bottom:8px">🧠 بازیابی فعال</div>
        <div style="color:var(--muted);font-size:14px;line-height:1.7;margin-bottom:10px">${prompt}</div>
        <textarea id="v12RecallInput" rows="2" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="پاسخ خودت را اینجا بنویس..." style="width:100%;resize:vertical;border:1px solid var(--line);border-radius:12px;padding:10px;font:inherit;box-sizing:border-box"></textarea>
        <button id="v12SubmitRecall" class="primary" style="margin-top:9px;width:100%">ثبت تلاش و نمایش پاسخ</button>
        <div style="color:var(--muted);font-size:11px;text-align:center;margin-top:7px">برای ثبت با صفحه‌کلید: Ctrl+Enter</div>
      </div>`;

    originalRevealButton?.replaceWith(gate);
    void loadDeckIndex();
    setTimeout(() => $("#v12RecallInput")?.focus(), 0);
  }

  function addStageButton(container, text, onClick) {
    const button = document.createElement("button");
    button.className = "secondary";
    button.textContent = text;
    button.style.width = "100%";
    button.style.marginTop = "12px";
    button.addEventListener("click", onClick);
    container.appendChild(button);
    return button;
  }

  function setupProgressiveReveal() {
    const answerBox = $("#answerBox");
    const ratings = $("#ratings");
    if (!answerBox || !ratings || answerBox.dataset.v12Enhanced === "1") return;

    answerBox.dataset.v12Enhanced = "1";
    const readings = answerBox.querySelector(".readings");
    const examples = answerBox.querySelector(".examples");
    const meta = answerBox.querySelector(".meta");

    if (readings) readings.style.display = "none";
    if (examples) examples.style.display = "none";
    if (meta) meta.style.display = "none";
    ratings.style.display = "grid";

    const readingsButton = addStageButton(answerBox, "نمایش خوانش‌ها", () => {
      if (readings) readings.style.display = "grid";
      readingsButton.remove();

      if (examples) {
        const examplesButton = addStageButton(answerBox, "نمایش واژه‌های نمونه (اختیاری)", () => {
          examples.style.display = "block";
          if (meta) meta.style.display = "flex";
          examplesButton.remove();
        });
      }
    });
  }

  document.addEventListener("click", async event => {
    const target = event.target;

    if (target?.id === "revealBtn" && !allowNativeReveal) {
      event.preventDefault();
      event.stopImmediatePropagation();
      makeRecallGate();
      return;
    }

    if (target?.id === "v12SubmitRecall") {
      event.preventDefault();
      const input = $("#v12RecallInput");
      const value = input?.value || "";
      if (!normalize(value)) {
        input?.focus();
        return;
      }

      await loadDeckIndex();
      const correct = checkRecall(activeCharacter, activePrompt, value);
      recordAttempt(activeCharacter, activePrompt, correct);

      try {
        localStorage.setItem(`${V12}-last-attempt`, JSON.stringify({
          character: activeCharacter,
          mode: activePrompt,
          attemptedAt: new Date().toISOString(),
          hadAttempt: true,
          correct
        }));
      } catch (_) {}

      const gate = target.closest(".v12-recall-gate");
      if (!originalRevealButton || !gate) return;

      gate.replaceWith(originalRevealButton);
      allowNativeReveal = true;
      originalRevealButton.click();
      allowNativeReveal = false;
      originalRevealButton = null;
    }
  }, true);

  document.addEventListener("keydown", event => {
    if (event.target?.id === "v12RecallInput" && event.ctrlKey && event.key === "Enter") {
      event.preventDefault();
      $("#v12SubmitRecall")?.click();
    }
  });

  const observer = new MutationObserver(() => {
    const answerBox = $("#answerBox");
    if (answerBox?.classList.contains("show")) setupProgressiveReveal();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
