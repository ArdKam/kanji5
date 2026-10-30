import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const styles = await read("frontend/src/styles.css");
const app = await read("frontend/src/app/App.tsx");
const onboarding = await read("frontend/src/app/onboarding/OnboardingFlow.tsx");
const designSystem = await read("frontend/src/design-system.css");
const dictionary = await read("frontend/src/app/dictionary.css");
const learningSurface = await read("frontend/src/app/learning-surface.css");
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
assert.ok(designSystem.includes("--ds-color-text-muted: light-dark(#62666A, #B8AFA2);"), "Semantic muted text must use the verified light-theme contrast token");
assert.ok(contrastRatio("#62666A", "#EEE9E0") >= 4.5, "Muted text must reach WCAG AA contrast on the secondary surface");
assert.ok(onboarding.includes("--mute:var(--ds-color-text-muted);"), "The onboarding shell must consume the shared semantic muted-text token");
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

// Ratings inherit the shared light-dark semantic state tokens; they must not need
// duplicated fixed-color overrides scoped to the System theme.
for (const selector of [
  ".app-shell .rating-again{color:var(--ds-state-danger-text);border-color:var(--ds-state-danger-border);background:var(--ds-state-danger-bg)}",
  ".app-shell .rating-hard{color:var(--ds-state-warning-text);border-color:var(--ds-state-warning-border);background:var(--ds-state-warning-bg)}",
  ".app-shell .rating-good{color:var(--ds-state-success-text);border-color:var(--ds-state-success-border);background:var(--ds-state-success-bg)}",
  ".app-shell .rating-easy{color:var(--ds-state-info-text);border-color:var(--ds-state-info-border);background:var(--ds-state-info-bg)}",
]) {
  assert.ok(styles.includes(selector), "Ratings must use shared semantic state tokens: " + selector);
}
assert.ok(styles.includes("--surface-soft:var(--ds-color-surface-subtle);--surface-panel:var(--ds-color-surface-panel);--progress-track:var(--ds-color-progress-track);"), "Legacy surface aliases must resolve through semantic tokens");
assert.ok(designSystem.includes("--ds-color-surface-subtle: light-dark(#F1EDE6, #292724);"), "Subtle surface must resolve through a shared light-dark semantic token");
assert.ok(designSystem.includes("--ds-color-surface-elevated: light-dark(#FFFDF8, #2B2824);"), "Elevated surface must resolve through a shared light-dark semantic token");
assert.ok(designSystem.includes("--ds-color-progress-track: light-dark(#E9E3D8, #35312C);"), "Progress track must resolve from the semantic token in both themes");
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
assert.ok(styles.includes(':root[data-theme="dark"]{color-scheme:dark;}'), "Manual Dark must explicitly resolve the dark color scheme");
assert.ok(designSystem.includes("--ds-color-canvas: light-dark(var(--ds-brand-rice-paper), #171614);"), "Canvas must resolve from semantic light/dark tokens");
assert.ok(designSystem.includes("--ds-color-progress-track: light-dark(#E9E3D8, #35312C);"));
assert.ok(styles.includes("background:radial-gradient(circle at 8% 6%,rgba(184,74,56,.05),transparent 24rem),var(--washi);color:var(--sumi)"));
assert.equal(styles.includes(':root[data-theme="dark"] :root[data-theme="dark"] .progress'), false, "Broken double-root progress selector must not return");
assert.equal(styles.includes("@media(prefers-color-scheme:dark){#kanji5-account-launcher"), false, "Account launcher OS-dark styling must not override a manually selected Light theme");
assert.ok(styles.includes(':root[data-theme="system"] #kanji5-account-launcher'));

