import fs from "node:fs/promises";

const FILE = "index.html";
const TAG = '<script src="./v1.2-enhancements.js"></script>';
let html = await fs.readFile(FILE, "utf8");

if (!html.includes(TAG)) {
  const marker = "</body>";
  if (!html.includes(marker)) throw new Error(`Could not find ${marker} in ${FILE}`);
  html = html.replace(marker, `${TAG}${marker}`);
}

html = html
  .replace("هر روز فقط ۵ کانجی؛ مرورها را الگوریتم تنظیم می‌کند.", "هر روز فقط ۵ کانجی؛ مرورها را الگوریتم تنظیم می‌کند.")
  .replace("const STORAGE=\"kanji5-v1\";", "const STORAGE=\"kanji5-v1\";");

await fs.writeFile(FILE, html, "utf8");
console.log(`Applied v1.2 enhancements to ${FILE}.`);
