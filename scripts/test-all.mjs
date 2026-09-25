import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const scripts=(await readdir(path.join(root,'scripts')))
  .filter(name=>/^test-.*\.mjs$/.test(name)&&name!=='test-all.mjs'&&!name.startsWith('test-v2-'))
  .sort();

if(!scripts.length)throw new Error('No scripts/test-*.mjs files found');

const shippedReactJs=path.join(root,'react-dist','kanji5-react.js');
if(!fs.existsSync(shippedReactJs)){
  console.log('React shipped artifact is missing; building frontend before contract tests...');
  const npmCommand=process.platform==='win32'?'npm.cmd':'npm';
  const build=spawnSync(npmCommand,['run','build'],{cwd:path.join(root,'frontend'),stdio:'inherit'});
  if(build.status!==0)throw new Error('React shipped artifact build failed before contract tests');
}
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

console.log(`\nAll ${scripts.length} scripts/test-*.mjs tests passed.`);
