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

  // v1.5 P0: normalize the local 2136-card dataset before the main module consumes it.
  // The main module's buildQueue() keeps its existing logic, so putting unseen cards in
  // JLPT-first order makes its first N new cards follow N5 -> N4 -> N3 -> N2 -> N1,
  // while shuffling each level independently.
  const originalFetch = window.fetch.bind(window);

  function jlptRank(item) {
    return ({ N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 }[item?.jlpt] ?? 5);
  }

  function shuffle(items) {
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  async function fetchWithJLPTOrdering(input, init) {
    const response = await originalFetch(input, init);
    try {
      const url = typeof input === "string" ? input : input?.url || "";
      const parsed = new URL(url, location.href);
      if (!parsed.pathname.endsWith("/kanji-data.json")) return response;

      const payload = await response.clone().json();
      const source = Array.isArray(payload) ? payload : payload?.kanji;
      if (!Array.isArray(source) || source.length !== 2136) return response;

      const ordered = [];
      const sorted = source.slice().sort((a, b) => jlptRank(a) - jlptRank(b));
      let start = 0;
      while (start < sorted.length) {
        const rank = jlptRank(sorted[start]);
        const group = [];
        while (start < sorted.length && jlptRank(sorted[start]) === rank) {
          group.push(sorted[start]);
          start += 1;
        }
        ordered.push(...shuffle(group));
      }

      const output = Array.isArray(payload)
        ? ordered
        : { ...payload, kanji: ordered };
      const body = JSON.stringify(output);
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    } catch (_) {
      return response;
    }
  }

  window.fetch = fetchWithJLPTOrdering;

  const observer = new MutationObserver(() => {
    if (document.querySelector(EXAMPLE_SELECTOR)) scheduleExamples();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", scheduleExamples, { once: true });

  window.__KANJI5_V15_P0_JLPT__ = {
    jlptRank,
    testOrder(items) {
      const ranks = items.map(jlptRank);
      return ranks.every((rank, i) => i === 0 || rank >= ranks[i - 1]);
    }
  };
})();
