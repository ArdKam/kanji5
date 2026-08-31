import fs from 'node:fs';
const indexPath='index.html';
const swPath='sw.js';
let html=fs.readFileSync(indexPath,'utf8');
const tag='<script src="./v1.3-smart-distractors.js"></script>';
if(!html.includes(tag)){
  const anchor='<script type="module">';
  if(!html.includes(anchor)) throw new Error('Main module anchor not found');
  html=html.replace(anchor,tag+'\n'+anchor);
  fs.writeFileSync(indexPath,html);
}
let sw=fs.readFileSync(swPath,'utf8');
if(!sw.includes("'./v1.3-smart-distractors.js'")){
  sw=sw.replace("'./v1.3-p1.js',","'./v1.3-p1.js','./v1.3-smart-distractors.js',");
  fs.writeFileSync(swPath,sw);
}
console.log('Wired smart distractors into index.html and service worker.');
