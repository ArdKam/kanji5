import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const allScripts=(await readdir(path.join(root,'scripts')))
  .filter(name=>/^test-.*\.mjs$/.test(name)&&name!=='test-all.mjs')
  .sort();

// Historical probes target retired presentation contracts and are intentionally
// not part of the authoritative root suite. Keep this list explicit.

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

// Build-dependent presentation tests are run by the React presentation workflow
// after the frontend has produced a fresh React distribution.
const buildDependentTests=new Set([
  'test-react-shipped-artifact.mjs',
  'test-v2-p3-accessibility.mjs',
  'test-v2-p4-visual.mjs',
  'test-v2-v18-parity.mjs',
  'test-service-worker-shell.mjs',
]);

const scripts=allScripts.filter(name=>!retiredTests.has(name)&&!buildDependentTests.has(name));


if(!scripts.length)throw new Error('No scripts/test-*.mjs files found');
console.log(`Running ${scripts.length} source/contract unit tests...`);
console.log(`Build-dependent presentation tests are run separately: ${[...buildDependentTests].join(', ')}`);

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

console.log(`\nAll ${scripts.length} scripts/test-*.mjs tests passed.`);
