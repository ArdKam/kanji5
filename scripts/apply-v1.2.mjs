import fs from "node:fs/promises";

const FILE = "index.html";
let html = await fs.readFile(FILE, "utf8");

const DATA_BOOTSTRAP = `<script id="v1.2-dataset-bootstrap">
(() => {
  const DATA_VERSION = "v1.2-dataset-2136";
  const DECK_KEY = "kanji5-deck";
  const VERSION_KEY = "kanji5-deck-version";
  try {
    if (localStorage.getItem(VERSION_KEY) !== DATA_VERSION) {
      localStorage.removeItem(DECK_KEY);
      localStorage.setItem(VERSION_KEY, DATA_VERSION);
    }
  } catch (_) {}
})();
</script>`;

const MOBILE = `<style id="v1.2-mobile-fix">
@media(max-width:700px){#app{display:flex;flex-direction:column}#studyPanel{order:1;margin-top:0}#app>.grid{order:2}#app>.progress:not(.goal){order:3}#app>.goalrow{order:4}#app>.progress.goal{order:5}#app>.footer{order:6}.kanji{margin-top:0}.readings{grid-template-columns:1fr}}
.reading-list{display:flex;flex-direction:column;gap:6px;align-items:center}.reading-entry{display:inline-flex;align-items:center;gap:5px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:4px 7px}.reading-entry .audiobtn{padding:2px 6px;font-size:11px;border-radius:7px}.example-meaning{display:block;color:var(--muted);font-size:12px;line-height:1.45;margin-top:2px;direction:ltr;text-align:left}.v12-recall-result{border-radius:12px;padding:10px;margin-top:9px;font-weight:800;text-align:center}.v12-recall-result.good{background:#dcfce7;color:#166534}.v12-recall-result.bad{background:#fee2e2;color:#991b1b}.v12-recall-result.unknown{background:#f3f4f6;color:#4b5563}
</style>`;

const RECALL = `<script id="v1.2-recall-result-fix">
(() => {
  const KEY = "kanji5-v1.2-last-attempt";
  let shown = null;
  const paint = () => {
    const kanji = document.querySelector(".kanji")?.textContent?.trim();
    if (!kanji) return;
    let attempt; try { attempt = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (_) { return; }
    if (!attempt || attempt.character !== kanji || !attempt.hadAttempt) return;
    const stamp = kanji + ":" + attempt.attemptedAt;
    if (shown === stamp) return;
    const box = document.getElementById("answerBox");
    const target = box?.querySelector(".answerbox");
    if (!box || !box.classList.contains("show") || !target) return;
    const result = document.createElement("div");
    result.className = "v12-recall-result " + (attempt.correct === true ? "good" : attempt.correct === false ? "bad" : "unknown");
    result.textContent = attempt.correct === true ? "✅ پاسخ درست بود" : attempt.correct === false ? "❌ پاسخ درست نبود — حالا پاسخ صحیح را ببین" : "ℹ️ تلاش ثبت شد؛ پاسخ خودکار قابل بررسی نبود";
    target.prepend(result); shown = stamp;
  };
  new MutationObserver(paint).observe(document.body, {childList:true,subtree:true});
  setInterval(paint, 500);
})();
</script>`;

const WATCHDOG = `<script id="v1.2-loading-watchdog">
setTimeout(() => {
  const loading = document.getElementById("loading");
  const app = document.getElementById("app");
  if (loading && !loading.hidden && app?.hidden) {
    loading.innerHTML = '<div><div style="font-size:42px">⚠️</div><div style="font-weight:800;margin:10px 0">بارگذاری برنامه طول کشید.</div><div style="color:#6b7280;font-size:13px;line-height:1.7">اتصال اینترنت یا کتابخانهٔ مرور را بررسی کن و دوباره تلاش کن.</div><button class="primary" id="v12Retry" style="margin-top:14px">تلاش دوباره</button></div>';
    document.getElementById("v12Retry")?.addEventListener("click", () => location.reload());
  }
}, 12000);
</script>`;

const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

