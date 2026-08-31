(()=>{
'use strict';
if(window.__KANJI5_EDU_CORE__)return;
const MODES=['meaning','reading','production','vocabulary','context'];
const MODES_RECALL=['meaning','reading'];
const PRIORITY={meaning:1,reading:1,production:1.15,vocabulary:1,context:.95};
const DEFAULTS={production:true,vocabulary:true,context:true};
function safeStats(value){const s=value&&typeof value==='object'?value:{};return{attempts:Math.max(0,Number(s.attempts)||0),correct:Math.max(0,Number(s.correct)||0),lastAt:typeof s.lastAt==='string'?s.lastAt:''}}
function mastery(stats){const s=safeStats(stats);return(s.correct+1)/(s.attempts+2)}
function weakness(stats){return 1-mastery(stats)}
function normalize(value){return String(value??'').trim().toLowerCase().normalize('NFKC').replace(/[\s\u3000]+/g,'')}
function meaningTokens(value){return normalize(value).split(/[^a-z0-9]+/).filter(token=>token.length>1)}
function normalizeMeaning(value){return new Set(meaningTokens(value))}
function meaningSimilarity(input,meaning){const a=normalizeMeaning(input),b=normalizeMeaning(meaning);if(!a.size||!b.size)return 0;let shared=0;for(const token of a)if(b.has(token))shared+=1;return shared/Math.max(1,Math.min(a.size,b.size))}
function gradeMeaning(input,meanings){const value=normalize(input);if(!value)return{correct:false,quality:'empty',score:0};const answers=Array.isArray(meanings)?meanings:[];for(const answer of answers)if(normalize(answer)===value)return{correct:true,quality:'exact',score:1};let best=0;for(const answer of answers)best=Math.max(best,meaningSimilarity(value,answer));return best>=0.5?{correct:true,quality:'partial',score:best}:{correct:false,quality:'wrong',score:best}}
function gradeReading(input,readings,toRomaji){const value=normalize(input);if(!value)return{correct:false,quality:'empty',score:0};const romaji=normalize(typeof toRomaji==='function'?toRomaji(input):input);for(const reading of (Array.isArray(readings)?readings:[])){const r=normalize(reading);const rr=normalize(typeof toRomaji==='function'?toRomaji(reading):reading);if(value===r||romaji===rr)return{correct:true,quality:'exact',score:1}}return{correct:false,quality:'wrong',score:0}}
function getAvailableModes(settings,hasWords){const s={...DEFAULTS,...(settings||{})};const modes=['meaning','reading'];if(s.production)modes.push('production');if(hasWords&&s.vocabulary)modes.push('vocabulary');if(hasWords&&s.context)modes.push('context');return modes}
function chooseMode(item,stats,availableModes){const modes=Array.isArray(availableModes)&&availableModes.length?availableModes:MODES_RECALL;const state=stats&&typeof stats==='object'?stats:{};const fresh=modes.filter(mode=>!safeStats(state[mode]).attempts);if(fresh.length){const pool=fresh.slice(0,2);return pool[Math.floor(Math.random()*pool.length)]}
const weighted=modes.map(mode=>{const m=mastery(state[mode]);return{mode,weight:Math.max(.05,weakness(state[mode])*PRIORITY[mode])}});const total=weighted.reduce((sum,x)=>sum+x.weight,0);let roll=Math.random()*total;for(const entry of weighted){roll-=entry.weight;if(roll<=0)return entry.mode}return weighted[0].mode}
function normalizeKnowledgeEntry(entry){const out={...entry};for(const mode of MODES){if(out[mode])out[mode]=safeStats(out[mode])}out.distractors={...(entry&&entry.distractors||{})};return out}
function recordKnowledge(knowledge,ch,mode,correct,wrong=''){const out=structuredClone(knowledge&&typeof knowledge==='object'?knowledge:{});const entry=normalizeKnowledgeEntry(out[ch]);const stats=safeStats(entry[mode]);stats.attempts+=1;if(correct)stats.correct+=1;stats.lastAt=new Date().toISOString();entry[mode]=stats;if(wrong){entry.distractors[wrong]=(Number(entry.distractors[wrong])||0)+1}out[ch]=entry;return out}
const registry=MODES.reduce((out,mode)=>{out[mode]={id:mode,group:mode==='meaning'||mode==='reading'?'recall':'reinforcement'};return out},{});
window.__KANJI5_EDU_CORE__=Object.freeze({version:'1.4.0-p0',modes:Object.freeze([...MODES]),registry:Object.freeze(registry),mastery,weakness,normalize,meaningSimilarity,gradeMeaning,gradeReading,getAvailableModes,chooseMode,recordKnowledge,normalizeKnowledgeEntry});
})();
