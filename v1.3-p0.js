(() => {
  "use strict";

  // Start the two expensive startup resources as early as possible.
  // The main module can reuse the browser's module/fetch cache.
  const DATA_URL = "./kanji-data.json";
  const FSRS_URL = "https://esm.sh/ts-fsrs@5.4.1?bundle";

  if (!window.__KANJI5_P0_DATA_PROMISE) {
    window.__KANJI5_P0_DATA_PROMISE = fetch(DATA_URL, { cache: "force-cache" })
      .then(r => {
        if (!r.ok) throw new Error("KANJI_DATA_PREFETCH_FAILED");
        return r;
      })
      .catch(() => null);
  }

  if (!window.__KANJI5_P0_FSRS_PROMISE) {
    window.__KANJI5_P0_FSRS_PROMISE = import(FSRS_URL).catch(() => null);
  }

  // Keep the loading panel compact; the real app still controls when it hides.
  const style = document.createElement("style");
  style.id = "v13-p0-loading";
  style.textContent = "#loading{min-height:64px!important;height:64px!important;padding:10px 16px!important}#loading .spinner{width:18px!important;height:18px!important;border-width:2px!important;margin:0!important}";
  document.head.appendChild(style);
})();
