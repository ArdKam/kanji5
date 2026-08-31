(() => {
  const STARTUP_TIMEOUT = 6000;
  const EXAMPLE_SELECTOR = ".examples";
  const WORDS_URL = ch => "https://kanjiapi.dev/v1/words/" + encodeURIComponent(ch);
  let activeCharacter = "";
  let exampleRequest = null;
  let retryTimer = null;
  let retryCount = 0;
  let startupShown = false;

  function showStartupFallback() {
    if (startupShown) return;
    const loading = document.getElementById("loading");
    const app = document.getElementById("app");
    if (!loading || loading.hidden || !app || !app.hidden) return;
    startupShown = true;
    loading.innerHTML = '<div><div style="font-size:42px">⚠️</div><div style="font-weight:800;margin:10px 0">برنامه هنوز بارگذاری نشده است.</div><div style="color:#6b7280;font-size:13px;line-height:1.8">ممکن است اتصال به موتور مرور یا دادهٔ کانجی قطع شده باشد.</div><button class="primary" id="v12RuntimeRetry" style="margin-top:14px">تلاش دوباره</button></div>';
    document.getElementById("v12RuntimeRetry")?.addEventListener("click", () => location.reload());
  }

  function compactLoadingPanel() {
    const style = document.createElement("style");
    style.id = "v13-compact-loading";
    style.textContent = `
      #loading { min-height: 180px; padding: 24px; }
      #loading .spinner { width: 24px; height: 24px; border-width: 2px; margin-bottom: 10px; }
      #loading > div { max-width: 420px; }
      #loadStatus { margin-top: 5px !important; }
    `;
    document.head.appendChild(style);
  }

  compactLoadingPanel();
  setTimeout(showStartupFallback, STARTUP_TIMEOUT);

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
