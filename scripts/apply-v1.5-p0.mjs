import fs from 'node:fs';
// v1.5: canonicalize JLPT-grouped new-card queue before each build.
const indexPath='index.html';
let html=fs.readFileSync(indexPath,'utf8');
const runtimeTag='<script src="./v1.5-p0.js"></script>';
const anchor='<script type="module">';
if(!html.includes(anchor))throw new Error('Main module anchor missing');
html=html.replaceAll(runtimeTag,'');
html=html.replace(anchor,runtimeTag+'\n'+anchor);
if(!html.includes('function jlptRank(')){
  const blockPattern=/const newCards=\[\];if\(state\.todayNew<state\.settings\.dailyNew\)for\(const item of state\.deck\)if\(!state\.cards\[item\.id\]\)\{newCards\.push\(item\.id\);if\(newCards\.length>=state\.settings\.dailyNew-state\.todayNew\)break\}/;
  const replacement="function jlptRank(item){return({N5:0,N4:1,N3:2,N2:3,N1:4}[item?.jlpt]??5)}const newLimit=Math.max(0,state.settings.dailyNew-state.todayNew),unseen=state.deck.filter(item=>!state.cards[item.id]).slice().sort((a,b)=>jlptRank(a)-jlptRank(b)||Number(a.order||a.frequency||0)-Number(b.order||b.frequency||0));const newCards=[];for(let start=0;start<unseen.length&&newCards.length<newLimit;){const rank=jlptRank(unseen[start]),group=[];while(start<unseen.length&&jlptRank(unseen[start])===rank)group.push(unseen[start++]);for(let i=group.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[group[i],group[j]]=[group[j],group[i]]}for(const item of group){newCards.push(item.id);if(newCards.length>=newLimit)break}}";
  if(!blockPattern.test(html))throw new Error('Could not locate canonical new-card queue block');
  html=html.replace(blockPattern,replacement);
}
fs.writeFileSync(indexPath,html);
const swPath='sw.js';
let sw=fs.readFileSync(swPath,'utf8');
if(!sw.includes('"./v1.5-p0.js"'))sw=sw.replace('"./v1.4-education-ui.js",','"./v1.4-education-ui.js","./v1.5-p0.js",');
sw=sw.replace("const CACHE='kanji5-shell-v38';","const CACHE='kanji5-shell-v41';");
sw=sw.replace("const CACHE='kanji5-shell-v39';","const CACHE='kanji5-shell-v41';");
sw=sw.split('\n').map(line=>line.replace(/[ \t]+$/,'')).join('\n');
fs.writeFileSync(swPath,sw);
console.log('Applied v1.5 P0 stabilization wiring.');
