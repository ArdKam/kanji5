import assert from 'node:assert/strict';
import fs from 'node:fs';
const core=fs.readFileSync('v1.9-adaptive-planner-core.js','utf8');
const runtime=fs.readFileSync('v1.9-adaptive-planner.js','utf8');
const learner=fs.readFileSync('v1.9-learner-model.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
assert.match(core,/export function buildPlan/);assert.match(core,/export function nextTask/);assert.match(core,/BEHAVIORS/);assert.match(core,/repair/);assert.match(core,/reinforce/);assert.match(core,/recover/);assert.match(core,/maintain/);assert.match(core,/explore/);assert.match(runtime,/__KANJI5_V16_SESSION_AUTH__/);assert.match(runtime,/remainingModes/);assert.match(runtime,/recentModes/);assert.match(runtime,/nextTask/);assert.match(learner,/v1\.9-adaptive-planner\.js/);assert.match(sw,/v1\.9-adaptive-planner-core\.js/);assert.match(sw,/v1\.9-adaptive-planner\.js/);console.log('Kanji 5 v1.9 adaptive planner runtime wiring passed.');
