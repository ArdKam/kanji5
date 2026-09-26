import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../frontend/src/app/ComponentBreakdown.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../frontend/src/app/component-breakdown.css", import.meta.url), "utf8");

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(source.includes('import type { ComponentInfo } from "./engine";'), "ComponentBreakdown must consume the typed component contract");
assert(source.includes('if (!info.available || !info.components.length) return null;'), "Unavailable component data must not render misleading UI");
assert(source.includes('className="component-breakdown"'), "Component root class missing");
assert(source.includes('role="list"'), "Component list semantics missing");
assert(source.includes("component-breakdown-radical"), "Canonical radical presentation missing");
assert(source.includes('role="listitem"'), "Component list item semantics missing");
assert(source.includes('lang="ja"'), "Japanese language semantics missing");
assert(!/localStorage|sessionStorage|fetch\(|__KANJI5_|v1\.9-|planner|learner/i.test(source), "Presentation component must not access engine or persistence internals");
for (const selector of [".component-breakdown", ".component-breakdown-target", ".component-breakdown-part", ".component-breakdown-plus"]) {
  assert(css.includes(selector), `Missing style selector: ${selector}`);
}

console.log("Kanji component breakdown component contract passed.");
