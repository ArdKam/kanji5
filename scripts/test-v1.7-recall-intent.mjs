import assert from 'node:assert/strict';

const ATTRIBUTES=['meaning','reading','production','vocabulary','context'];
const KEY='kanji5-v1.7-recall-intent';
function chooseIntentEntry(raw){
  const value=raw&&typeof raw==='object'?raw:{};
  const character=String(value.character||'');
  const attribute=ATTRIBUTES.includes(value.attribute)?value.attribute:null;
  const attributes=Array.isArray(value.attributes)?value.attributes.filter(x=>ATTRIBUTES.includes(x)).slice(0,ATTRIBUTES.length):[];
  return character&&attribute?{schemaVersion:1,character,attribute,attributes,generatedAt:String(value.generatedAt||'')} : null;
}
function shouldReuseIntent(intent,character){return Boolean(intent&&intent.character===character&&ATTRIBUTES.includes(intent.attribute))}

const intent=chooseIntentEntry({character:'日',attribute:'reading',attributes:['reading','meaning'],generatedAt:new Date(0).toISOString()});
assert.deepEqual(intent,{schemaVersion:1,character:'日',attribute:'reading',attributes:['reading','meaning'],generatedAt:new Date(0).toISOString()});
assert.equal(shouldReuseIntent(intent,'日'),true);
assert.equal(shouldReuseIntent(intent,'月'),false);
assert.equal(shouldReuseIntent({character:'日',attribute:'bad'},'日'),false);
console.log('v1.7 recall intent contract: PASS');
