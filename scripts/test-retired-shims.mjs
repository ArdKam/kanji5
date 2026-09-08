import fs from 'node:fs';
const assert=(x,m)=>{if(!x)throw new Error(m)};
const index=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
for(const file of ['v1.4-education-ui.js','v1.6-ui-hotfix-safe.js']){
  assert(!fs.existsSync(file),`${file} must remain retired from the runtime tree`);
  assert(!index.includes(`./${file}`),`${file} must not be loaded by index.html`);
  assert(!sw.includes(`./${file}`),`${file} must not be precached by sw.js`);
}
assert(!index.includes('__KANJI5_EDU_UI_V1_4__'),'Legacy v1.4 UI marker must not be restored');
console.log('Kanji 5 retired runtime shim contract: PASS');
