import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const styles = await read("frontend/src/styles.css");
const designSystem = await read("frontend/src/design-system.css");
const dictionary = await read("frontend/src/app/dictionary.css");
const topic = await read("frontend/src/app/topic-learning.css");
const themeBootstrap = await read("theme-bootstrap.js");

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

// System onboarding overrides are cloned from manual Dark, but only under the OS dark query.
assert.ok(themeBootstrap.includes('const systemRules=darkRules.replaceAll(\':root[data-theme="dark"]\', \':root[data-theme="system"]\');'));
assert.ok(themeBootstrap.includes("style.textContent=darkRules+'@media(prefers-color-scheme:dark){'+systemRules+'}';"));
assert.equal(themeBootstrap.includes(':root:is([data-theme="dark"],[data-theme="system"])'), false, "System onboarding selectors must not darken System-Light mode");

// Surfaces use resolved palette tokens instead of hard-coded light backgrounds.
assert.ok(styles.includes(".progress{height:9px;border-radius:var(--ds-radius-xl);background:var(--progress-track);overflow:hidden}"));
assert.ok(styles.includes(".reading{min-height:96px;padding:14px;border:1px solid var(--line-soft);border-radius:var(--ds-radius-lg);background:var(--surface-soft);"));
assert.ok(styles.includes(".reason{margin:7px 0 0;padding:8px 10px;border:1px solid var(--line-soft);border-radius:14px;background:var(--surface-soft);"));
assert.ok(styles.includes(".insights{overflow:hidden;border:1px solid var(--line);border-radius:var(--ds-radius-lg);background:var(--surface-panel)}"));
assert.ok(styles.includes(':root[data-theme="dark"]{color-scheme:dark;--washi:#171614;'));
assert.ok(styles.includes("--progress-track:#35312c;"));
assert.ok(styles.includes("background:radial-gradient(circle at 8% 6%,rgba(184,74,56,.05),transparent 24rem),var(--washi);color:var(--sumi)"));
assert.equal(styles.includes(':root[data-theme="dark"] :root[data-theme="dark"] .progress'), false, "Broken double-root progress selector must not return");
assert.equal(styles.includes("@media(prefers-color-scheme:dark){#kanji5-account-launcher"), false, "Account launcher OS-dark styling must not override a manually selected Light theme");
assert.ok(styles.includes(':root[data-theme="system"] #kanji5-account-launcher'));

// Theme-aware semantic colors are used for error text and destructive indicators.
assert.ok(styles.includes("--color-danger:var(--ds-state-danger-text);"), "Legacy danger token must resolve through the semantic state role");
assert.ok(designSystem.includes("--ds-state-danger-text: #8E3026;"), "Light theme must define its semantic danger foreground");
assert.ok(designSystem.includes("--ds-state-danger-text: #FF9B91;"), "Dark theme must define its semantic danger foreground");
assert.ok(styles.includes(".account-error{margin:12px 0 0;color:var(--color-danger)"));
assert.ok(styles.includes(".sync-error{color:var(--color-danger)"));
assert.ok(styles.includes(".account-sync-badge.sync-error{color:var(--color-danger)"));
assert.ok(styles.includes(".badge-red{border-color:color-mix(in srgb,var(--color-danger) 35%,var(--line));color:var(--color-danger)"));
assert.ok(dictionary.includes(".placement-option.wrong{border-color:color-mix(in srgb,var(--ds-state-danger-text) 42%,var(--ds-color-border))"));
assert.ok(dictionary.includes(":root[data-theme=\"dark\"] .dictionary-card-dialog .dialog-close"), "Dictionary close control needs a manual-Dark foreground override");
assert.ok(dictionary.includes(":root[data-theme=\"system\"] .dictionary-card-dialog .dialog-close"), "Dictionary close control needs a System-Dark foreground override");
assert.ok(dictionary.includes("color: var(--ds-color-text-primary);"), "Dictionary close control must use the resolved high-contrast ink token");
assert.ok(dictionary.includes(".handwriting-result.retry{border-color:color-mix(in srgb,var(--ds-state-danger-text) 42%,var(--ds-color-border))"));

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
assert.ok(contrast("#8E3026", "#FDFBF7") >= 4.5, "Light semantic error text must meet WCAG AA contrast");
assert.ok(contrast("#FF9B91", "#23211E") >= 4.5, "Dark semantic error text must meet WCAG AA contrast");


