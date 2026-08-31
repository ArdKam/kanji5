(() => {
  const EXAMPLE_SELECTOR = ".examples";
  const WORDS_URL = ch => "https://kanjiapi.dev/v1/words/" + encodeURIComponent(ch);
  let activeCharacter = "";
  let exampleRequest = null;
  let retryTimer = null;
  let retryCount = 0;

  function compactLoadingPanel() {
    const style = document.createElement("style");
    style.id = "v13-compact-loading";
    style.textContent = `
      #loading { min-height: 28px !important; height: 28px; padding: 4px 10px !important; border-radius: 10px; box-shadow: none; }
      #loading > div { width:100%; max-width:none; display:flex; align-items:center; justify-content:center; gap:7px; }
      #loading .spinner { width:14px; height:14px; border-width:2px; margin:0; flex:0 0 auto; }
      #loading > div > div:nth-child(2) { font-size:11px; font-weight:650; white-space:nowrap; }
      #loadStatus { display:none !important; }
    `;
    document.head.appendChild(style);
    const status = document.querySelector("#loading > div > div:nth-child(2)");
    if (status) status.textContent = "در حال آماده‌سازی…";
  }

  compactLoadingPanel();

  const normalize = value => String(value || "").trim().replace(/[\s\u3000]+/g, "");

  async function enrichExamples() {
    const examples = document.querySelector(EXAMPLE_SELECTOR);
    const kanji = document.querySelector(".kanji")?.textContent?.trim();
    const words = examples?.querySelectorAll(".word") || [];
    if (!examples || !kanji || !words.length) return false;

    if (kanji !== activeCharacter) {
      activeCharacter = kanji;
      retryCount = 0;
      examples.removeAttribute("data-v12-translations");
      if (exampleRequest) exampleRequest.abort();
    }

    if (examples.dataset.v12Translations === kanji) return true;
    if (exampleRequest) return false;

    exampleRequest = new AbortController();
    try {
      const response = await fetch(WORDS_URL(kanji), {
        cache: "force-cache",
        signal: exampleRequest.signal
      });
      if (!response.ok) throw new Error("examples request failed");
      const data = await response.json();
      const meanings = new Map();

      for (const entry of Array.isArray(data) ? data : []) {
        const gloss = (entry.meanings || [])
          .flatMap(m => m.glosses || [])
          .slice(0, 2)
          .join("; ");
        if (!gloss) continue;

        for (const variant of entry.variants || []) {
          const written = normalize(variant.written);
          if (written && !meanings.has(written)) meanings.set(written, gloss);
        }
      }

      let translated = 0;
      examples.querySelectorAll(".word").forEach(word => {
        if (word.querySelector(".example-meaning")) {
          translated += 1;
          return;
        }
        const textNode = word.querySelector("span");
        const wordText = normalize(textNode?.textContent || "");
        const meaning = meanings.get(wordText);
        if (!meaning) return;

        const el = document.createElement("small");
        el.className = "example-meaning";
        el.textContent = meaning;
        word.firstElementChild?.appendChild(el);
        translated += 1;
      });

      if (translated > 0) examples.dataset.v12Translations = kanji;
      retryCount = 0;
      return translated > 0;
    } catch (_) {
      return false;
    } finally {
      exampleRequest = null;
    }
  }

  function scheduleExamples() {
    clearTimeout(retryTimer);
    retryTimer = setTimeout(async () => {
      const done = await enrichExamples();
      const examples = document.querySelector(EXAMPLE_SELECTOR);
      if (!done && examples?.querySelectorAll(".word")?.length && retryCount < 4) {
        retryCount += 1;
        scheduleExamples();
      }
    }, 80);
  }

  const observer = new MutationObserver(() => {
    if (document.querySelector(EXAMPLE_SELECTOR)) scheduleExamples();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", scheduleExamples, { once: true });
})();
