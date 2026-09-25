import fs from "node:fs";

const release = String(process.env.KANJI5_RELEASE || "local").trim() || "local";
const files = ["index.html", "react-entry.js", "account-fallback.js", "sw.js"];
for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const next = source.replaceAll("__KANJI5_RELEASE__", release);
  fs.writeFileSync(file, next);
}
console.log(`Stamped Kanji 5 release asset version: ${release}`);
