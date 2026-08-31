import fs from 'node:fs';

const path='v1.4-education-ui.js';
let source=fs.readFileSync(path,'utf8');
const old=/function chooseChoices\(target\)\{[\s\S]*?\nasync function fetchWords/;
const replacement=`function chooseChoices(target){const history=readKnowledge()[target.character]?.distractors||{};const pool=getDeck().filter(x=>x?.character&&x.character!==target.character);return [target,...CORE.chooseDistractors(target,pool,history,3)].sort(()=>Math.random()-.5)}
async function fetchWords`;
if(old.test(source))source=source.replace(old,replacement);
source=source.replace("version:'1.4.0-p5'","version:'1.4.0-p6'");
fs.writeFileSync(path,source);
console.log('Applied v1.4 canonical smart distractors.');
