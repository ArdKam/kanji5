import assert from "node:assert/strict";
import {deriveHandwritingPrompt} from "../frontend/src/app/handwriting-prompts.js";
assert.deepEqual(deriveHandwritingPrompt({mode:"meaning",stimulus:{kind:"meaning",primary:"study"},character:"学"}),{kind:"meaning",cue:"study"});
assert.deepEqual(deriveHandwritingPrompt({mode:"reading",stimulus:{kind:"reading",primary:"がく"},character:"学"}),{kind:"reading",cue:"がく"});
assert.deepEqual(deriveHandwritingPrompt({mode:"vocabulary",stimulus:{kind:"masked-vocabulary",primary:"□生",secondary:"がくせい"},character:"学"}),{kind:"vocabulary",cue:"□生",secondary:"がくせい"});
assert.deepEqual(deriveHandwritingPrompt({mode:"context",stimulus:{kind:"masked-context",primary:"私は□です。",translation:"I am a student."},character:"学"}),{kind:"context",cue:"私は□です。",secondary:"I am a student."});
assert.deepEqual(deriveHandwritingPrompt({mode:"production",stimulus:{kind:"meaning",primary:"study"},character:"学"}),{kind:"production",cue:"study"});
console.log("Handwriting production prompt adapter contract passed.");
