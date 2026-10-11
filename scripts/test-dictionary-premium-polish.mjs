import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, card] = await Promise.all([
  readFile(new URL("../frontend/src/app/DictionaryPage.tsx", import.meta.url), "utf8"),
  readFile(new URL("../frontend/src/app/DictionaryKanjiCard.tsx", import.meta.url), "utf8"),
]);

assert.doesNotMatch(page, /dictionary-polish\.css/, "Dictionary styling must not add a separate CSS bundle");
assert.match(page, /dictionary-active-filters/, "Filtered and searched states need a visible summary");
assert.match(page, /dictionary-clear-all-filters/, "The user needs a one-action filter reset");
assert.match(page, /dictionary-mastery-legend/, "Kanji mastery colors need an explicit legend");
assert.match(page, /"var\(--matcha\)"/, "Mastered state needs a consistent semantic color");
assert.match(page, /"var\(--sakura\)"/, "Needs-attention state needs a distinct semantic color");
assert.match(page, /height: "2px"/, "Mastery should use a restrained indicator rather than filling whole tiles");
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

console.log("Dictionary premium polish contract passed.");
