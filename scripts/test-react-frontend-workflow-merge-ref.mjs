import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/react-frontend.yml', import.meta.url), 'utf8');
const checkouts = [...workflow.matchAll(/- uses: actions\/checkout@v4([\s\S]*?)(?=\n\s+- name:|\n\s+- uses:|$)/g)];
assert.equal(checkouts.length, 2, 'both React build and WebKit jobs must use the expected checkout action');
for (const [index, checkout] of checkouts.entries()) {
  assert.doesNotMatch(checkout[1], /ref:\s*\$\{\{\s*github\.head_ref\s*\|\|\s*github\.ref_name\s*\}\}/, `checkout ${index + 1} must not force-checkout the PR head and skip current-base integration`);
}
assert.match(workflow, /synthetic\s*\n\s*# PR merge commit/i, 'workflow must document why the default PR merge ref is used');
assert.match(workflow, /synthetic PR merge commit here too/i, 'WebKit CI must explicitly use the same integrated revision');

console.log('React CI PR merge-ref integration contract: PASS');
