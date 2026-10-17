import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const styles = await read("frontend/src/styles.css");
const app = await read("frontend/src/app/App.tsx");
const onboarding = await read("frontend/src/app/onboarding/OnboardingFlow.tsx");
const designSystem = await read("frontend/src/design-system.css");
const dictionary = await read("frontend/src/app/dictionary.css");
const topic = await read("frontend/src/app/topic-learning.css");
const themeBootstrap = await read("theme-bootstrap.js");

const linearChannel = (value) => {
  const channel = Number.parseInt(value, 16) / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
};
const relativeLuminance = (hex) => {
  const channels = hex.slice(1).match(/.{2}/g).map(linearChannel);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};
const contrastRatio = (foreground, background) => {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
};

// Keep muted light-theme copy readable on the secondary paper surface.
assert.ok(styles.includes("--mute:var(--ds-color-text-muted);"), "Legacy muted-text alias must resolve through the semantic token");
assert.ok(contrastRatio("#62666A", "#EEE9E0") >= 4.5, "Muted text must reach WCAG AA contrast on the secondary surface");
assert.ok(onboarding.includes("--mute:#62666A;"), "Onboarding muted copy must retain the WCAG AA light-theme value");
assert.ok(contrastRatio("#62666A", "#F7F4EE") >= 4.5, "Onboarding muted text must reach WCAG AA contrast on its paper surface");

