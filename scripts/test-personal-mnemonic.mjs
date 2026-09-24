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
const saved = state.readMnemonics();
if (saved["学"] !== "A student studying under a roof.") throw new Error("Saved mnemonic was not readable");
if (state.readKnowledge().v19LearnerEvidence?.["学"]?.[0]?.mode !== "meaning") throw new Error("Mnemonic write overwrote learner evidence");

if (!state.writeMnemonics({ "学": "A different study image." })) throw new Error("Could not replace mnemonic");
if (state.readMnemonics()["学"] !== "A different study image.") throw new Error("Mnemonic replacement failed");

if (!state.writeMnemonics({})) throw new Error("Could not clear mnemonic namespace");
if (Object.keys(state.readMnemonics()).length !== 0) throw new Error("Mnemonic clear failed");

const boundarySource = await readFile(new URL("../v1.9-v2-boundary.js", import.meta.url), "utf8");
if (!boundarySource.includes("async function getMnemonic(character)")) throw new Error("Boundary getMnemonic implementation missing");
if (!boundarySource.includes("async function saveMnemonic(character,value)")) throw new Error("Boundary saveMnemonic implementation missing");
if (!boundarySource.includes("getMnemonic,saveMnemonic")) throw new Error("Mnemonic methods were not exported through the boundary");

console.log("Personal mnemonic persistence and boundary contracts passed.");
