import assert from "node:assert/strict";
import fs from "node:fs/promises";

const index = await fs.readFile("index.html", "utf8");
const manifest = JSON.parse(await fs.readFile("manifest.webmanifest", "utf8"));
const app = await fs.readFile("frontend/src/app/App.tsx", "utf8");
const onboarding = await fs.readFile("frontend/src/app/onboarding/OnboardingFlow.tsx", "utf8");
const i18n = await fs.readFile("frontend/src/app/i18n.ts", "utf8");
const styles = await fs.readFile("frontend/src/styles.css", "utf8");
const icon = await fs.readFile("icon.svg", "utf8");
const icon192 = await fs.readFile("icon-192.svg", "utf8");
const icon512 = await fs.readFile("icon-512.svg", "utf8");
const logo = await fs.readFile("rinemi-logo.svg", "utf8");
const logoDark = await fs.readFile("rinemi-logo-dark.svg", "utf8");
const logoMono = await fs.readFile("rinemi-logo-mono.svg", "utf8");
const mark = await fs.readFile("rinemi-mark.svg", "utf8");

assert.ok(index.includes('<meta name="theme-color" content="#505F83" />'), "index.html theme-color must use the Rinemi indigo");
assert.ok(index.includes('<title>Rinemi — یادگیری کانجی ژاپنی</title>'), "index.html title must use Rinemi");
assert.ok(index.includes('content="Rinemi — یادگیری کانجی ژاپنی با مرور فاصله‌دار تطبیقی"'), "index.html description must match the product positioning");
assert.ok(index.includes('<p class="kanji5-startup-name" dir="ltr">Rinemi</p>'), "startup shell must display the canonical wordmark");
assert.ok(manifest.name === "Rinemi" && manifest.short_name === "Rinemi", "PWA name and short_name must use Rinemi");
assert.ok(manifest.description === "Japanese kanji learning with adaptive spaced repetition", "PWA description must use the canonical product description");
assert.ok(manifest.theme_color === "#505F83" && manifest.background_color === "#F7F4EE", "PWA colors must match the Rinemi palette");
assert.ok(manifest.display === "standalone" && manifest.start_url === "./" && manifest.scope === "./", "PWA install paths and display mode must remain stable");
assert.ok(app.includes('<h1 dir="ltr">Rinemi</h1>') && app.includes('className="header-brand-mark" src="./icon.svg"'), "main app header must render the wordmark and brand mark");
assert.ok(onboarding.includes("<strong>Rinemi</strong>") && !onboarding.includes("<strong>Kanji5</strong>"), "onboarding header must use Rinemi rather than the legacy brand");
assert.ok(onboarding.includes('className="kanji5-onboarding-brand-mark" src="./icon.svg"'), "onboarding must use the canonical Rinemi mark");
assert.ok(onboarding.includes("--paper:#F7F4EE") && onboarding.includes("--indigo:#505F83") && onboarding.includes("--shu:#D6A1AA"), "onboarding palette must match the Rinemi system");
assert.ok(!onboarding.includes("--indigo:#304f74") && !onboarding.includes("--shu:#b56d72"), "onboarding must not retain its legacy palette");
assert.ok(i18n.includes('document.title = language === "fa" ? "Rinemi — یادگیری کانجی ژاپنی" : "Rinemi — Japanese kanji learning";'), "dynamic document title must use Rinemi in both languages");
for (const legacy of ["Kanji5", "Kanji 5", "Kanji-yar", "کانجی‌یار", "کانجی ۵"]) {
  assert.ok(!i18n.includes(legacy), "localized UI must not retain legacy brand text: " + legacy);
}
assert.ok(styles.includes("--shu:#505F83;") && styles.includes("--sakura:#D6A1AA;"), "UI tokens must include the Rinemi indigo and sakura palette");
for (const [name, source] of [["icon.svg", icon], ["icon-192.svg", icon192], ["icon-512.svg", icon512]]) {
  assert.ok(source.includes("Rinemi"), name + " must carry accessible Rinemi naming");
  assert.ok(source.includes("#505F83") && source.includes("#D6A1AA") && source.includes("#F7F4EE"), name + " must match the canonical palette");
}

for (const [name, source] of [["rinemi-logo.svg", logo], ["rinemi-logo-dark.svg", logoDark], ["rinemi-logo-mono.svg", logoMono], ["rinemi-mark.svg", mark]]) {
  assert.ok(source.includes("Rinemi") && source.includes("<svg"), name + " must be a valid Rinemi SVG asset");
}
assert.ok(logo.includes("#505F83") && logo.includes("#D6A1AA"), "primary logo must use indigo and sakura");
assert.ok(logoDark.includes("#F7F4EE") && logoDark.includes("#A8B5D8"), "dark logo must preserve readable contrast");
assert.ok(logoMono.includes("#292B2D"), "monochrome logo must use the sumi ink color");

console.log("Rinemi brand metadata contract passed.");
