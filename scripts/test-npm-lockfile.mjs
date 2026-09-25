import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const lock=JSON.parse(fs.readFileSync('package-lock.json','utf8'));
const workflowFiles=['build-v1.6.yml','build-v1.7.yml','build-v1.8.yml'];

assert.equal(lock.lockfileVersion,3,'package-lock.json must use lockfileVersion 3');
assert.equal(lock.name,pkg.name);
assert.equal(lock.version,pkg.version);
assert.deepEqual(lock.packages?.['']?.devDependencies,pkg.devDependencies);
for(const [name,version] of Object.entries(pkg.devDependencies||{})){
  const nodePath='node_modules/'+name;
  assert.equal(lock.packages?.[nodePath]?.version,version,`lockfile must pin ${name} to ${version}`);
}
assert.equal(lock.packages?.['node_modules/@playwright/test']?.dependencies?.playwright,'1.59.0');
assert.equal(lock.packages?.['node_modules/playwright']?.dependencies?.['playwright-core'],'1.59.0');

for(const file of workflowFiles){
  const workflow=fs.readFileSync('.github/workflows/'+file,'utf8');
  assert.match(workflow,/npm ci/,`${file} must use npm ci for root dependencies`);
  const rootInstallBlocks=[...workflow.matchAll(/(?:^|\n)(?:[ \t]+)?- name: Install root dependencies[\s\S]*?(?=\n\s*- name:|\n\s*- uses:|\n\s*$)/g)].map(m=>m[0]).join('\n');
  assert.doesNotMatch(rootInstallBlocks,/npm install(?![\s\S]*package-lock-only)/,`${file} must not replace root npm ci with npm install`);
}
console.log('Kanji 5 npm lockfile contract passed.');
