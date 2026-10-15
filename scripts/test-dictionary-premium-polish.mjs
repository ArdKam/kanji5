import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, card, i18n, app, main, dictionaryPageCss] = await Promise.all([
  readFile(new URL("../frontend/src/app/DictionaryPage.tsx", import.meta.url), "utf8"),
  readFile(new URL("../frontend/src/app/DictionaryKanjiCard.tsx", import.meta.url), "utf8"),
  readFile(new URL("../frontend/src/app/i18n.ts", import.meta.url), "utf8"),
  readFile(new URL("../frontend/src/app/App.tsx", import.meta.url), "utf8"),
  readFile(new URL("../frontend/src/main.tsx", import.meta.url), "utf8"),
  readFile(new URL("../frontend/src/app/dictionary-page.css", import.meta.url), "utf8"),
]);

assert.doesNotMatch(page, /dictionary-polish\.css/, "Dictionary styling must not add a separate CSS bundle");
assert.match(page, /dictionary-active-filters/, "Filtered and searched states need a visible summary");
assert.match(page, /dictionary-clear-all-filters/, "The user needs a one-action filter reset");
assert.match(page, /dictionary-mastery-legend/, "Kanji mastery colors need an explicit legend");
assert.match(page, /TOPIC_GROUPS/, "The topic browser must use an explicit display grouping without changing memberships");
assert.match(page, /className="[^"]*dictionary-topic-dialog"/, "Dictionary topics need a dedicated browseable selector");
assert.match(app, /import\("\.\/dictionary-page\.css\?inline"\)/, "Dictionary-only page styles should load with the lazy route");
assert.match(main, /import "\.\/app\/dictionary\.css"/, "Shared Dictionary card and Reading Lab styles must remain available on initial load");
assert.match(page, /data-topic-id={entry.id}/, "Every reviewed taxonomy ID must remain selectable");
assert.match(page, /aria-pressed={topic === entry.id}/, "The selected topic must be exposed to assistive technology");
assert.match(page, /onCancel=\{\(event\) => \{ event\.preventDefault\(\); closeTopicPicker\(\); \}\}/, "Escape must dismiss the topic picker predictably");
assert.match(page, /topicPickerTriggerRef\.current\?\.focus\(\)/, "Closing the topic picker must restore trigger focus");
assert.match(page, /t\("dictionaryTopicCoverageNote", language\)/, "Taxonomy coverage caveat belongs inside the topic picker");
assert.match(i18n, /dictionaryTopicCoverageNote:"Topics use reviewed labels; unlabelled kanji remain available under All topics and in general dictionary search\./, "English topic coverage copy must explain All topics and general search");
assert.match(i18n, /dictionaryTopicCoverageNote:"موضوع‌ها بر پایهٔ برچسب‌گذاری بازبینی‌شده‌اند/, "Persian topic coverage copy must explain reviewed labels and general search");
assert.doesNotMatch(page, /dictionary-search-hint/, "Remove the repetitive permanent subtitle beneath dictionary search");
assert.doesNotMatch(page, /<select aria-label=\{language === "fa" \? "موضوع" : "Topic"\} value=\{topic\}/, "Topic selection must not fall back to a plain select");
assert.match(page, /className="dictionary-view-label"/, "Both view modes must have visible names");
assert.match(page, /"var\(--matcha\)"/, "Mastered state needs a consistent semantic color");
assert.match(page, /"var\(--sakura\)"/, "Needs-attention state needs a distinct semantic color");
assert.match(page, /height: "2px"/, "Mastery should use a restrained indicator rather than filling whole tiles");
assert.ok(page.includes("const renderedItems = useMemo("), "Keyboard grid should use the actual currently rendered items");
assert.ok(page.includes("const dictionaryRows = useMemo("), "Kanji tiles need explicit responsive row grouping");
assert.match(page, /role="grid"/, "Kanji matrix needs an accessible grid role");
assert.match(page, /role="gridcell"/, "Kanji matrix cells must expose row/column semantics");
assert.ok(page.includes("tabIndex={activeFocusCharacter === item.character ? 0 : -1}"), "Kanji grid must use roving tabindex");
assert.match(page, /"ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"/, "Keyboard navigation must cover arrows and Home/End");
assert.ok(page.includes("formatNumber(Number(value), language)"), "Grade values must be localized in Persian and English");
assert.ok(dictionaryPageCss.includes(".kanji-catalog-row{\n  display:grid;"), "Lazy Dictionary styles must render each ARIA row as a visual row");
assert.ok(dictionaryPageCss.includes(".kanji-catalog-cell{min-width:0;}"), "Grid cells must be shrinkable at narrow viewports");
assert.match(page, /<svg viewBox="0 0 24 24"/, "Search affordance should use vector iconography");
assert.match(card, /if \(key === "structure"\) return "Structure";/, "Use a clear English label for the structure section");
assert.match(card, /if \(key === "structure"\) return "ساختار";/, "Use a clear Persian label for the structure section");
assert.doesNotMatch(card, /dictionary-card-jlpt badge badge-red/, "JLPT is educational metadata, not an error state");
assert.match(card, /dictionary-card-nav-previous[^>]*style=\{\{ width: 44/, "Previous navigation should have a touch-safe target");
assert.match(card, /dictionary-card-nav-next[^>]*style=\{\{ width: 44/, "Next navigation should have a touch-safe target");
assert.match(card, /className="dialog-close" style=\{\{ width: 44/, "Card close control should have a touch-safe target");
assert.match(card, /style=\{\{ height: isNarrowViewport \? "min\(790px/, "Mobile card height should be constrained without a CSS budget increase");
assert.match(card, /dictionary-stroke-order-heading/, "Stroke order must have a visible section heading");
assert.match(card, /dictionary-overview-meaning" dir="auto" style=\{\{ margin: 0, padding: 0, border: 0/, "Meaning should not be trapped in a redundant nested card");
assert.match(card, /style=\{\{ minHeight: 44/, "Card tabs must retain touch-safe height");
assert.match(card, /matchMedia\("\(max-width: 640px\)"\)/, "Card layout must adapt to narrow viewports");

console.log("Dictionary premium polish and control-bar contracts passed.");
