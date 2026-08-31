(() => {
  const EXAMPLE_SELECTOR = ".examples";
  const WORDS_URL = ch => "https://kanjiapi.dev/v1/words/" + encodeURIComponent(ch);
  let activeCharacter = "";
  let exampleRequest = null;
  let retryTimer = null;
  let retryCount = 0;
  let realStartupError = false;

  const normalize = value => String(value || "").trim().replace(/[\s\u3000]+/g, "");

  function showRealStartupError(reason) {
    if (realStartupError) return;
    const loading = document.getElementById("loading");
    const app = document.getElementById("app");
    if (!loading || !app || !app.hidden) return;
    realStartupError = true;
    loading.hidden = false;
    loading.style.display = "flex";
    loading.innerHTML = '<div style="text-align:center"><div style="font-size:24px">⚠️</div><div style="font-weight:800;margin:6px 0">اجرای برنامه با مشکل مواجه شد.</div><div style="color:#6b7280;font-size:12px;margin:0 0 8px">لطفاً صفحه را دوباره بارگذاری کنید.</div><button class="primary" id="v12RuntimeRetry">تلاش دوباره</button></div>';
    document.getElementById("v12RuntimeRetry")?.addEventListener("click", () => location.reload());
    console.error("Kanji 5 startup failed:", reason);
  }

  function hideStartupPanel() {
    const loading = document.getElementById("loading");
    if (!loading) return;
    loading.hidden = true;
    loading.style.display = "none";
    loading.setAttribute("aria-hidden", "true");
  }

  function prepareStartupPanel() {
    const style = document.createElement("style");
    style.id = "v13-silent-startup";
    style.textContent = `
      #loading { display:none !important; min-height:0 !important; height:0 !important; padding:0 !important; margin:0 !important; border:0 !important; box-shadow:none !important; overflow:hidden !important; }
      #loading .spinner, #loadStatus { display:none !important; }
      #loading.v13-real-error { display:flex !important; min-height:180px !important; height:auto !important; padding:24px !important; margin:auto !important; overflow:visible !important; }
    `;
    document.head.appendChild(style);
    hideStartupPanel();
  }

  prepareStartupPanel();

  window.addEventListener("error", event => {
    if (event?.error) showRealStartupError(event.error);
  });
  window.addEventListener("unhandledrejection", event => {
    if (event?.reason) showRealStartupError(event.reason);
  });

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
      const response = await fetch(WORDS_URL(kanji), { cache: "force-cache", signal: exampleRequest.signal });
      if (!response.ok) throw new Error("examples request failed");
      const data = await response.json();
      const meanings = new Map();

      for (const entry of Array.isArray(data) ? data : []) {
        const gloss = (entry.meanings || []).flatMap(m => m.glosses || []).slice(0, 2).join("; ");
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

// v1.5 P0: load the canonical learning runtime from the active shell path.
(() => {
  const SRC = "./v1.5-p0.js";
  const FLAG = "__KANJI5_V15_P0_LOADER__";
  if (window[FLAG]) return;
  window[FLAG] = true;
  function loadP0() {
    if (window.__KANJI5_V15_P0__ || document.querySelector('script[data-kanji5-v15-p0]')) return;
    const script = document.createElement("script");
    script.src = SRC;
    script.dataset.kanji5V15P0 = "true";
    script.async = false;
    (document.body || document.head || document.documentElement).appendChild(script);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadP0, { once: true });
  } else {
    loadP0();
  }
})();
