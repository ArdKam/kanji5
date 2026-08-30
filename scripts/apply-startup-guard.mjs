import fs from "node:fs/promises";

const FILE = "index.html";
const MARKER = '<script id="v1.2-startup-guard">';
const MODULE = '<script type="module">';

const GUARD = `<script id="v1.2-startup-guard">
(() => {
  let shown = false;
  function showFallback() {
    if (shown) return;
    const loading = document.getElementById("loading");
    const app = document.getElementById("app");
    if (!loading || loading.hidden || !app || !app.hidden) return;
    shown = true;
    loading.innerHTML = '<div><div style="font-size:42px">⚠️</div><div style="font-weight:800;margin:10px 0">بارگذاری برنامه طول کشید.</div><div style="color:#6b7280;font-size:13px;line-height:1.8">اتصال اینترنت یا کتابخانهٔ مرور را بررسی کن.</div><button class="primary" id="v12StartupRetry" style="margin-top:14px">تلاش دوباره</button></div>';
    document.getElementById("v12StartupRetry")?.addEventListener("click", () => location.reload());
  }

  const observer = new MutationObserver(() => {
    const loading = document.getElementById("loading");
    const app = document.getElementById("app");
    if (loading?.hidden || !app?.hidden) observer.disconnect();
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["hidden"]
  });

  window.addEventListener("error", () => setTimeout(showFallback, 0), true);
  window.addEventListener("unhandledrejection", () => setTimeout(showFallback, 0), true);
  setTimeout(showFallback, 7000);
})();
</script>`;

let html = await fs.readFile(FILE, "utf8");

if (!html.includes(MARKER)) {
  const pos = html.indexOf(MODULE);
  if (pos < 0) throw new Error("Missing module script marker");
  html = html.slice(0, pos) + GUARD + html.slice(pos);
}

await fs.writeFile(FILE, html, "utf8");
console.log("Applied pre-module startup guard.");
