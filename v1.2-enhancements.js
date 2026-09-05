(() => {
  const V12 = "kanji5-v1.2";
  const KNOWLEDGE_KEY = `${V12}-knowledge`;
  const CARDS_KEY = "kanji5-v1-cards";
  const $ = (sel, root = document) => root.querySelector(sel);

  let activePrompt = null;
  let activeCharacter = null;
  let deckIndex = null;
  let originalRevealButton = null;
  let allowNativeReveal = false;

  function normalize(value) {
    return String(value ?? "").trim().toLowerCase().normalize("NFKC").replace(/[\s\u3000]+/g, "");
  }
  function normalizeRomaji(value) {
    return normalize(value).replace(/shi/g, "si").replace(/chi/g, "ti").replace(/tsu/g, "tu").replace(/fu/g, "hu").replace(/ji/g, "zi").replace(/ou/g, "o").replace(/aa/g, "a").replace(/ii/g, "i").replace(/uu/g, "u").replace(/ee/g, "e");
  }
  function kanaToRomaji(value) {
    const map = new Map([["あ","a"],["い","i"],["う","u"],["え","e"],["お","o"],["か","ka"],["き","ki"],["く","ku"],["け","ke"],["こ","ko"],["さ","sa"],["し","shi"],["す","su"],["せ","se"],["そ","so"],["た","ta"],["ち","chi"],["つ","tsu"],["て","te"],["と","to"],["な","na"],["に","ni"],["ぬ","nu"],["ね","ne"],["の","no"],["は","ha"],["ひ","hi"],["ふ","fu"],["へ","he"],["ほ","ho"],["ま","ma"],["み","mi"],["む","mu"],["め","me"],["も","mo"],["や","ya"],["ゆ","yu"],["よ","yo"],["ら","ra"],["り","ri"],["る","ru"],["れ","re"],["ろ","ro"],["わ","wa"],["を","wo"],["ん","n"],["が","ga"],["ぎ","gi"],["ぐ","gu"],["げ","ge"],["ご","go"],["ざ","za"],["じ","ji"],["ず","zu"],["ぜ","ze"],["ぞ","zo"],["だ","da"],["ぢ","ji"],["づ","zu"],["で","de"],["ど","do"],["ば","ba"],["び","bi"],["ぶ","bu"],["べ","be"],["ぼ","bo"],["ぱ","pa"],["ぴ","pi"],["ぷ","pu"],["ぺ","pe"],["ぽ","po"]]);
    const digraphs={"きゃ":"kya","きゅ":"kyu","きょ":"kyo","しゃ":"sha","しゅ":"shu","しょ":"sho","ちゃ":"cha","ちゅ":"chu","ちょ":"cho","にゃ":"nya","にゅ":"nyu","にょ":"nyo","ひゃ":"hya","ひゅ":"hyu","ひょ":"hyo","みゃ":"mya","みゅ":"myu","みょ":"myo","りゃ":"rya","りゅ":"ryu","りょ":"ryo","ぎゃ":"gya","ぎゅ":"gyu","ぎょ":"gyo","じゃ":"ja","じゅ":"ju","じょ":"jo","びゃ":"bya","びゅ":"byu","びょ":"byo","ぴゃ":"pya","ぴゅ":"pyu","ぴょ":"pyo"};
    let out=""; for(let i=0;i<value.length;i+=1){const pair=value.slice(i,i+2);if(digraphs[pair]){out+=digraphs[pair];i+=1;continue}if(value[i]==="っ"){out+=map.get(value[i+1])?.[0]||"";continue}if(value[i]==="ー")continue;out+=map.get(value[i])||value[i]} return out;
  }
  function loadKnowledge(){try{return JSON.parse(localStorage.getItem(KNOWLEDGE_KEY)||"{}")}catch(_){return{}}}
  function saveKnowledge(value){try{localStorage.setItem(KNOWLEDGE_KEY,JSON.stringify(value))}catch(_) {}}
  async function loadDeckIndex(){if(deckIndex)return;try{const raw=localStorage.getItem("kanji5-deck"),deck=raw?JSON.parse(raw):[];deckIndex=new Map((Array.isArray(deck)?deck:[]).map(item=>[item.character,item]))}catch(_){deckIndex=new Map()}}
  function choosePrompt(character){const entry=loadKnowledge()[character]||{};return(Number(entry.reading?.attempts)||0)<(Number(entry.meaning?.attempts)||0)?"reading":"meaning"}
  function gradeMeaningCanonical(value,meanings){const core=window.__KANJI5_EDU_CORE__;if(core?.gradeMeaning)return Boolean(core.gradeMeaning(value,meanings).correct);const answer=normalize(value);return Array.isArray(meanings)&&meanings.some(meaning=>answer===normalize(meaning))}
  function checkRecall(character,mode,value){const item=deckIndex?.get(character);if(!item)return null;const answer=normalize(value);if(!answer)return false;if(mode==="meaning")return gradeMeaningCanonical(value,item.meaning||[]);const answerRomaji=normalizeRomaji(answer);return[...(item.on||[]),...(item.kun||[])].some(reading=>{const canonicalKana=normalize(reading),canonicalRomaji=normalizeRomaji(kanaToRomaji(canonicalKana));return answer===canonicalKana||(answerRomaji&&answerRomaji===canonicalRomaji)})}
  function recordAttempt(character,mode,correct){const knowledge=loadKnowledge(),byChar=knowledge[character]||{},stats=byChar[mode]||{attempts:0,correct:0,lastAt:null};stats.attempts+=1;if(correct===true)stats.correct+=1;stats.lastAt=new Date().toISOString();byChar[mode]=stats;byChar.lastPrompt=mode;knowledge[character]=byChar;saveKnowledge(knowledge)}
  function makeRecallGate(){activeCharacter=$(".kanji")?.textContent?.trim()||"";activePrompt=choosePrompt(activeCharacter);originalRevealButton=document.getElementById("revealBtn");const prompt=activePrompt==="meaning"?"معنی این کانجی چیست؟ سعی کن حداقل یک معنی را از حافظه بنویسی.":"حداقل یک خوانش رایج این کانجی را از حافظه بنویس؛ kana یا romaji هر دو قابل قبول‌اند.";const gate=document.createElement("div");gate.className="v12-recall-gate";gate.innerHTML=`<div style="border:1px solid var(--line);background:#f9fafb;border-radius:16px;padding:16px;margin-top:14px"><div style="font-weight:800;margin-bottom:8px">یادآوری فعال</div><div style="color:var(--muted);margin-bottom:10px">${prompt}</div><input id="v12RecallInput" type="text" autocomplete="off" style="width:100%;border:1px solid var(--line);border-radius:12px;padding:11px 12px" /><div class="v12-recall-result" aria-live="polite"></div><button id="v12SubmitRecall" class="primary" type="button" style="width:100%;margin-top:9px">بررسی پاسخ</button></div>`;originalRevealButton?.insertAdjacentElement("afterend",gate);window.__KANJI5_V15_RECALL_API__?.ensureDontKnow?.(gate);window.__KANJI5_V15_RECALL_API__?.refresh?.();$("#v12RecallInput",gate)?.focus()}
  async function submitRecall(){const gate=$(".v12-recall-gate"),input=$("#v12RecallInput",gate);if(!gate||!input)return;if(!deckIndex)await loadDeckIndex();const correct=checkRecall(activeCharacter,activePrompt,input.value);if(correct===null)return;const result=$(".v12-recall-result",gate);result.className=correct?"v12-recall-result good":"v12-recall-result bad";result.textContent=correct?"✅ پاسخ درست بود":"❌ پاسخ درست نبود";recordAttempt(activeCharacter,activePrompt,correct);revealCanonical()}
  function revealCanonical(){allowNativeReveal=true;try{const button=originalRevealButton||document.getElementById("revealBtn");if(button)button.click()}finally{allowNativeReveal=false}}
  window.__KANJI5_V12_REVEAL__=revealCanonical;
  window.__KANJI5_V12_OPEN_RECALL__=makeRecallGate;
  document.addEventListener("click",async event=>{const target=event.target;if(target?.id==="v12SubmitRecall"){event.preventDefault();await submitRecall()}});
  const observer=new MutationObserver(async()=>{if(!(document.querySelector(".kanji[data-kanji-id]")))return;if(!deckIndex)await loadDeckIndex()});observer.observe(document.documentElement,{childList:true,subtree:true});if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>loadDeckIndex(),{once:true});else loadDeckIndex();
})();