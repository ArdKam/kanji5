(()=>{
'use strict';
if(globalThis.__KANJI5_V18_PRODUCTION__)return;
function normalize(value){return String(value??'').normalize('NFKC').trim();}
function gradeProduction(input,target){
  const actual=normalize(input);
  const expected=normalize(target);
  if(!actual)return{correct:false,quality:'empty',score:0};
  if(actual===expected)return{correct:true,quality:'exact',score:1};
  return{correct:false,quality:'wrong',score:0};
}
const api=Object.freeze({normalize,gradeProduction});
globalThis.__KANJI5_V18_PRODUCTION__=api;
})();
