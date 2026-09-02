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
    loading.classList.add("v13-real-error");
    loading.hidden = false;
    loading.removeAttribute("aria-hidden");
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
    if (document.getElementById("v13-silent-startup")) return;
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

  const studyRoot = document.getElementById("studyPanel") || document.getElementById("study");
  if (studyRoot) {
    const observer = new MutationObserver(() => {
      if (document.querySelector(EXAMPLE_SELECTOR)) scheduleExamples();
    });
    observer.observe(studyRoot, { childList: true, subtree: true });
  }
  document.addEventListener("DOMContentLoaded", scheduleExamples, { once: true });
})();
