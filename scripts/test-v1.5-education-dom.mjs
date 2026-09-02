import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('v1.4-education-ui.js','utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

class FakeElement{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.id='';this.hidden=false;this.parentNode=null;this.children=[];this.dataset={};this.className='';this.classList={toggle(){} ,contains:()=>false};this.style={};this.value='';this._html='';this.textContent='';this._listeners={};}
  appendChild(child){child.parentNode=this;this.children.push(child);return child}
  insertBefore(child,before){child.parentNode=this;const i=this.children.indexOf(before);if(i<0)this.children.push(child);else this.children.splice(i,0,child);return child}
  addEventListener(type,fn){(this._listeners[type]??=[]).push(fn)}
  closest(sel){if(sel==='[data-tab]'&&this.dataset.tab)return this;if(sel==='button'&&this.tagName==='BUTTON')return this;return null}
  matches(sel){if(sel==='.v14-edu-choice')return this.className.includes('v14-edu-choice')||this.dataset.choice!==undefined;return false}
  querySelector(sel){return this.querySelectorAll(sel)[0]||null}
  querySelectorAll(sel){
    const all=[];
    const walk=n=>{for(const c of n.children||[]){
      if(sel.startsWith('#')&&c.id===sel.slice(1))all.push(c);
      else if(sel==='.v14-edu-choice'&&c.dataset.choice!==undefined)all.push(c);
      else if(sel==='input'&&c.tagName==='INPUT')all.push(c);
      else if(sel==='button'&&c.tagName==='BUTTON')all.push(c);
      walk(c);
    }};walk(this);return all;
  }
  set innerHTML(value){this._html=String(value);this.children=[];
    const html=this._html;
    const choiceRe=/<button[^>]*class="[^"]*v14-edu-choice[^\"]*"[^>]*data-choice="([^"]+)"[^>]*>([^<]*)<\/button>/g;
    let m;while((m=choiceRe.exec(html))){const b=new FakeElement('button');b.className='secondary v14-edu-choice';b.dataset.choice=m[1];b.textContent=m[2];this.appendChild(b)}
    if(/id="v14EduInput"/.test(html)){const input=new FakeElement('input');input.id='v14EduInput';this.appendChild(input)}
    if(/id="v14EduNext"/.test(html)){const b=new FakeElement('button');b.id='v14EduNext';this.appendChild(b)}
  }
  get innerHTML(){return this._html}
}

const panel=new FakeElement('div');panel.id='studyPanel';
const study=new FakeElement('div');study.id='study';panel.appendChild(study);
const body=new FakeElement('body');body.appendChild(panel);
const head=new FakeElement('head');
const listeners={};
const document={
  readyState:'complete',
  body,head,
  createElement:tag=>new FakeElement(tag),
  querySelector(sel){return body.querySelector(sel)},
  querySelectorAll(sel){return body.querySelectorAll(sel)},
  addEventListener(type,fn){(listeners[type]??=[]).push(fn)},
  getElementById(id){return body.querySelector('#'+id)},
};
const storage=new Map([
  ['kanji5-v1',JSON.stringify({cards:{gaku:{}}})],
  ['kanji5-v1.2-knowledge',JSON.stringify({学:{}})],
  ['kanji5-v1.3-education-settings',JSON.stringify({production:true,vocabulary:true,context:true})]
]);
const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v))};
const target={id:'gaku',character:'学',meaning:['study'],on:['がく'],kun:['まなぶ'],strokes:8,grade:2};
const distractors=[{id:'kou',character:'校',meaning:['school'],on:['こう'],kun:[]},{id:'sei',character:'生',meaning:['life'],on:['せい'],kun:[]},{id:'shu',character:'習',meaning:['learn'],on:['しゅう'],kun:[]}];
const core={
  getAvailableModes:()=>['meaning','reading','production','vocabulary','context'],
  selectEducationItem:(seen)=>{assert(seen.length===1&&seen[0].character==='学',`Unexpected seen set: ${JSON.stringify(seen)}`);return target},
  chooseBestExercise:()=> 'production',
  getStage:()=> 'learning',
  chooseDistractors:()=>distractors,
  recordKnowledge:(knowledge,ch,mode,correct,wrong)=>{const old=knowledge[ch]||{};old[mode]=old[mode]||{attempts:0,correct:0};old[mode].attempts++;if(correct)old[mode].correct++;if(wrong){old.distractors=old.distractors||{};old.distractors[wrong]=(old.distractors[wrong]||0)+1}return knowledge},
  gradeMeaning:()=>({correct:false,quality:'wrong'}),gradeReading:()=>({correct:false,quality:'wrong'}),ensureEntry:(k)=>k
};
const window={__KANJI5_EDU_CORE__:core};
window.__KANJI5_P0_DATA=[target,...distractors];
const context={window,document,localStorage,console,setTimeout:fn=>fn(),Math,Date,fetch:async()=>{throw new Error('unexpected fetch')}};
vm.createContext(context);
vm.runInContext(source,context,{filename:'v1.4-education-ui.js'});
const api=window.__KANJI5_EDU_UI_API__;
assert(api&&typeof api.startEducation==='function','Education UI test API missing');
await api.startEducation();
const state=api.getState();
if(state.mode!=='production'||state.item?.character!=='学')throw new Error(`Production mode did not start with selected Kanji; state=${JSON.stringify(state)}, pane=${panel.innerHTML}`);
const choices=panel.querySelectorAll('.v14-edu-choice');
assert(choices.length===4,'Production must render exactly four MCQ choices');
assert(!panel.querySelector('#v14EduInput'),'Production must not render a text input');
assert(choices.some(c=>c.dataset.choice==='学'),'Correct Kanji is missing from choices');
const targetChoice=choices.find(c=>c.dataset.choice==='学');
listeners.click[1]({target:targetChoice,preventDefault(){}});
assert(panel.innerHTML.includes('✅ پاسخ درست بود'),'Correct Production choice did not render a success result');
assert(JSON.parse(storage.get('kanji5-v1.2-knowledge')).学.production.attempts===1,'Correct Production answer was not recorded');
await api.startEducation();
const wrongChoice=panel.querySelectorAll('.v14-edu-choice').find(c=>c.dataset.choice!=='学');
assert(wrongChoice,'Wrong Production choice missing');
listeners.click[1]({target:wrongChoice,preventDefault(){}});
assert(panel.innerHTML.includes('❌ پاسخ درست نبود'),'Wrong Production choice did not render an error result');
const finalKnowledge=JSON.parse(storage.get('kanji5-v1.2-knowledge')).学;
assert(finalKnowledge.production.attempts===2&&finalKnowledge.production.correct===1,'Wrong Production answer was not recorded separately');
assert(finalKnowledge.distractors?.[wrongChoice.dataset.choice]===1,'Wrong distractor was not recorded');
console.log('Kanji 5 v1.5 behavioral Education/Production DOM test passed.');
