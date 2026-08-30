import fs from "node:fs/promises";
const FILE = "index.html";
const TAG = '<script src="./v1.2-runtime-fixes.js"></script>';
const GUARD_START = '<script id="v1.2-startup-guard">';
const GUARD_END = '</script><script type="module">';
let html = await fs.readFile(FILE, "utf8");
const oldImport = 'const { createEmptyCard, fsrs, Rating } = await import("https://esm.sh/ts-fsrs@6.0.0-beta.7");';
const declarations = 'let createEmptyCard, fsrs, Rating;\nconst FSRS_URL="https://esm.sh/ts-fsrs@5.4.1?bundle";';
if (html.includes(oldImport)) html = html.replace(oldImport, declarations);

const guardBody = `<script id="v1.2-startup-guard">
(() => {
  let shown = false;
  async function clearRuntimeCaches() {
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(r => r.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => k.startsWith("kanji5-")).map(k => caches.delete(k)));
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
</script><script type="module">`;
if (html.includes(GUARD_START) && html.includes(GUARD_END)) {
  html = html.replace(new RegExp(GUARD_START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\\s\\S]*?" + GUARD_END.replace(/[.*+?^${}()|[\]\\\\]/g, "\\$&")), guardBody);
}

if (html.includes(declarations) && !html.includes("FSRS_LOAD_TIMEOUT")) {
  const marker = "async function start(){";
  const guard = 'async function start(){try{const mod=await Promise.race([import(FSRS_URL),new Promise((_,reject)=>setTimeout(()=>reject(new Error("FSRS_LOAD_TIMEOUT")),10000))]);({createEmptyCard,fsrs,Rating}=mod);}catch(e){console.error(e);$("loading").innerHTML="<div><div style=\\"font-size:42px\\">⚠️</div><div style=\\"font-weight:800;margin:10px 0\\">موتور مرور بارگذاری نشد.</div><div style=\\"color:#6b7280;font-size:13px;line-height:1.8\\">اتصال به کتابخانه مرور برقرار نشد. دکمهٔ تلاش دوباره را بزن.</div><button class=\\"primary\\" id=\\"v12FsrsRetry\\" style=\\"margin-top:14px\\">تلاش دوباره</button></div>";$("v12FsrsRetry").addEventListener("click",()=>location.reload(),{once:true});return;}';
  if (!html.includes(marker)) throw new Error("Missing start function");
  html = html.replace(marker, guard);
}
if (!html.includes(TAG)) {
  if (!html.includes("</body>")) throw new Error("Missing </body>");
  html = html.replace("</body>", TAG + "</body>");
}
await fs.writeFile(FILE, html, "utf8");
console.log("Applied hardened v1.2 startup recovery and example runtime fixes.");
