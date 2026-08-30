(() => {
  const STARTUP_TIMEOUT = 6000;
  const EXAMPLE_SELECTOR = ".examples";
  const WORDS_URL = ch => "https://kanjiapi.dev/v1/words/" + encodeURIComponent(ch);
  let lastExampleCharacter = "";
  let exampleRequest = null;

  function showStartupFallback() {
    const loading = document.getElementById("loading");
    const app = document.getElementById("app");
    if (!loading || loading.hidden || !app || !app.hidden) return;
    loading.innerHTML = '<div><div style="font-size:42px">⚠️</div><div style="font-weight:800;margin:10px 0">برنامه هنوز بارگذاری نشده است.</div><div style="color:#6b7280;font-size:13px;line-height:1.8">ممکن است اتصال به موتور مرور یا دادهٔ کانجی قطع شده باشد.</div><button class="primary" id="v12RuntimeRetry" style="margin-top:14px">تلاش دوباره</button></div>';
    document.getElementById("v12RuntimeRetry")?.addEventListener("click", () => location.reload());
  }

  setTimeout(showStartupFallback, STARTUP_TIMEOUT);

  const normalize = value => String(value || "").trim().replace(/[\s\u3000]+/g, "");

  async function enrichExamples() {
    const examples = document.querySelector(EXAMPLE_SELECTOR);
    const kanji = document.querySelector(".kanji")?.textContent?.trim();
    if (!examples || !kanji || kanji === lastExampleCharacter) return;
    lastExampleCharacter = kanji;
    if (exampleRequest) exampleRequest.abort();
    exampleRequest = new AbortController();

    try {
      const response = await fetch(WORDS_URL(kanji), { cache: "force-cache", signal: exampleRequest.signal });
      if (!response.ok) return;
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
          if (written && written.includes(kanji) && !meanings.has(written)) meanings.set(written, gloss);
        }
      }

      examples.querySelectorAll(".word").forEach(word => {
        if (word.querySelector(".example-meaning")) return;
        const textNode = word.querySelector("span");
        const wordText = normalize(textNode?.textContent || "");
        const meaning = meanings.get(wordText);
        if (!meaning) return;
        const el = document.createElement("small");
        el.className = "example-meaning";
        el.textContent = meaning;
        word.firstElementChild?.appendChild(el);
      });
    } catch (_) {
      // Examples remain usable without translations.
    }
  }

  const observer = new MutationObserver(() => {
    if (document.querySelector(EXAMPLE_SELECTOR)) void enrichExamples();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", () => void enrichExamples());
})();
