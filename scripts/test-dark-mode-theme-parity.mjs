import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const styles = await read("frontend/src/styles.css");
const designSystem = await read("frontend/src/design-system.css");
const app = await read("frontend/src/app/App.tsx");
const onboarding = await read("frontend/src/app/onboarding/OnboardingFlow.tsx");
const dictionary = await read("frontend/src/app/dictionary.css");
const topic = await read("frontend/src/app/topic-learning.css");
const themeBootstrap = await read("theme-bootstrap.js");

function linearChannel(value) {
  const channel = Number.parseInt(value, 16) / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}
function luminance(hex) {
  const channels = hex.slice(1).match(/.{2}/g).map(linearChannel);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
function contrast(foreground, background) {
  const pair = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (pair[0] + 0.05) / (pair[1] + 0.05);
}

// One semantic source owns theme-dependent colors; legacy aliases must delegate to it.
for (const token of [
  "--ds-color-canvas: light-dark(var(--ds-brand-rice-paper), #171614);",
  "--ds-color-surface: light-dark(var(--ds-brand-surface), #23211E);",
  "--ds-color-text-muted: light-dark(#62666A, #B8AFA2);",
  "--ds-color-action-primary: light-dark(var(--ds-brand-indigo), #E06A5F);",
  "--ds-color-action-primary-text: light-dark(#FDFBF7, #171614);",
  "--ds-color-progress-track: light-dark(#E9E3D8, #35312C);",
  "--ds-color-surface-elevated: light-dark(#FFFDF8, #2B2824);",
  "--ds-color-skeleton-base: light-dark(#EEE7DA, #292724);",
  "--ds-state-danger-text: light-dark(#8E3026, #FF9B91);",
]) assert.ok(designSystem.includes(token), `semantic theme token missing: ${token}`);

assert.ok(styles.includes("--washi:var(--ds-color-canvas);--paper:var(--ds-color-surface);--sumi:var(--ds-color-text-primary);--ink:var(--ds-color-text-secondary);--mute:var(--ds-color-text-muted);"), "global compatibility variables must alias shared semantic tokens");
assert.ok(styles.includes("--color-danger:var(--ds-state-danger-text);"), "danger text must use the theme-aware semantic state role");
assert.ok(styles.includes("--color-surface-elevated:var(--ds-color-surface-elevated)"), "elevated surfaces must use a shared theme-aware token");
assert.ok(styles.includes("--skeleton-base:var(--ds-color-skeleton-base)"), "skeleton colors must use shared theme-aware tokens");
assert.ok(onboarding.includes("--paper:var(--ds-color-canvas)") && onboarding.includes("--ink:var(--ds-color-text-primary)") && onboarding.includes("--mute:var(--ds-color-text-muted)"), "onboarding must use the same semantic canvas, ink and muted-text roles");

// Validate actual role colors; text roles target WCAG AA (4.5:1).
assert.ok(contrast("#62666A", "#EEE9E0") >= 4.5, "Light muted text must meet WCAG AA on the secondary surface");
assert.ok(contrast("#B8AFA2", "#23211E") >= 4.5, "Dark muted text must meet WCAG AA on the dark surface");
assert.ok(contrast("#8E3026", "#FDFBF7") >= 4.5, "Light error text must meet WCAG AA contrast");
assert.ok(contrast("#FF9B91", "#23211E") >= 4.5, "Dark error text must meet WCAG AA contrast");
assert.ok(contrast("#FDFBF7", "#505F83") >= 4.5, "Light primary action text must meet WCAG AA contrast");
assert.ok(contrast("#171614", "#E06A5F") >= 4.5, "Dark primary action text must meet WCAG AA contrast");

// Rating options keep a stable physical order while every outcome uses semantic pairs.
assert.ok(styles.includes(".rating-grid{direction:ltr;display:grid;"), "Rating grid must keep stable left-to-right physical order");
assert.ok(app.includes('const ratingOptions=()=>[["Again",t("again")],["Hard",t("hard")],["Good",t("good")],["Easy",t("easy")]] as const;'), "Rating choices must be ordered hardest-to-easiest in the DOM");
assert.ok(app.includes('dir={getLanguage()==="fa"?"rtl":"ltr"}'), "Rating labels must retain their language direction");
assert.ok(app.includes('<bdi lang="ja" dir="ltr">'), "Learning-card Japanese readings must be isolated from surrounding RTL text");
for (const rating of ["again", "hard", "good", "easy"]) {
  assert.ok(designSystem.includes(`.app-shell .rating.rating-${rating} {`), `${rating} rating must have a semantic rule`);
  assert.ok(designSystem.includes(`color: var(--ds-review-${rating}-text);`), `${rating} rating must use its semantic foreground role`);
  assert.ok(designSystem.includes(`background: var(--ds-review-${rating}-bg);`), `${rating} rating must use its semantic background role`);
  assert.ok(designSystem.includes(`border: 1px solid var(--ds-review-${rating}-border);`), `${rating} rating must use its semantic border role`);
}
for (const [foreground, background] of [
  ["#8E3026", "#F8ECE8"], ["#FF9B91", "#332724"],
  ["#76510A", "#FAF0D9"], ["#E9C46A", "#332F27"],
  ["#43582B", "#EDF2E7"], ["#B9D49A", "#283128"],
  ["#314B6F", "#ECF1F8"], ["#A9C1ED", "#27303B"],
]) assert.ok(contrast(foreground, background) >= 4.5, `Review outcome ${foreground} on ${background} must meet WCAG AA`);

// System-mode onboarding selectors are cloned from Dark, scoped to OS Dark only.
assert.ok(themeBootstrap.includes('const systemRules=darkRules.replaceAll(\':root[data-theme="dark"]\', \':root[data-theme="system"]\');'), "System theme should clone the Dark onboarding rules");
assert.ok(themeBootstrap.includes("style.textContent=darkRules+'@media(prefers-color-scheme:dark){'+systemRules+'}';"), "System onboarding overrides must only apply under the OS dark query");
assert.equal(themeBootstrap.includes(':root:is([data-theme="dark"],[data-theme="system"])'), false, "System onboarding selectors must not darken System-Light mode");
for (const selector of [
  ':root[data-theme="dark"] .dictionary-card-dialog .dialog-close',
  ':root[data-theme="system"] .dictionary-card-dialog .dialog-close',
]) assert.ok(dictionary.includes(selector), "Dictionary close control must retain explicit theme coverage: " + selector);
for (const selector of [
  ':root[data-theme="dark"] .topic-learning-search:focus-within',
  ':root[data-theme="system"] .topic-learning-search:focus-within',
]) assert.ok(topic.includes(selector), "Topic search must retain explicit theme-aware focus coverage: " + selector);

// Navigation, focus and reduced-motion behavior remain connected to the semantic layer.
assert.ok(styles.includes("--nav-bar-height:var(--ds-layout-nav-height);"), "navigation height must use the shared layout token");
assert.ok(designSystem.includes("--ds-layout-nav-height: 66px;"), "semantic navigation height must preserve the 66px interaction layout");
assert.ok(designSystem.includes("outline: 3px solid var(--ds-focus-ring);"), "keyboard focus must use the semantic focus role");
assert.ok(designSystem.includes("--ds-focus-ring: light-dark(#505F83, #FF9B91);"), "focus-ring colors must remain theme-aware");
assert.ok(designSystem.includes("@media (prefers-reduced-motion: reduce)"), "the shared layer must disable motion for reduced-motion users");
assert.ok(styles.includes("@media(prefers-reduced-motion:reduce)"), "legacy components must retain their reduced-motion fallback");
assert.ok(!styles.includes("--washi:#171614") && !styles.includes("--color-danger:#a23a2a"), "duplicate hard-coded theme variables must not return");

console.log("Dark-theme parity and semantic-token contract passed.");
