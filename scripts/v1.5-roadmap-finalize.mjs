import fs from 'node:fs';

const indexPath='index.html';
let index=fs.readFileSync(indexPath,'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

const oldQueue=/function buildQueue\(\)\{[\s\S]*?\n\}\nfunction formatInterval/;
assert(oldQueue.test(index),'buildQueue block not found; refusing unsafe patch');
const newQueue=`function jlptRank(item){const rank={N5:0,N4:1,N3:2,N2:3,N1:4};return rank[item?.jlpt]??5}
function newCardPriority(item,knowledge,now=Date.now()){
  const entry=knowledge?.[item.character]||{};
  const latest=[entry.meaning,entry.reading,entry.production,entry.vocabulary,entry.context].map(s=>s?.lastAt).filter(Boolean).sort().pop()||'';
  const ageDays=latest?Math.max(0,now-Date.parse(latest))/86400000:0;
  return educationQueuePriority(item,knowledge,now)+Math.min(1,ageDays/30)*.1;
}
function buildQueue(){
  let knowledge={};try{knowledge=JSON.parse(localStorage.getItem('kanji5-v1.2-knowledge')||'{}')}catch(_){}
  const now=Date.now();
  const dueItems=state.deck.filter(k=>state.cards[k.id]?.card&&dueNow(state.cards[k.id].card)).map(item=>({item,card:reviveCard(state.cards[item.id].card)}));
  dueItems.sort((a,b)=>{
    const aLate=Math.max(0,(now-new Date(a.card.due).getTime())/86400000),bLate=Math.max(0,(now-new Date(b.card.due).getTime())/86400000);
    const aScore=aLate*.6+educationQueuePriority(a.item,knowledge,now)*.4;
    const bScore=bLate*.6+educationQueuePriority(b.item,knowledge,now)*.4;
    return bScore-aScore||new Date(a.card.due)-new Date(b.card.due)
  });
  const due=dueItems.map(x=>x.item.id);
  const remaining=Math.max(0,state.settings.dailyNew-state.todayNew);
  const newCards=state.deck.filter(item=>!state.cards[item.id]).sort((a,b)=>{
    const level=jlptRank(a)-jlptRank(b);if(level)return level;
    const priority=newCardPriority(b,knowledge,now)-newCardPriority(a,knowledge,now);
    if(Math.abs(priority)>.0001)return priority;
    const af=Number.isFinite(Number(a.frequency))?Number(a.frequency):Infinity;
    const bf=Number.isFinite(Number(b.frequency))?Number(b.frequency):Infinity;
    return af-bf||String(a.character).localeCompare(String(b.character));
  }).slice(0,remaining).map(item=>item.id);
  state.queue=[...due,...newCards];return state.queue
}
function formatInterval`;
index=index.replace(oldQueue,newQueue);

const oldExamples=/async function fetchExamples\(k\)\{[\s\S]*?\n\}\nfunction renderEmpty/;
assert(oldExamples.test(index),'fetchExamples block not found; refusing unsafe patch');
const newExamples=`function exampleComplexity(example,k){const word=String(example?.word||'');const reading=String(example?.reading||'');const otherKanji=[...word].filter(ch=>/[\\u3400-\\u9fff]/.test(ch)&&ch!==k.character).length;return otherKanji*6+Math.max(0,[...word].length-2)*1.5+Math.max(0,[...reading].length-4)*.35}
async function fetchExamples(k){
  if(state.examples[k.id])return;
  try{
    const res=await fetch(WORDS_URL(k.character),{cache:'force-cache'});if(!res.ok)return;
    const data=await res.json();const seen=new Set(),candidates=[];
    for(const e of data){for(const v of(e.variants||[])){
      const term=String(v.written||''),reading=String(v.pronounced||'');
      if(!term||!reading||!term.includes(k.character)||seen.has(term))continue;
      seen.add(term);candidates.push({word:term,reading});
    }}
    candidates.sort((a,b)=>exampleComplexity(a,k)-exampleComplexity(b,k)||a.word.localeCompare(b.word));
    state.examples[k.id]=candidates.slice(0,4);save();
  }catch(_) {}}
function renderEmpty`;
index=index.replace(oldExamples,newExamples);

const helper=`function ensureUpcomingReviewsUI(){
  const studyPanel=$(\"studyPanel\");if(!studyPanel)return null;
  let panel=$(\"upcomingReviews\");if(panel)return panel;
  panel=document.createElement('section');panel.id='upcomingReviews';panel.className='panel';panel.style.marginTop='14px';
  panel.innerHTML='<div style="font-weight:850;font-size:16px;margin-bottom:8px">مرورهای پیش‌رو</div><div id="upcomingReviewsBody" style="color:var(--muted);font-size:13px">—</div>';
  studyPanel.insertAdjacentElement('afterend',panel);return panel
}
function updateUpcomingReviews(){
  const panel=ensureUpcomingReviewsUI(),body=$(\"upcomingReviewsBody\");if(!panel||!body)return;
  const now=Date.now();
  const rows=state.deck.map(item=>{const card=state.cards[item.id]?.card;if(!card?.due)return null;const due=new Date(card.due).getTime();return due>now?{item,due}:null}).filter(Boolean).sort((a,b)=>a.due-b.due).slice(0,6);
  if(!rows.length){body.textContent='فعلاً مرور زمان‌بندی‌شده‌ای در آینده وجود ندارد.';return}
  body.innerHTML=rows.map(({item,due})=>{const mins=Math.max(1,Math.round((due-now)/60000));const when=mins<60?`${mins} دقیقه دیگر`:mins<1440?`${Math.round(mins/60)} ساعت دیگر`:`${Math.round(mins/1440)} روز دیگر`;return `<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid var(--line)"><strong>${item.character}</strong><span>${when}</span></div>`}).join('')
}
`;
assert(index.includes('function renderCard(){'),'renderCard marker missing');
index=index.replace('function renderCard(){',helper+'function renderCard(){');

const tail='renderExamples();if(state.revealed)fetchExamples(item).then(renderExamples)}';
assert(index.includes(tail),'renderCard tail marker missing');
index=index.replace(tail,'renderExamples();if(state.revealed)fetchExamples(item).then(renderExamples);updateUpcomingReviews()}');

const next='function next(){if(state.queue.length===0){state.current=null;state.revealed=false;renderEmpty();updateStats();return}state.current=state.queue[0];state.revealed=false;renderCard();updateStats()}';
assert(index.includes(next),'next marker missing');
index=index.replace(next,'function next(){if(state.queue.length===0){state.current=null;state.revealed=false;renderEmpty();updateStats();updateUpcomingReviews();return}state.current=state.queue[0];state.revealed=false;renderCard();updateStats();updateUpcomingReviews()}');

const boot='loadDeck().then(()=>{';
assert(index.includes(boot),'startup marker missing');
index=index.replace(boot,'ensureUpcomingReviewsUI();updateUpcomingReviews();setInterval(updateUpcomingReviews,15000);\n'+boot);

fs.writeFileSync(indexPath,index);
console.log('v1.5 roadmap finalization patch applied.');
