import fs from "node:fs/promises";

const index = await fs.readFile("index.html", "utf8");
const manifest = JSON.parse(await fs.readFile("manifest.webmanifest", "utf8"));

if (!index.includes('<meta name="theme-color" content="#c0392b" />')) {
  throw new Error("index.html theme-color must match the KanjiYar shu-red brand color");
}
if (!index.includes("<title>کانجی‌یار — یادگیری روزانهٔ کانجی</title>")) {
  throw new Error("index.html title must use the current KanjiYar brand");
}
if (!index.includes('content="یادگیری روزانهٔ ۵ کانجی با مرور فاصله‌دار تطبیقی FSRS"')) {
  throw new Error("index.html description must use the current product description");
}
if (manifest.name !== "کانجی‌یار" || manifest.short_name !== "کانجی‌یار") {
  throw new Error("PWA name and short_name must use the current KanjiYar brand");
}
if (manifest.theme_color !== "#c0392b" || manifest.background_color !== "#f4efe3") {
  throw new Error("PWA colors must match the current Sumi Play palette");
}
if (manifest.display !== "standalone" || manifest.start_url !== "./") {
  throw new Error("PWA launch metadata must remain standalone with a relative start URL");
}

console.log("Brand metadata contract passed.");
