(() => {
  "use strict";
  const STORAGE = "kanji5-v1";
  const KNOWLEDGE_KEY = "kanji5-v1.2-knowledge";
  const WORDS_URL = ch => "https://kanjiapi.dev/v1/words/" + encodeURIComponent(ch);
  const $ = (s, r = document) => r.querySelector(s);
  let active = null;
  let deckIndex = null;
  const wordsCache = new Map();

  const norm = v => String(v || "").trim().toLowerCase().normalize("NFKC").replace(/[\s\u3000]+/g, "").replace(/[。、・,.;:!?！？\-ー]/g, "");
  const hiraMap = new Map([
    ["あ","a"],["い","i"],["う","u"],["え","e"],["お","o"],["か","ka"],["き","ki"],["く","ku"],["け","ke"],["こ","ko"],
    ["さ","sa"],["し","shi"],["す","su"],["せ","se"],["そ","so"],["た","ta"],["ち","chi"],["つ","tsu"],["て","te"],["と","to"],
    ["な","na"],["に","ni"],["ぬ","nu"],["ね","ne"],["の","no"],["は","ha"],["ひ","hi"],["ふ","fu"],["へ","he"],["ほ","ho"],
    ["ま","ma"],["み","mi"],["む","mu"],["め","me"],["も","mo"],["や","ya"],["ゆ","yu"],["よ","yo"],["ら","ra"],["り","ri"],["る","ru"],["れ","re"],["ろ","ro"],
    ["わ","wa"],["を","o"],["ん","n"],["が","ga"],["ぎ","gi"],["ぐ","gu"],["げ","ge"],["ご","go"],["ざ","za"],["じ","ji"],["ず","zu"],["ぜ","ze"],["ぞ","zo"],
    ["だ","da"],["ぢ","ji"],["づ","zu"],["で","de"],["ど","do"],["ば","ba"],["び","bi"],["ぶ","bu"],["べ","be"],["ぼ","bo"],
    ["ぱ","pa"],["ぴ","pi"],["ぷ","pu"],["ぺ","pe"],["ぽ","po"],["ゔ","vu"],["きゃ","kya"],["きゅ","kyu"],["きょ","kyo"],
    ["しゃ","sha"],["しゅ","shu"],["しょ","sho"],["ちゃ","cha"],["ちゅ","chu"],["ちょ","cho"],["にゃ","nya"],["にゅ","nyu"],["にょ","nyo"],
    ["ひゃ","hya"],["ひゅ","hyu"],["ひょ","hyo"],["みゃ","mya"],["みゅ","myu"],["みょ","myo"],["りゃ","rya"],["りゅ","ryu"],["りょ","ryo"],
    ["ぎゃ","gya"],["ぎゅ","gyu"],["ぎょ","gyo"],["じゃ","ja"],["じゅ","ju"],["じょ","jo"],["びゃ","bya"],["びゅ","byu"],["びょ","byo"],["ぴゃ","pya"],["ぴゅ","pyu"],["ぴょ","pyo"]
  ]);

  function hiraToRomaji(v){
    const s = String(v || "").normalize("NFKC").replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0)-0x60));
    let out="";
    for(let i=0;i<s.length;){
      if(s[i]==="っ"){
        const n=hiraMap.get(s.slice(i+1,i+3))||hiraMap.get(s[i+1])||"";
        if(n && /^[bcdfghjklmnpqrstvwxyz]/.test(n)) out+=n[0]; i++; continue;
      }
      const p=s.slice(i,i+2);
      if(hiraMap.has(p)){out+=hiraMap.get(p);i+=2;continue;}
      out+=hiraMap.get(s[i])||s[i];i++;
    }
    return out;
  }

  function normRomaji(v){
    return norm(v).replace(/[^a-z]/g,"").replace(/si/g,"shi").replace(/ti/g,"chi").replace(/tu/g,"tsu").replace(/hu/g,"fu").replace(/zi/g,"ji").replace(/du/g,"zu").replace(/di/g,"ji").replace(/wo/g,"o");
  }

  function knowledge(){
    try{const x=JSON.parse(localStorage.getItem(KNOWLEDGE_KEY)||"{}");return x&&typeof x==="object"?x:{}}catch(_){return {}}
  }
  function record(ch,mode,correct){
    const all=knowledge(), node=all[ch]||{}, s=node[mode]||{attempts:0,correct:0,lastAt:null};
    s.attempts++; if(correct===true)s.correct++; s.lastAt=new Date().toISOString(); node[mode]=s; node.lastPrompt=mode; all[ch]=node;
    try{localStorage.setItem(KNOWLEDGE_KEY,JSON.stringify(all))}catch(_){ }
  }
  function mastery(ch,mode){const s=(knowledge()[ch]||{})[mode]||{attempts:0,correct:0};return (s.correct+1)/(s.attempts+2)}
  function getItem(){
    const ch=$(".kanji")?.textContent?.trim(); if(!ch)return null;
    if(!deckIndex){try{const x=JSON.parse(localStorage.getItem("kanji5-deck")||"[]");deckIndex=new Map((Array.isArray(x)?x:[]).map(i=>[i.character,i]));}catch(_){deckIndex=new Map()}}
    return {character:ch,item:deckIndex.get(ch)};
  }
  function firstExposure(){
    const id=$(".kanji")?.dataset?.kanjiId; if(!id)return false;
    try{const x=JSON.parse(localStorage.getItem(STORAGE)||"null");return !x?.cards?.[id]}catch(_){return false}
  }
  async function words(ch){
    if(wordsCache.has(ch))return wordsCache.get(ch);
    let out=[]; try{
      const r=await fetch(WORDS_URL(ch),{cache:"force-cache"}); if(r.ok){const data=await r.json(),seen=new Set();
        for(const e of data){for(const v of (e.variants||[])){const w=v.written||"",read=v.pronounced||"";if(w.includes(ch)&&read&&!seen.has(w)){seen.add(w);out.push({word:w,reading:read,meaning:(e.meanings||[]).flatMap(m=>m.glosses||[]).slice(0,2).join("; ")});}if(out.length>=8)break}if(out.length>=8)break}
      }
    }catch(_){ }
    wordsCache.set(ch,out); return out;
  }
  function chooseMode(ch, hasWords){
    const modes=["meaning","reading","production"];
    if(hasWords)modes.push("vocabulary","context");
    const node=knowledge()[ch]||{};
    const unattempted=modes.filter(m=>!(node[m]?.attempts));
    if(unattempted.length)return unattempted[Math.floor(Math.random()*unattempted.length)];
    return modes.slice().sort((a,b)=>mastery(ch,a)-mastery(ch,b))[0]||"meaning";
  }
  function answerForReading(item,v){
    const a=norm(v), ar=normRomaji(v);
    return [...(item.on||[]),...(item.kun||[])].some(r=>a===norm(r)||ar===normRomaji(hiraToRomaji(r)));
  }

  async function openGate(){
    const data=getItem(); if(!data?.item)return false;
    const ws=await words(data.character);
    const mode=chooseMode(data.character,ws.length>0); active={...data,mode,words:ws};
    const button=$("#revealBtn"); if(!button)return false;
    const gate=document.createElement("div"); gate.className="v13-p1-gate";
    gate.innerHTML='<div class="v13-p1-card"><div class="v13-p1-title">🧠 تمرین یادآوری</div><div id="v13P1Prompt" class="v13-p1-prompt"></div><div id="v13P1Body"></div><button id="v13P1Submit" class="primary" style="width:100%;margin-top:10px">بررسی پاسخ</button></div>';
    button.replaceWith(gate);
    const p=$("#v13P1Prompt"), body=$("#v13P1Body"), i=data.item;
    if(mode==="meaning"){
      p.textContent="حداقل یک معنی این کانجی را از حافظه بنویس.";
      body.innerHTML='<input id="v13P1Input" class="v13-p1-input" type="text" autocomplete="off" spellcheck="false" placeholder="مثلاً: school">';
    }else if(mode==="reading"){
      p.textContent="یک خوانش رایج را از حافظه بنویس؛ Hiragana یا Romaji هر دو قابل قبول‌اند.";
      body.innerHTML='<input id="v13P1Input" class="v13-p1-input" type="text" autocomplete="off" spellcheck="false" placeholder="مثلاً: gaku یا がく">';
    }else if(mode==="production"){
      p.innerHTML='معنی: <strong>'+((i.meaning||[]).join(" · ")||"—")+'</strong><br>کانجی مناسب را بنویس.';
      body.innerHTML='<input id="v13P1Input" class="v13-p1-input v13-p1-kanji" type="text" inputmode="text" maxlength="2" placeholder="کانجی">';
    }else{
      const w=ws[Math.floor(Math.random()*ws.length)]; active.word=w;
      if(mode==="vocabulary"){
        p.textContent="کانجی گمشده را در این واژه کامل کن.";
        body.innerHTML='<div class="v13-p1-word">'+w.word.replace(data.character,"＿")+'</div><div class="v13-p1-reading">'+w.reading+'</div><input id="v13P1Input" class="v13-p1-input v13-p1-kanji" maxlength="2" placeholder="کانجی گمشده">';
      }else{
        p.textContent="از روی بافت واژه، کانجی را به یاد بیاور.";
        body.innerHTML='<div class="v13-p1-reading">خوانش: '+w.reading+'</div>'+(w.meaning?'<div class="v13-p1-word-meaning">'+w.meaning+'</div>':'')+'<input id="v13P1Input" class="v13-p1-input v13-p1-kanji" maxlength="2" placeholder="کانجی">';
      }
    }
    setTimeout(()=>$("#v13P1Input")?.focus(),0); return true;
  }

  function finishGate(correct){
    const {character,item,mode,word}=active; record(character,mode,correct);
    const gate=$(".v13-p1-gate"), answerBox=$("#answerBox"), ratings=$("#ratings");
    if(!gate)return;
    const result=document.createElement("div"); result.className="v13-p1-result "+(correct?"good":"bad"); result.textContent=correct?"✅ درست":"❌ درست نبود";
    gate.appendChild(result);
    gate.insertAdjacentHTML("beforeend",'<div class="v13-p1-answer">پاسخ صحیح: <strong>'+characterAnswer(item,mode,word,character)+'</strong></div>');
    $("#v13P1Submit")?.setAttribute("disabled","true");
    gate.remove();
    if(answerBox){answerBox.classList.add("show");answerBox.removeAttribute("aria-hidden")}
    if(ratings)ratings.classList.add("show");
    const storedKey="kanji5-v1.2-last-attempt"; try{localStorage.setItem(storedKey,JSON.stringify({character,mode,attemptedAt:new Date().toISOString(),hadAttempt:true,correct}))}catch(_){ }
    active=null;
  }
  function characterAnswer(item,mode,word,ch){
    if(mode==="meaning")return (item.meaning||[]).join(" · ")||"—";
    if(mode==="reading")return [...(item.on||[]),...(item.kun||[])].join(" · ")||"—";
    return ch;
  }
  async function submit(){
    if(!active)return; const v=$("#v13P1Input")?.value||""; if(!norm(v)){ $("#v13P1Input")?.focus(); return; }
    const {item,mode,character,word}=active; let ok=false;
    if(mode==="meaning")ok=(item.meaning||[]).some(m=>{const a=norm(v),c=norm(m);return c&&(a===c||a.includes(c)||c.includes(a))});
    else if(mode==="reading")ok=answerForReading(item,v);
    else if(mode==="production")ok=norm(v)===norm(character);
    else ok=!!word&&norm(v)===norm(character);
    finishGate(ok);
  }

  document.addEventListener("click",event=>{
    const t=event.target;
    if(t?.id==="revealBtn"&&!firstExposure()){
      event.preventDefault();event.stopImmediatePropagation();void openGate();return;
    }
    if(t?.id==="v13P1Submit"){event.preventDefault();event.stopImmediatePropagation();void submit();}
  },true);
  document.addEventListener("keydown",event=>{
    if(event.target?.id==="v13P1Input"&&(event.key==="Enter"||((event.ctrlKey||event.metaKey)&&event.key==="Enter"))){event.preventDefault();void submit();}
  },true);
})();