// The rating row has one stable physical order regardless of the app's RTL/LTR locale.
assert.ok(styles.includes(".rating-grid{direction:ltr;display:grid;"), "Rating grid must keep a stable left-to-right physical order");
assert.ok(app.includes('const ratingOptions=()=>[["Again",t("again")],["Hard",t("hard")],["Good",t("good")],["Easy",t("easy")]] as const;'), "Rating choices must be ordered hardest-to-easiest in the DOM");
assert.ok(app.includes('dir={getLanguage()==="fa"?"rtl":"ltr"}'), "Rating labels must retain their language direction");
assert.ok(app.includes('<bdi lang="ja" dir="ltr">'), "Learning-card Japanese readings must be isolated from surrounding RTL text");

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
assert.ok(designSystem.includes("--ds-color-surface-subtle: light-dark(#F1EDE6, #292724);") && designSystem.includes("--ds-color-progress-track: light-dark(#E9E3D8, #35312C);"), "System dark palette must resolve surface and progress tokens through semantic values");
assert.equal(/\n\s{2}\.(?:surface|stat-card|dialog|experience-nav|badge|reading|audio-button|button|pager-button|settings-language-button|progress|stimulus|example-row|reason|insights|header-tools-menu|rating-again|rating-hard|rating-good|rating-easy)(?:[,{])/.test(systemDark), false, "Unscoped dark overrides could leak into manual Light mode");

// System onboarding overrides are cloned from manual Dark, but only under the OS dark query.
assert.ok(themeBootstrap.includes('const systemRules=darkRules.replaceAll(\':root[data-theme="dark"]\', \':root[data-theme="system"]\');'));
assert.ok(themeBootstrap.includes("style.textContent=darkRules+'@media(prefers-color-scheme:dark){'+systemRules+'}';"));
assert.equal(themeBootstrap.includes(':root:is([data-theme="dark"],[data-theme="system"])'), false, "System onboarding selectors must not darken System-Light mode");

// Surfaces use resolved palette tokens instead of hard-coded light backgrounds.
assert.ok(styles.includes(".progress{height:9px;border-radius:var(--radius-xl);background:var(--progress-track);overflow:hidden}"));
assert.ok(styles.includes(".reading{min-height:96px;padding:14px;border:1px solid var(--line-soft);border-radius:var(--radius-lg);background:var(--surface-soft);"));
assert.ok(styles.includes(".reason{margin:7px 0 0;padding:8px 10px;border:1px solid var(--line-soft);border-radius:14px;background:var(--surface-soft);"));
assert.ok(styles.includes(".insights{overflow:hidden;border:1px solid var(--line);border-radius:var(--radius-lg);background:var(--surface-panel)}"));
assert.ok(styles.includes(':root[data-theme="dark"]{color-scheme:dark;}'), "Manual dark mode should select the dark semantic palette");
assert.ok(styles.includes("--progress-track:#35312c;"));
assert.ok(styles.includes("background:radial-gradient(circle at 8% 6%,rgba(184,74,56,.05),transparent 24rem),var(--washi);color:var(--sumi)"));
assert.equal(styles.includes(':root[data-theme="dark"] :root[data-theme="dark"] .progress'), false, "Broken double-root progress selector must not return");
assert.equal(styles.includes("@media(prefers-color-scheme:dark){#kanji5-account-launcher"), false, "Account launcher OS-dark styling must not override a manually selected Light theme");
assert.ok(styles.includes(':root[data-theme="system"] #kanji5-account-launcher'));

// Theme-aware semantic colors are used for error text and destructive indicators.
assert.ok(styles.includes("--color-danger:var(--ds-state-danger-text);"), "Legacy danger alias must resolve through semantic danger token");
assert.ok(designSystem.includes("--ds-state-danger-text: light-dark(#8E3026, #FF9B91);"));
assert.ok(designSystem.includes("--ds-state-danger-text: light-dark(#8E3026, #FF9B91);"), "Danger text must use a semantic light/dark foreground");
assert.ok(styles.includes(".account-error{margin:12px 0 0;color:var(--color-danger)"));
assert.ok(styles.includes(".sync-error{color:var(--color-danger)"));
assert.ok(styles.includes(".account-sync-badge.sync-error{color:var(--color-danger)"));
assert.ok(styles.includes(".badge-red{border-color:color-mix(in srgb,var(--color-danger) 35%,var(--line));color:var(--color-danger)"));
assert.ok(dictionary.includes(".placement-option.wrong{border-color:color-mix(in srgb,var(--color-danger) 42%,var(--line))"));
assert.ok(dictionary.includes(":root[data-theme=\"dark\"] .dictionary-card-dialog .dialog-close"), "Dictionary close control needs a manual-Dark foreground override");
assert.ok(dictionary.includes(":root[data-theme=\"system\"] .dictionary-card-dialog .dialog-close"), "Dictionary close control needs a System-Dark foreground override");
assert.ok(dictionary.includes("color: var(--sumi);"), "Dictionary close control must use the resolved high-contrast ink token");
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
assert.ok(contrast("#171614", "#A8B5D8") >= 4.5, "Dark indigo primary action text must meet WCAG AA contrast");
assert.ok(contrast("#171614", "#B7C3E0") >= 4.5, "Dark indigo primary hover text must meet WCAG AA contrast");
assert.ok(contrast("#A8B5D8", "#171614") >= 3, "Dark indigo focus ring must meet the 3:1 non-text contrast target against the app canvas");


assert.ok(designSystem.includes("--ds-color-surface-elevated: light-dark(#FFFDF8, #2B2824);"), "Elevated surfaces must use matching light/dark semantic values");
const manualDarkStart = styles.indexOf(':root[data-theme="dark"]{');
const manualLightStart = styles.indexOf(':root[data-theme="light"]{', manualDarkStart);
const manualDark = styles.slice(manualDarkStart, manualLightStart);
assert.ok(manualDark.includes("color-scheme:dark;"), "Manual Dark must select the dark color scheme");
assert.ok(designSystem.includes("--ds-color-skeleton-base: light-dark(#EEE7DA, #292724);") && designSystem.includes("--ds-color-skeleton-highlight: light-dark(#F8F3E9, #35312C);"), "Loading colors must be defined semantically for both themes");
assert.ok(styles.includes(':root[data-theme="dark"] .button.primary{background:var(--ds-color-action-primary);border-color:var(--ds-color-action-primary);color:var(--ds-color-action-primary-text);}'), "Manual Dark primary buttons must use semantic indigo with an explicit foreground");
assert.ok(systemDark.includes(':root[data-theme="system"] .button.primary{background:var(--ds-color-action-primary);border-color:var(--ds-color-action-primary);color:var(--ds-color-action-primary-text);}'), "System + OS Dark primary buttons must use semantic indigo");
assert.ok(styles.includes(':root[data-theme="dark"] .button.primary:is(:hover,:focus-visible):not(:disabled){background:var(--ds-color-action-primary-hover);border-color:var(--ds-color-action-primary-hover);color:var(--ds-color-action-primary-text);box-shadow:0 0 0 2px color-mix(in srgb,var(--ds-focus-ring) 28%,transparent);}'), "Manual Dark primary hover/focus states must use semantic indigo and preserve contrast");
assert.ok(styles.includes(':root[data-theme="dark"] :is(button,summary,a,input,select,textarea):focus-visible{outline-color:var(--ds-focus-ring);}'), "Manual Dark keyboard focus must use the semantic focus ring");
assert.ok(systemDark.includes(':root[data-theme="system"] :is(button,summary,a,input,select,textarea):focus-visible{outline-color:var(--ds-focus-ring);}'), "System Dark keyboard focus must use the semantic focus ring");

assert.ok(systemDark.includes(':root[data-theme="system"] .button.primary:is(:hover,:focus-visible):not(:disabled){background:var(--ds-color-action-primary-hover);border-color:var(--ds-color-action-primary-hover);color:var(--ds-color-action-primary-text);box-shadow:0 0 0 2px color-mix(in srgb,var(--ds-focus-ring) 28%,transparent);}'), "System Dark primary hover/focus states must use semantic indigo");
assert.ok(styles.includes(':root[data-theme="dark"] .audio-button:focus-visible{outline:3px solid var(--ds-focus-ring);outline-offset:3px;background:var(--washi);border-color:var(--line-interactive);color:var(--sumi);}'), "Manual Dark audio focus must use the semantic focus color");
assert.ok(systemDark.includes(':root[data-theme="system"] .audio-button:focus-visible{outline:3px solid var(--ds-focus-ring);outline-offset:3px;background:var(--washi);border-color:var(--line-interactive);color:var(--sumi);}'), "System Dark audio focus must use the semantic focus color");
assert.equal(styles.includes(':root[data-theme="light"] .button.primary{background:var(--shu);'), false, "Dark brand-red primary rules must not leak into manual Light");
assert.ok(topic.includes(':root[data-theme="dark"] .topic-learning-search:focus-within { outline-color: var(--ds-focus-ring); }'), "Manual Dark topic search must have a visible semantic focus ring");
assert.ok(topic.includes(':root[data-theme="system"] .topic-learning-search:focus-within { outline-color: var(--ds-focus-ring); }'), "System Dark topic search must have a visible semantic focus ring");
assert.ok(styles.includes(".button:not(.primary):not(.rating),.pager-button,.settings-language-button){background:var(--ds-color-surface-subtle);color:var(--ds-color-text-primary);"), "Dark neutral controls must resolve through semantic surface/text roles without flattening rating colors");
assert.ok(styles.includes("--skeleton-base:var(--ds-color-skeleton-base);--skeleton-highlight:var(--ds-color-skeleton-highlight);--skeleton-track:var(--ds-color-skeleton-track);--skeleton-fill:var(--ds-color-skeleton-fill);"), "Loading placeholders must use semantic skeleton tokens");
assert.ok(styles.includes("background:linear-gradient(90deg,var(--skeleton-base) 20%,var(--skeleton-highlight) 40%,var(--skeleton-base) 60%)"), "Loading shimmer must use theme-aware tokens");
assert.ok(styles.includes(':root[data-theme="dark"] .rating-again{background:var(--ds-review-again-bg);color:var(--ds-review-again-text);border-color:var(--ds-review-again-border);}'), "Dark Again feedback must use semantic review tokens");
for (const theme of ["dark", "system"]) {
  const neutralRule = `:root[data-theme="${theme}"] :is(.badge,.audio-button,.button:not(.primary):not(.rating),.pager-button,.settings-language-button){background:var(--ds-color-surface-subtle);color:var(--ds-color-text-primary);}`;
  assert.ok(styles.includes(neutralRule), `${theme} neutral button rule must not override semantic rating buttons`);
  for (const [rating, background, foreground] of [
    ["again", "again"],
    ["hard", "hard"],
    ["good", "good"],
    ["easy", "easy"],
  ]) {
    assert.ok(styles.includes(`:root[data-theme="${theme}"] .rating-${rating}{background:var(--ds-review-${rating}-bg);color:var(--ds-review-${rating}-text);border-color:var(--ds-review-${rating}-border);}`), `${theme} ${rating} rating must keep a semantic foreground/background/border pair`);
  }
}
assert.ok(topic.includes(".topic-learning-focus-option.active { border-color: var(--ds-color-action-primary); background: var(--ds-color-action-primary); color: var(--ds-color-surface); }"), "Selected focus option needs a high-contrast Light-mode foreground");
assert.ok(topic.includes(':root[data-theme="dark"] .topic-learning-focus-option.active { color: #171614; }'), "Manual Dark focus foreground must remain dark on the light indigo surface");
assert.ok(topic.includes(':root[data-theme="system"] .topic-learning-focus-option.active { color: #171614; }'), "System Dark focus foreground must remain dark on the light indigo surface");
assert.ok(topic.includes(':root[data-theme="dark"] .topic-learning-focus-option.active { color: #171614; }'), "Dark selected focus option foreground must be explicit");

console.log("Dark-theme parity contract passed.");
