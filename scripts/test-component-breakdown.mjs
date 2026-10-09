import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../frontend/src/app/ComponentBreakdown.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../frontend/src/app/component-breakdown.css", import.meta.url), "utf8");

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(source.includes('import type { VisualStructureInfo, VisualStructureNode } from "./engine";'), "ComponentBreakdown must consume the source-authored visual structure contract");
assert(source.includes("if (!info.available || !info.root || !info.components.length) return null;"), "Unavailable or atomic structure must not render a misleading decomposition");
assert(source.includes('className="component-breakdown"'), "Component root class missing");
assert(source.includes('role="list"'), "Component list semantics missing");
assert(source.includes('role="listitem"'), "Component list item semantics missing");
assert(source.includes('component.components.map((child, index) => renderComponent(child, path + "." + index, language))'), "Nested structural hierarchy must be rendered recursively");
assert(source.includes('component.variant ? "component-breakdown-part is-variant"'), "Source variant forms must remain distinguishable");
assert(source.includes("component.position"), "Source-authored component position must be retained in the presentation");
assert(source.includes('lang="ja"'), "Japanese language semantics missing");
assert(!/localStorage|sessionStorage|fetch\(|__KANJI5_|v1\.9-|planner|learner/i.test(source), "Presentation component must not access engine or persistence internals");
for (const selector of [".component-breakdown", ".component-breakdown-target", ".component-breakdown-part", ".component-breakdown-plus", ".component-breakdown-subparts"]) {
  assert(css.includes(selector), `Missing style selector: ${selector}`);
}

console.log("Kanji visual structure breakdown component contract passed.");
