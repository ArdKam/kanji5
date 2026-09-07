import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = path => fs.readFileSync(path, 'utf8');
const index = read('index.html');
const p0 = read('v1.5-p0.js');
const recallCore = read('v1.5-recall-core.js');
const state = read('v1.5-state.js');
const sw = read('sw.js');
const workflow = read('.github/workflows/build-v1.6.yml');
const core = read('v1.4-education-core.js');
const ui = read('v1.5-education-ui.js');
const runtime = read('v1.2-runtime-fixes.js');
const supabase = read('supabase-sync.js');
const fsrsSync = read('v1.5-fsrs-sync-core.js');
