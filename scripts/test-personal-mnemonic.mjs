import { readFile } from "node:fs/promises";
import vm from "node:vm";

const stateSource = await readFile(new URL("../v1.5-state.js", import.meta.url), "utf8");
const storage = new Map();
const localStorage = {
  getItem(key){ return storage.has(key) ? storage.get(key) : null; },
  setItem(key,value){ storage.set(key,String(value)); },
  removeItem(key){ storage.delete(key); }
};

const stateSandbox = {
  window: {},
  localStorage,
  sessionStorage: { removeItem(){} },
  crypto: { randomUUID: () => "test-device" },
  structuredClone: value => JSON.parse(JSON.stringify(value)),
  Intl,
  Date,
  JSON,
  Math
};

vm.runInNewContext(stateSource, stateSandbox, { filename: "v1.5-state.js" });
const state = stateSandbox.window.__KANJI5_STATE__;
if (!state?.readMnemonics || !state?.writeMnemonics) throw new Error("Mnemonic persistence API was not published");

const originalKnowledge = { v19LearnerEvidence: { "学": [{ mode: "meaning", correct: true }] } };
if (!state.writeKnowledge(originalKnowledge)) throw new Error("Could not seed knowledge");
if (JSON.stringify(state.readMnemonics()) !== "{}") throw new Error("Mnemonic namespace should start empty");

if (!state.writeMnemonics({ "学": "A student studying under a roof." })) throw new Error("Could not write mnemonic");
if (state.readMnemonics()["学"] !== "A student studying under a roof.") throw new Error("Saved mnemonic was not readable");
if (state.readKnowledge().v19LearnerEvidence?.["学"]?.[0]?.mode !== "meaning") throw new Error("Mnemonic write overwrote learner evidence");

const boundarySource = await readFile(new URL("../v1.9-v2-boundary.js", import.meta.url), "utf8");
const stored = { "学": "A student memory hook." };
const boundarySandbox = {
  window: {
    __KANJI5_STATE__: {
      readDeck(){ return []; },
      readMnemonics(){ return { ...stored }; },
      writeMnemonics(value){ Object.keys(stored).forEach(key => delete stored[key]); Object.assign(stored, value); return true; }
    }
  },
  document: { addEventListener(){}, dispatchEvent(){} },
  CustomEvent: class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } },
  setTimeout(){},
  fetch: async () => ({ ok: false, async json(){ return {}; } })
};
vm.runInNewContext(boundarySource, boundarySandbox, { filename: "v1.9-v2-boundary.js" });
const api = boundarySandbox.window.__KANJI5_V19_V2_BOUNDARY__;
if (!api?.getMnemonic || !api?.saveMnemonic) throw new Error("Personal mnemonic boundary API missing");

const loaded = await api.getMnemonic("学");
if (loaded.character !== "学" || loaded.text !== "A student memory hook.") throw new Error("Mnemonic read failed");

const saved = await api.saveMnemonic("学", "New memory hook.");
if (saved.text !== "New memory hook." || stored["学"] !== "New memory hook.") throw new Error("Mnemonic save failed");

const cleared = await api.saveMnemonic("学", "");
if (cleared.text !== "" || Object.keys(stored).length !== 0) throw new Error("Mnemonic clear failed");

console.log("Personal mnemonic persistence and boundary contracts passed.");
