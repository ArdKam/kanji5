import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const lock=JSON.parse(fs.readFileSync('package-lock.json','utf8'));
const workflowFiles=['build-v1.8.yml','handwriting.yml','react-frontend.yml','pages-deploy.yml'];

const frontendPkg=JSON.parse(fs.readFileSync('frontend/package.json','utf8'));
const frontendLock=JSON.parse(fs.readFileSync('frontend/package-lock.json','utf8'));
const frontendRoot=frontendLock.packages?.[''];

assert.equal(frontendLock.lockfileVersion,3,'frontend/package-lock.json must use lockfileVersion 3');
assert.equal(frontendLock.name,frontendPkg.name);
assert.equal(frontendLock.version,frontendPkg.version);
assert.deepEqual(frontendRoot?.dependencies,frontendPkg.dependencies);
assert.deepEqual(frontendRoot?.devDependencies,frontendPkg.devDependencies);
for(const [name,version] of Object.entries(frontendPkg.dependencies||{})){
  const nodePath='node_modules/'+name;
  assert.equal(frontendLock.packages?.[nodePath]?.version,version,`frontend lockfile must pin ${name} to ${version}`);
}
for(const [name,version] of Object.entries(frontendPkg.devDependencies||{})){
  const nodePath='node_modules/'+name;
  assert.equal(frontendLock.packages?.[nodePath]?.version,version,`frontend lockfile must pin ${name} to ${version}`);
}
assert.equal(frontendLock.packages?.['node_modules/baseline-browser-mapping']?.version,'2.11.26','frontend lockfile must honor the deterministic baseline-browser-mapping override');
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
  assert.match(workflow,/npm ci/,`${file} must use npm ci`);
  assert.doesNotMatch(workflow,/npm install(?![\s\S]*package-lock-only)/,`${file} must not install dependencies with npm install`);
}

console.log('Kanji 5 npm lockfile contract passed.');