assert.ok(styles.includes("--color-surface-elevated:#2b2824"), "Dark elevated surfaces must not remain near-white");
const manualDarkStart = styles.indexOf(':root[data-theme="dark"]{');
const manualLightStart = styles.indexOf(':root[data-theme="light"]{', manualDarkStart);
const manualDark = styles.slice(manualDarkStart, manualLightStart);
assert.ok(manualDark.includes("--color-surface-elevated:#2b2824"), "Manual Dark must define its own elevated surface token");
assert.ok(manualDark.includes("--skeleton-base:#292724;--skeleton-highlight:#35312c;--skeleton-track:#35312c;--skeleton-fill:#4b463f;"), "Manual Dark must define its own loading tokens");
assert.ok(styles.includes(".button.primary{background:var(--ai);border-color:var(--ai);color:#171614;}"), "Dark primary buttons need a readable explicit foreground");
assert.ok(styles.includes(".button:not(.primary):not(.rating),.pager-button,.settings-language-button){background:#35312c;color:var(--sumi);"), "Dark neutral controls must explicitly retain readable text without flattening rating colors");
assert.ok(styles.includes("--skeleton-base:#292724;--skeleton-highlight:#35312c;--skeleton-track:#35312c;--skeleton-fill:#4b463f;"), "Dark loading placeholders must use dark tokens");
assert.ok(styles.includes("background:linear-gradient(90deg,var(--skeleton-base) 20%,var(--skeleton-highlight) 40%,var(--skeleton-base) 60%)"), "Loading shimmer must use theme-aware tokens");
assert.ok(styles.includes(':root[data-theme="dark"] .rating-again{background:#332724;color:#e8b4ac;border-color:#8d625a;}'), "Dark Again feedback must use subdued semantic colors");
for (const theme of ["dark", "system"]) {
  const neutralRule = `:root[data-theme="${theme}"] :is(.badge,.audio-button,.button:not(.primary):not(.rating),.pager-button,.settings-language-button){background:#35312c;color:var(--sumi);}`;
  assert.ok(styles.includes(neutralRule), `${theme} neutral button rule must not override semantic rating buttons`);
  for (const [rating, background, foreground] of [
    ["again", "#332724", "#e8b4ac"],
    ["hard", "#332f27", "#d8c8a5"],
    ["good", "#283128", "#bed0bd"],
    ["easy", "#27303b", "#c1cee0"],
  ]) {
    assert.ok(styles.includes(`:root[data-theme="${theme}"] .rating-${rating}{background:${background};color:${foreground};`), `${theme} ${rating} rating must keep a semantic foreground/background pair`);
  }
}
assert.ok(topic.includes(".topic-learning-focus-option.active { border-color: var(--ai); background: var(--ai); color: var(--paper); }"), "Selected focus option needs a high-contrast Light-mode foreground");
assert.ok(topic.includes(':root[data-theme="dark"] .topic-learning-focus-option.active { color: #171614; }'), "Manual Dark focus foreground must remain dark on the light indigo surface");
assert.ok(topic.includes(':root[data-theme="system"] .topic-learning-focus-option.active { color: #171614; }'), "System Dark focus foreground must remain dark on the light indigo surface");
assert.ok(topic.includes(':root[data-theme="dark"] .topic-learning-focus-option.active { color: #171614; }'), "Dark selected focus option foreground must be explicit");

console.log("Dark-theme parity contract passed.");
