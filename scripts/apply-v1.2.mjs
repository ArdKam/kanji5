import fs from "node:fs/promises";

const FILE = "index.html";
const TAG = '<script src="./v1.2-enhancements.js"></script>';
const BOOTSTRAP = `<script>
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
const MOBILE_FIX = `<style id="v1.2-mobile-fix">
@media(max-width:700px){
  #app{display:flex;flex-direction:column}
  #studyPanel{order:1;margin-top:0}
  #app>.grid{order:2}
  #app>.progress:not(.goal){order:3}
  #app>.goalrow{order:4}
  #app>.progress.goal{order:5}
  #app>.footer{order:6}
  #studyPanel .kanji{margin-top:0}
  .reading-list{display:flex;flex-direction:column;gap:6px;align-items:center}
}
.reading-list{display:flex;flex-wrap:wrap;gap:7px;justify-content:center}
.reading-entry{display:inline-flex;align-items:center;gap:5px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:4px 7px}
.reading-entry .audiobtn{padding:2px 6px;font-size:11px;border-radius:7px}
.example-meaning{display:block;color:var(--muted);font-size:12px;line-height:1.45;margin-top:2px;direction:ltr;text-align:left}
.v12-recall-result{border-radius:12px;padding:10px;margin-top:9px;font-weight:800;text-align:center}
.v12-recall-result.good{background:#dcfce7;color:#166534}
.v12-recall-result.bad{background:#fee2e2;color:#991b1b}
.v12-recall-result.unknown{background:#f3f4f6;color:#4b5563}
</style>`;

let html = await fs.readFile(FILE, "utf8");
const must = (condition, label) => { if (!condition) throw new Error(`Could not find ${label}`); };

if (!html.includes(TAG)) {
  const marker = "</body>";
  must(html.includes(marker), "</body>");
  html = html.replace(marker, `${TAG}${marker}`);
}

const BOOTSTRAP_PATTERN = /<script>\s*\(\(\) => \{\s*const DATA_VERSION = "v1\.2-dataset-2136";[\s\S]*?<\/script>/;
if (!BOOTSTRAP_PATTERN.test(html)) {
  const marker = '<script type="module">';
  must(html.includes(marker), "module script marker");
  html = html.replace(marker, `${BOOTSTRAP}${marker}`);
}

if (!html.includes('id="v1.2-mobile-fix"')) html = html.replace("</head>", `${MOBILE_FIX}</head>`);

if (html.includes('import { createEmptyCard, fsrs, Rating } from "https://esm.sh/ts-fsrs@6.0.0-beta.7";')) {
  html = html.replace('import { createEmptyCard, fsrs, Rating } from "https://esm.sh/ts-fsrs@6.0.0-beta.7";', 'let createEmptyCard, fsrs, Rating;');
}
if (!html.includes('const FSRS_URL=')) html = html.replace('const DATA_URL="./kanji-data.json";', 'const DATA_URL="./kanji-data.json";\nconst FSRS_URL="https://esm.sh/ts-fsrs@5.4.1?bundle";');

html = html.replace(/async function start\(\)\{[\s\S]*?\n\}\s*<\/script>\s*<script>if\("serviceWorker"in navigator\)/,
`async function start(){
  try{
    const mod=await Promise.race([
      import(FSRS_URL),
      new Promise((_,reject)=>setTimeout(()=>reject(new Error("FSRS_LOAD_TIMEOUT")),10000))
    ]);
    ({createEmptyCard,fsrs,Rating}=mod);
  }catch(e){
    console.error(e);
    $("loading").innerHTML='<div><div style="font-size:42px">⚠️</div><div style="font-weight:800;margin:10px 0">موتور مرور بارگذاری نشد.</div><div style="color:#6b7280;font-size:13px;line-height:1.7">اتصال به کتابخانهٔ مرور برقرار نشد. اتصال اینترنت را بررسی کن و دوباره تلاش کن.</div><button class="primary" id="retry" style="margin-top:14px">تلاش دوباره</button></div>';
    $("retry").addEventListener("click",()=>location.reload());
    return;
  }
  loadSaved();hydrateCards();const cached=loadDeckFromCache();
  try{
    if(!cached)await loadDeck();
    initScheduler();
    $("loading").hidden=true;$("app").hidden=false;buildQueue();next();updateStats()
  }catch(e){
    console.error(e);
    $("loading").innerHTML='<div><div style="font-size:42px">⚠️</div><div style="font-weight:800;margin:10px 0">داده‌های کانجی بارگذاری نشد.</div><div style="color:#6b7280;font-size:13px;line-height:1.7">اتصال یا cache داده در دسترس نیست. دوباره تلاش کن.</div><button class="primary" id="retry" style="margin-top:14px">تلاش دوباره</button></div>';
    $("retry").addEventListener("click",()=>location.reload());
  }
}
</script><script>if("serviceWorker"in navigator)`);

html = html.replace(/async function fetchExamples\(k\)\{[\s\S]*?\n\}function renderEmpty/,
`async function fetchExamples(k){if(state.examples[k.id])return;try{const res=await fetch(WORDS_URL(k.character),{cache:"force-cache"});if(!res.ok)throw new Error("examples request failed");const data=await res.json();const seen=new Set(),out=[];for(const e of data){const meaning=(e.meanings||[]).flatMap(m=>m.glosses||[]).slice(0,2).join("; ");for(const v of(e.variants||[])){const term=v.written;if(term&&term.includes(k.character)&&!seen.has(term)){seen.add(term);const reading=v.pronounced;if(reading)out.push({word:term,reading,meaning});if(out.length>=4)break}}if(out.length>=4)break}state.examples[k.id]=out;save()}catch(_){state.examples[k.id]=[];save()}}function renderEmpty`);

html = html.replace(
  '<div class="v">${item.on.join(" ・ ")||"—"}</div>',
  '<div class="v reading-list">${item.on.length?item.on.map(r=>`<span class="reading-entry"><span>${r}</span><button class="audiobtn" data-speak="${r}" aria-label="تلفظ خوانش">🔊</button></span>`).join(""):"—"}</div>'
);
html = html.replace(
  '<div class="v">${item.kun.join(" ・ ")||"—"}</div>',
  '<div class="v reading-list">${item.kun.length?item.kun.map(r=>`<span class="reading-entry"><span>${r}</span><button class="audiobtn" data-speak="${r}" aria-label="تلفظ خوانش">🔊</button></span>`).join(""):"—"}</div>'
);

html = html.replace(/function renderExamples\(\)\{[\s\S]*?\n\}/,
`function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\\\"":"&quot;","'":"&#39;"}[c]||c))}function escapeAttr(value){return escapeHtml(value)}function renderExamples(){const el=$("examples");if(!el||!state.current)return;const ex=state.examples[state.current]||[];if(!ex.length){el.innerHTML='<div style="color:#8a8f98;font-size:12px;text-align:center;margin-top:10px">نمونه‌های واژگانی فعلاً در دسترس نیستند.</div>';return}el.innerHTML='<h3>نمونه‌های واژگانی</h3><div class="words">'+ex.map(x=>'<div class="word"><div><span>'+escapeHtml(x.word)+'</span> <small style="color:#6b7280;direction:ltr;display:inline-block">'+escapeHtml(x.reading||"")+'</small>'+(x.meaning?'<small class="example-meaning">'+escapeHtml(x.meaning)+'</small>':'')+'</div><button class="audiobtn" data-speak="'+escapeAttr(x.reading||x.word)+'" aria-label="تلفظ واژه">🔊</button></div>').join("")+'</div>';el.querySelectorAll("[data-speak]").forEach(b=>b.addEventListener("click",()=>speak(b.dataset.speak)))}
`);

html = html.replace(/دورهٔ ۲۰۰۰ کانجی تمام شد/g, "دورهٔ ۲۱۳۶ کانجی تمام شد");

await fs.writeFile(FILE, html, "utf8");
console.log(`Applied v1.2 release fixes to ${FILE}.`);
