import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const styles = await read("frontend/src/styles.css");
const dictionary = await read("frontend/src/app/dictionary.css");
const themeBootstrap = await read("theme-bootstrap.js");
const learningSurface = await read("frontend/src/app/learning-surface.css");
const app = await read("frontend/src/app/App.tsx");

const darkStart = styles.indexOf("@media(prefers-color-scheme:dark){");
const contrastStart = styles.indexOf("@media(prefers-contrast:more){", darkStart);
assert.ok(darkStart >= 0 && contrastStart > darkStart, "System dark media block should exist");
const systemDark = styles.slice(darkStart, contrastStart);

// These fixed-color overrides must only run for the explicit System preference.
for (const selector of [
  ':root[data-theme="system"] .rating-again',
  ':root[data-theme="system"] .rating-hard',
  ':root[data-theme="system"] .rating-good',
  ':root[data-theme="system"] .rating-easy',
]) {
  assert.ok(systemDark.includes(selector), "Missing System-scoped selector: " + selector);
}
assert.ok(systemDark.includes("--surface-soft:#292724;--surface-panel:rgba(35,33,30,.78);--progress-track:#35312c"));
assert.equal(/\n\s{2}\.(?:surface|stat-card|dialog|experience-nav|badge|reading|audio-button|button|pager-button|settings-language-button|progress|stimulus|example-row|reason|insights|header-tools-menu|rating-again|rating-hard|rating-good|rating-easy)(?:[,{])/.test(systemDark), false, "Unscoped dark overrides could leak into manual Light mode");

// Primary actions and active settings controls must retain their semantic background under dark-mode overrides.
assert.ok(styles.includes(".button.primary{--dark-button-background:var(--ai);background:var(--ai);border-color:var(--ai);color:var(--paper)}"));
assert.ok(styles.includes(".settings-language-button.active{--dark-button-background:var(--sumi);background:var(--sumi);border-color:var(--sumi);color:var(--paper)}"));
for (const theme of ["system", "dark"]) {
  assert.ok(styles.includes(`:root[data-theme="${theme}"] :is(.badge,.audio-button,.button,.pager-button,.settings-language-button){background:var(--dark-button-background,#35312c);}`));
}

// The responsive toolbar styles must target the actual learning-session DOM wrapper.
assert.ok(app.includes('className="card-topline learning-session-toolbar"'));
assert.ok(learningSurface.includes(".learning-session-toolbar{display:flex;align-items:center;justify-content:space-between;"));
assert.ok(learningSurface.includes("@media(max-width:760px){.app-shell .content>.learning-card{"));
assert.ok(learningSurface.includes(".learning-card-back .rating-again{color:color-mix(in srgb,var(--color-danger) 75%,var(--sumi));"));

// Rating controls use quieter tones and thin outlines in the common theme.
assert.ok(styles.includes(".rating-again{border:1px solid #c9a29c;background:#f7efed;color:#7d4840;}"));
assert.ok(styles.includes(".rating-hard{border:1px solid #c8b58a;background:#f7f2e5;color:#776643;}"));
assert.ok(styles.includes(".rating-good{border:1px solid #a9b9a0;background:#f0f3ed;color:#51634a;}"));
assert.ok(styles.includes(".rating-easy{border:1px solid #aab6c9;background:#eef1f5;color:#485b78;}"));
assert.ok(styles.includes(':root[data-theme="dark"] .rating-again{background:#342927;color:#dfb5af;border-color:#72524c;}'));

// System onboarding overrides are cloned from manual Dark, but only under the OS dark query.
assert.ok(themeBootstrap.includes('const systemRules=darkRules.replaceAll(\':root[data-theme="dark"]\', \':root[data-theme="system"]\');'));
assert.ok(themeBootstrap.includes("style.textContent=darkRules+'@media(prefers-color-scheme:dark){'+systemRules+'}';"));
assert.equal(themeBootstrap.includes(':root:is([data-theme="dark"],[data-theme="system"])'), false, "System onboarding selectors must not darken System-Light mode");

// Surfaces use resolved palette tokens instead of hard-coded light backgrounds.
assert.ok(styles.includes(".progress{height:9px;border-radius:var(--radius-xl);background:var(--progress-track);overflow:hidden}"));
assert.ok(styles.includes(".reading{min-height:96px;padding:14px;border:1px solid var(--line-soft);border-radius:var(--radius-lg);background:var(--surface-soft);"));
assert.ok(styles.includes(".reason{margin:7px 0 0;padding:8px 10px;border:1px solid var(--line-soft);border-radius:14px;background:var(--surface-soft);"));
assert.ok(styles.includes(".insights{overflow:hidden;border:1px solid var(--line);border-radius:var(--radius-lg);background:var(--surface-panel)}"));
assert.ok(styles.includes(':root[data-theme="dark"]{color-scheme:dark;--washi:#171614;'));
assert.ok(styles.includes("--progress-track:#35312c;"));
assert.ok(styles.includes("background:radial-gradient(circle at 8% 6%,rgba(184,74,56,.05),transparent 24rem),var(--washi);color:var(--sumi)"));
assert.equal(styles.includes(':root[data-theme="dark"] :root[data-theme="dark"] .progress'), false, "Broken double-root progress selector must not return");
assert.equal(styles.includes("@media(prefers-color-scheme:dark){#kanji5-account-launcher"), false, "Account launcher OS-dark styling must not override a manually selected Light theme");
assert.ok(styles.includes(':root[data-theme="system"] #kanji5-account-launcher'));

// Theme-aware semantic colors are used for error text and destructive indicators.
assert.ok(styles.includes("--color-danger:#a23a2a"));
assert.ok(styles.includes("--color-danger:#ff9b91"));
assert.ok(styles.includes(".account-error{margin:12px 0 0;color:var(--color-danger)"));
assert.ok(styles.includes(".sync-error{color:var(--color-danger)"));
assert.ok(styles.includes(".account-sync-badge.sync-error{color:var(--color-danger)"));
assert.ok(styles.includes(".badge-red{border-color:color-mix(in srgb,var(--color-danger) 35%,var(--line));color:var(--color-danger)"));
assert.ok(dictionary.includes(".placement-option.wrong{border-color:color-mix(in srgb,var(--color-danger) 42%,var(--line))"));
assert.ok(dictionary.includes(".handwriting-result.retry{border-color:color-mix(in srgb,var(--color-danger) 42%,var(--line))"));

function linear(value) {
  const channel = value / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}
function luminance(hex) {
  const channels = hex.replace("#", "").match(/.{2}/g).map((part) => linear(parseInt(part, 16)));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
function contrast(foreground, background) {
  const pair = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (pair[0] + 0.05) / (pair[1] + 0.05);
}
assert.ok(contrast("#a23a2a", "#fdfbf7") >= 4.5, "Light error text must meet WCAG AA contrast");
assert.ok(contrast("#ff9b91", "#23211e") >= 4.5, "Dark error text must meet WCAG AA contrast");
assert.ok(contrast("#23211e", "#8da9d9") >= 4.5, "Dark-mode primary action label must remain readable");
assert.ok(contrast("#23211e", "#f4efe3") >= 4.5, "Dark-mode selected settings label must remain readable");
for (const [label, foreground, background] of [
  ["light Again", "#7d4840", "#f7efed"],
  ["light Hard", "#776643", "#f7f2e5"],
  ["light Good", "#51634a", "#f0f3ed"],
  ["light Easy", "#485b78", "#eef1f5"],
  ["dark Again", "#dfb5af", "#342927"],
  ["dark Hard", "#ddc998", "#332f26"],
  ["dark Good", "#c0cbb2", "#293027"],
  ["dark Easy", "#c0cce0", "#282e37"],
]) {
  assert.ok(contrast(foreground, background) >= 4.5, `${label} rating label must meet WCAG AA contrast`);
}

console.log("Dark-theme parity contract passed.");