// Theme-aware semantic colors are used for error text and destructive indicators.
assert.ok(designSystem.includes("--ds-state-danger-text: light-dark(#8E3026, #FF9B91);"));
assert.ok(designSystem.includes("--ds-state-danger-bg: light-dark(#F8ECE8, #332724);"));
assert.ok(styles.includes(".account-error{margin:12px 0 0;color:var(--color-danger)"));
assert.ok(styles.includes(".sync-error{color:var(--color-danger)"));
assert.ok(styles.includes(".account-sync-badge.sync-error{color:var(--color-danger)"));
assert.ok(styles.includes(".badge-red{border-color:color-mix(in srgb,var(--color-danger) 35%,var(--line));color:var(--color-danger)"));
assert.ok(dictionary.includes(".placement-option.wrong{border-color:color-mix(in srgb,var(--ds-state-danger-text) 42%,var(--ds-color-border));background:color-mix(in srgb,var(--ds-state-danger-text) 7%,var(--paper));"), "Dictionary wrong-answer state must use shared semantic danger tokens");
assert.ok(dictionary.includes(":root[data-theme=\"dark\"] .dictionary-card-dialog .dialog-close"), "Dictionary close control needs a manual-Dark foreground override");
assert.ok(dictionary.includes(":root[data-theme=\"system\"] .dictionary-card-dialog .dialog-close"), "Dictionary close control needs a System-Dark foreground override");
assert.ok(dictionary.includes("color: var(--sumi);"), "Dictionary close control must use the resolved high-contrast ink token");
assert.ok(dictionary.includes(".handwriting-result.retry{border-color:color-mix(in srgb,var(--ds-state-danger-text) 42%,var(--ds-color-border))"), "Dictionary handwriting retry state must use shared semantic danger tokens");

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
assert.ok(contrast("#8E3026", "#FDFBF7") >= 4.5, "Light semantic danger text must meet WCAG AA contrast");
assert.ok(contrast("#FF9B91", "#23211E") >= 4.5, "Dark semantic danger text must meet WCAG AA contrast");
assert.ok(contrast("#171614", "#E06A5F") >= 4.5, "Dark primary action text must meet WCAG AA contrast");
assert.ok(contrast("#171614", "#E47C72") >= 4.5, "Dark primary hover text must meet WCAG AA contrast");
assert.ok(contrast("#FF9B91", "#171614") >= 3, "Dark semantic focus ring must meet the 3:1 non-text contrast target against the app canvas");


assert.ok(designSystem.includes("--ds-color-surface-elevated: light-dark(#FFFDF8, #2B2824);"), "Elevated surfaces must resolve to a dark semantic surface in Dark mode");
const manualDarkStart = styles.indexOf(':root[data-theme="dark"]{');
const manualLightStart = styles.indexOf(':root[data-theme="light"]{', manualDarkStart);
const manualDark = styles.slice(manualDarkStart, manualLightStart);
assert.ok(styles.includes("--color-surface-elevated:var(--ds-color-surface-elevated);"), "Manual Dark must consume the shared elevated surface token");
assert.ok(styles.includes("--skeleton-base:var(--ds-color-skeleton-base);"), "Manual Dark must consume shared loading tokens");
assert.ok(styles.includes(".button.primary{background:var(--ai);border-color:var(--ai);color:var(--ds-color-action-primary-text)}"), "Primary buttons must consume semantic action and foreground tokens");
assert.ok(designSystem.includes("--ds-color-action-primary-text: light-dark(#FDFBF7, #171614);"), "Primary action foreground must meet contrast in both themes");
assert.ok(styles.includes(".button.primary:hover:not(:disabled){background:var(--ds-color-action-primary-hover);border-color:var(--ds-color-action-primary-hover)}"), "Primary hover state must use the semantic action-hover token");
assert.ok(designSystem.includes("--ds-focus-ring: light-dark(#505F83, #FF9B91);"), "Keyboard focus must use the shared theme-aware focus token");
assert.ok(designSystem.includes("--ds-focus-offset: 3px;"), "Keyboard focus offset must be defined centrally");

