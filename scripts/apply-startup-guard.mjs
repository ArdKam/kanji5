import fs from "node:fs/promises";

const FILE = "index.html";
const MARKER = '<script id="v1.2-startup-guard">';
const MODULE = '<script type="module">';

const GUARD = `<script id="v1.2-startup-guard">
(() => {
  let shown = false;
  async function clearRuntimeCaches() {
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter(key => key.startsWith("kanji5-")).map(key => caches.delete(key)));
      }
    } catch (_) {}
  }

  function showFallback() {
    if (shown) return;
    const loading = document.getElementById("loading");
    const app = document.getElementById("app");
    if (!loading || loading.hidden || !app || !app.hidden) return;
    shown = true;
    loading.innerHTML = '<div><div style="font-size:42px">⚠️</div><div style="font-weight:800;margin:10px 0">بارگذاری برنامه ناموفق بود.</div><div style="color:#6b7280;font-size:13px;line-height:1.8">ممکن است نسخهٔ ذخیره‌شدهٔ برنامه یا اتصال اینترنت مشکل داشته باشد.</div><button class="primary" id="v12StartupRetry" style="margin-top:14px">پاک‌سازی و تلاش دوباره</button></div>';
    document.getElementById("v12StartupRetry")?.addEventListener("click", async () => {
      const button = document.getElementById("v12StartupRetry");
      if (button) { button.disabled = true; button.textContent = "در حال پاک‌سازی…"; }
      await clearRuntimeCaches();
      location.reload();
    }, { once: true });
  }

  const observer = new MutationObserver(() => {
    const loading = document.getElementById("loading");
    const app = document.getElementById("app");
    if (loading?.hidden || !app?.hidden) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
  window.addEventListener("error", () => setTimeout(showFallback, 0), true);
  window.addEventListener("unhandledrejection", () => setTimeout(showFallback, 0), true);
  setTimeout(showFallback, 7000);
})();
</script>`;

let html = await fs.readFile(FILE, "utf8");

if (html.includes(MARKER)) {
  const start = html.indexOf(MARKER);
  const modulePos = html.indexOf(MODULE, start);
  if (modulePos < 0) throw new Error("Missing module script marker after startup guard");
  const end = html.indexOf("</script>", start);
  if (end < 0 || end > modulePos) throw new Error("Malformed startup guard");
  html = html.slice(0, start) + GUARD + html.slice(end + "</script>".length);
} else {
  const pos = html.indexOf(MODULE);
  if (pos < 0) throw new Error("Missing module script marker");
  html = html.slice(0, pos) + GUARD + html.slice(pos);
}

await fs.writeFile(FILE, html, "utf8");
console.log("Applied hardened pre-module startup guard.");
