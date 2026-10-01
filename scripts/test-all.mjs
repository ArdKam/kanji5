import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const allScripts=(await readdir(path.join(root,'scripts')))
  .filter(name=>/^test-.*\.mjs$/.test(name)&&name!=='test-all.mjs')
  .sort();

// Six historical v2 probes target retired files/contracts and are intentionally
// not part of the authoritative root suite. Keep this list explicit so new
// v2 tests cannot silently disappear behind a filename-prefix exclusion.
const generatedArtifactTests=new Set([
  'test-react-shipped-artifact.mjs',
]);
for(const test of generatedArtifactTests){
  if(!allScripts.includes(test)) throw new Error(`Generated-artifact test is missing from scripts/: ${test}`);
}

const retiredTests=new Set([
  'test-v2-custom-study.mjs',
  'test-v2-lovable-visual-contract.mjs',
  'test-v2-mobile-polish.mjs',
  'test-v2-motion-contract.mjs',
  'test-v2-p6-index-boundary.mjs',
  'test-v2-stroke-order.mjs',
]);

for(const test of retiredTests){
  if(!allScripts.includes(test)) throw new Error(`Retired test is missing from scripts/: ${test}`);
}

const scripts=allScripts.filter(name=>!retiredTests.has(name)&&!generatedArtifactTests.has(name));

if(!scripts.length)throw new Error('No scripts/test-*.mjs files found');
console.log(`Running ${scripts.length} contract/unit tests...`);

const failures=[];
for(const script of scripts){
  console.log(`\n▶ ${script}`);
  const result=spawnSync(process.execPath,[path.join(root,'scripts',script)],{cwd:root,stdio:'inherit'});
  if(result.status!==0){
    failures.push({script,status:result.status,signal:result.signal});
    console.error(`✗ ${script}`);
  }else{
    console.log(`✓ ${script}`);
  }
}

if(failures.length){
  console.error(`\n${failures.length} test(s) failed:`);
  for(const failure of failures)console.error(`- ${failure.script}: status=${failure.status??'null'} signal=${failure.signal??'none'}`);
  process.exit(1);
}

console.log(`\nAll ${scripts.length} source contract/unit tests passed.`);

console.log('Generated-artifact tests are executed by the React build workflow after a fresh build.');
