import fs from "node:fs/promises";
const FILE = "index.html";
const TAG = '<script src="./v1.2-runtime-fixes.js"></script>';
let html = await fs.readFile(FILE, "utf8");
const oldImport = 'const { createEmptyCard, fsrs, Rating } = await import("https://esm.sh/ts-fsrs@6.0.0-beta.7");';
const declarations = 'let createEmptyCard, fsrs, Rating;\nconst FSRS_URL="https://esm.sh/ts-fsrs@5.4.1?bundle";';
if (html.includes(oldImport)) html = html.replace(oldImport, declarations);
if (html.includes(declarations) && !html.includes("FSRS_LOAD_TIMEOUT")) {
  const marker = "async function start(){";
  const guard = 'async function start(){try{const mod=await Promise.race([import(FSRS_URL),new Promise((_,reject)=>setTimeout(()=>reject(new Error("FSRS_LOAD_TIMEOUT")),10000))]);({createEmptyCard,fsrs,Rating}=mod);}catch(e){console.error(e);$("loading").innerHTML="<div><div style=\\"font-size:42px\\">⚠️</div><div style=\\"font-weight:800;margin:10px 0\\">موتور مرور بارگذاری نشد.</div><div style=\\"color:#6b7280;font-size:13px;line-height:1.8\\">اتصال به کتابخانه مرور برقرار نشد. اتصال اینترنت را بررسی کن و دوباره تلاش کن.</div><button class=\\"primary\\" id=\\"v12FsrsRetry\\" style=\\"margin-top:14px\\">تلاش دوباره</button></div>";$("v12FsrsRetry").addEventListener("click",()=>location.reload());return;}';
  if (!html.includes(marker)) throw new Error("Missing start function");
  html = html.replace(marker, guard);
}
if (!html.includes(TAG)) {
  if (!html.includes("</body>")) throw new Error("Missing </body>");
  html = html.replace("</body>", TAG + "</body>");
}
await fs.writeFile(FILE, html, "utf8");
console.log("Applied v1.2 runtime startup and example fixes.");
