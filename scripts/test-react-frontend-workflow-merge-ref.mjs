import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/react-frontend.yml', import.meta.url), 'utf8');
const checkout = workflow.match(/- uses: actions\/checkout@v4([\s\S]*?)(?=\n\s+- name:|\n\s+- uses:|$)/);
assert.ok(checkout, 'React CI must check out a source revision');
assert.doesNotMatch(checkout[1], /ref:\s*\$\{\{\s*github\.head_ref\s*\|\|\s*github\.ref_name\s*\}\}/, 'PR CI must not force-checkout the head branch and skip current-base integration');
assert.match(workflow, /synthetic\s*\n\s*# PR merge commit/i, 'workflow must document why the default PR merge ref is used');

console.log('React CI PR merge-ref integration contract: PASS');