assert.ok(designSystem.includes("--ds-color-action-primary-hover: light-dark(#424F70, #E47C72);"), "Primary hover color must be theme-aware");
assert.ok(designSystem.includes("--ds-focus-ring: light-dark(#505F83, #FF9B91);"), "Audio focus must share the theme-aware focus color");
assert.ok(designSystem.includes("--ds-focus-offset: 3px;"), "System Dark audio focus must retain the shared offset");
assert.equal(styles.includes(':root[data-theme="light"] .button.primary{background:var(--shu);'), false, "Dark brand-red primary rules must not leak into manual Light");
assert.ok(topic.includes(':root[data-theme="dark"] .topic-learning-search:focus-within { outline-color: color-mix(in srgb, var(--shu) 72%, #fff); }'), "Manual Dark topic search must have a visible focus ring");
assert.ok(topic.includes(':root[data-theme="system"] .topic-learning-search:focus-within { outline-color: color-mix(in srgb, var(--shu) 72%, #fff); }'), "System Dark topic search must have a visible focus ring");
assert.ok(styles.includes(':root[data-theme="dark"] :is(.badge,.audio-button,.button:not(.primary):not(.rating),.pager-button,.settings-language-button){background:var(--ds-color-surface-subtle);color:var(--ds-color-text-primary);}'), "Manual Dark neutral controls must use semantic surface and text tokens");
assert.ok(designSystem.includes("--ds-color-skeleton-base: light-dark(#EEE7DA, #292724);"), "Dark loading placeholders must use semantic tokens");
assert.ok(styles.includes("background:linear-gradient(90deg,var(--skeleton-base) 20%,var(--skeleton-highlight) 40%,var(--skeleton-base) 60%)"), "Loading shimmer must use theme-aware tokens");
assert.ok(styles.includes(".app-shell .rating-again{color:var(--ds-state-danger-text);border-color:var(--ds-state-danger-border);background:var(--ds-state-danger-bg)}"), "Again feedback must use semantic danger tokens");
for (const theme of ["dark", "system"]) {
  const neutralRule = `:root[data-theme="${theme}"] :is(.badge,.audio-button,.button:not(.primary):not(.rating),.pager-button,.settings-language-button){background:var(--ds-color-surface-subtle);color:var(--ds-color-text-primary);}`;
  assert.ok(styles.includes(neutralRule), `${theme} neutral button rule must use shared surface/text tokens without overriding semantic rating buttons`);
  if (theme === "dark") {
    for (const rating of ["again", "hard", "good", "easy"]) {
      assert.equal(
        styles.includes(`:root[data-theme="dark"] .rating-${rating}{background:#`),
        false,
        `Manual Dark ${rating} rating must not bypass shared semantic state tokens with fixed colors`
      );
    }
  } else {
    assert.ok(systemDark.includes(':root[data-theme="system"]{color-scheme:dark;}'), "System + OS Dark must resolve the semantic color-scheme");
    assert.ok(styles.includes(".app-shell .rating-again{color:var(--ds-state-danger-text);border-color:var(--ds-state-danger-border);background:var(--ds-state-danger-bg)}"), "System Dark Again rating must use shared semantic state tokens");
    assert.ok(styles.includes(".app-shell .rating-hard{color:var(--ds-state-warning-text);border-color:var(--ds-state-warning-border);background:var(--ds-state-warning-bg)}"), "System Dark Hard rating must use shared semantic state tokens");
    assert.ok(styles.includes(".app-shell .rating-good{color:var(--ds-state-success-text);border-color:var(--ds-state-success-border);background:var(--ds-state-success-bg)}"), "System Dark Good rating must use shared semantic state tokens");
    assert.ok(styles.includes(".app-shell .rating-easy{color:var(--ds-state-info-text);border-color:var(--ds-state-info-border);background:var(--ds-state-info-bg)}"), "System Dark Easy rating must use shared semantic state tokens");
    assert.ok(designSystem.includes("--ds-state-danger-text: light-dark(#8E3026, #FF9B91);"), "System Dark Again text must resolve through the dark semantic token");
    assert.ok(designSystem.includes("--ds-state-warning-text: light-dark(#76510A, #E9C46A);"), "System Dark Hard text must resolve through the dark semantic token");
    assert.ok(designSystem.includes("--ds-state-success-text: light-dark(#43582B, #B9D49A);"), "System Dark Good text must resolve through the dark semantic token");
    assert.ok(designSystem.includes("--ds-state-info-text: light-dark(#314B6F, #A9C1ED);"), "System Dark Easy text must resolve through the dark semantic token");
  }
}
assert.ok(topic.includes(".topic-learning-focus-option.active { border-color: var(--ai); background: var(--ai); color: var(--paper); }"), "Selected focus option needs a high-contrast Light-mode foreground");
assert.ok(topic.includes(':root[data-theme="dark"] .topic-learning-focus-option.active { color: #171614; }'), "Manual Dark focus foreground must remain dark on the light indigo surface");
assert.ok(topic.includes(':root[data-theme="system"] .topic-learning-focus-option.active { color: #171614; }'), "System Dark focus foreground must remain dark on the light indigo surface");
assert.ok(topic.includes(':root[data-theme="dark"] .topic-learning-focus-option.active { color: #171614; }'), "Dark selected focus option foreground must be explicit");


// Learning Card rating controls must consume the same theme-aware semantic
// state roles as the rest of the application; legacy color-mix aliases would
// override the shared palette because this stylesheet is injected after styles.css.
for (const [rating, state] of [
  ["again", "danger"],
  ["hard", "warning"],
  ["good", "success"],
  ["easy", "info"],
]) {
  const rule = `.learning-card-back .rating-${rating}{color:var(--ds-state-${state}-text);border:1px solid var(--ds-state-${state}-border);background:var(--ds-state-${state}-bg)}`;
  assert.ok(learningSurface.includes(rule), "Learning Card " + rating + " must use the shared theme-aware semantic state tokens");
}

console.log("Dark-theme parity contract passed.");
