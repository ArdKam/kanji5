import fs from "node:fs/promises";

const index = await fs.readFile("index.html", "utf8");
const manifest = JSON.parse(await fs.readFile("manifest.webmanifest", "utf8"));
const brand = await fs.readFile("frontend/src/app/brand.ts", "utf8");

if (!brand.includes('name: "RINEMI"') || !brand.includes('japanese: "リネミ"') || !brand.includes('descriptor: "Japanese Learning"')) {
  throw new Error("Brand constants must define the selected RINEMI surface brand");
}
if (!index.includes('<title>RINEMI — Japanese Learning</title>')) {
  throw new Error("index.html title must use the selected RINEMI brand");
}
if (!index.includes('<div><p class="kanji5-startup-name">RINEMI</p><p class="kanji5-startup-sub">یادگیری ژاپنی</p></div>')) {
  throw new Error("startup shell must use the selected RINEMI brand");
}
if (!index.includes('content="یادگیری ژاپنی با مرور فاصله‌دار تطبیقی FSRS"')) {
  throw new Error("index.html description must use the current RINEMI product description");
}
if (manifest.name !== "RINEMI — Japanese Learning" || manifest.short_name !== "RINEMI") {
  throw new Error("PWA name and short_name must use the selected RINEMI brand");
}
if (manifest.description !== "یادگیری ژاپنی با مرور فاصله‌دار تطبیقی FSRS") {
  throw new Error("PWA description must use the current RINEMI product description");
}
if (manifest.theme_color !== "#c0392b" || manifest.background_color !== "#f4efe3") {
  throw new Error("PWA colors must remain unchanged during the brand migration");
}
if (manifest.display !== "standalone" || manifest.start_url !== "./") {
  throw new Error("PWA launch metadata must remain standalone with a relative start URL");
}

console.log("RINEMI brand metadata contract passed.");