if (!html.includes("id=\"v1.2-mobile-fix\"")) html = html.replace("</head>", `${MOBILE}</head>`);
if (!html.includes("id=\"v1.2-recall-result-fix\"")) html = html.replace("</body>", `${RECALL}</body>`);
if (!html.includes("id=\"v1.2-loading-watchdog\"")) html = html.replace("</body>", `${WATCHDOG}</body>`);
if (!html.includes("v1.2-enhancements.js")) html = html.replace("</body>", `<script src="./v1.2-enhancements.js"></script></body>`);
if (!html.includes("v1.2-dataset-bootstrap")) html = html.replace('<script type="module">', `${DATA_BOOTSTRAP}<script type="module">`);

html = html.replace('import { createEmptyCard, fsrs, Rating } from "https://esm.sh/ts-fsrs@6.0.0-beta.7";', 'const { createEmptyCard, fsrs, Rating } = await import("https://esm.sh/ts-fsrs@6.0.0-beta.7");');

html = html.replace('<div class="v">${item.on.join(" ・ ")||"—"}</div>', '<div class="v reading-list">${item.on.length?item.on.map(r=>`<span class="reading-entry"><span>${r}</span><button class="audiobtn" data-speak="${r}" aria-label="تلفظ خوانش">🔊</button></span>`).join(""):"—"}</div>');
html = html.replace('<div class="v">${item.kun.join(" ・ ")||"—"}</div>', '<div class="v reading-list">${item.kun.length?item.kun.map(r=>`<span class="reading-entry"><span>${r}</span><button class="audiobtn" data-speak="${r}" aria-label="تلفظ خوانش">🔊</button></span>`).join(""):"—"}</div>');

html = html.replace(/async function fetchExamples\(k\)\{[\s\S]*?\n?\}function renderEmpty/, `async function fetchExamples(k){if(state.examples[k.id])return;try{const res=await fetch(WORDS_URL(k.character),{cache:"force-cache"});if(!res.ok)throw new Error("examples request failed");const data=await res.json();const seen=new Set(),out=[];for(const e of data){const meanings=(e.meanings||[]).flatMap(m=>m.glosses||[]).slice(0,2).join("; ");for(const v of(e.variants||[])){const term=v.written;if(term&&term.includes(k.character)&&!seen.has(term)){seen.add(term);const reading=v.pronounced;if(reading)out.push({word:term,reading,meaning:meanings});if(out.length>=4)break}}if(out.length>=4)break}state.examples[k.id]=out;save()}catch(_){state.examples[k.id]=[];save()}}function renderEmpty`);
html = html.replace(/function renderExamples\(\)\{[\s\S]*?\}\$\("settingsBtn"\)/, `function renderExamples(){const el=$("examples");if(!el||!state.current)return;const ex=state.examples[state.current]||[];if(!ex.length){el.innerHTML='<div style="color:#8a8f98;font-size:12px;text-align:center;margin-top:10px">نمونه‌های واژگانی فعلاً در دسترس نیستند؛ می‌توانی مرور را ادامه بدهی.</div>';return}el.innerHTML='<h3>نمونه‌های واژگانی</h3><div class="words">'+ex.map(x=>'<div class="word"><div><span>'+escape(x.word)+'</span> <small style="color:#6b7280;direction:ltr;display:inline-block">'+escape(x.reading)+'</small>'+(x.meaning?'<small class="example-meaning">'+escape(x.meaning)+'</small>':'')+'</div><button class="audiobtn" data-speak="'+escape(x.reading||x.word)+'" aria-label="تلفظ واژه">🔊</button></div>').join("")+'</div>';el.querySelectorAll("[data-speak]").forEach(b=>b.addEventListener("click",()=>speak(b.dataset.speak)))}$("settingsBtn")`);
html = html.replace(/دورهٔ ۲۰۰۰ کانجی تمام شد/g, "دورهٔ ۲۱۳۶ کانجی تمام شد");

await fs.writeFile(FILE, html, "utf8");
console.log("Applied robust v1.2 release patch.");
