import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { ComponentBreakdown } from "./ComponentBreakdown";
import { applyLanguage, formatNumber, getLanguage, localizeDynamic, setLanguage as persistLanguage, t, type Language } from "./i18n";
import {
  clearTransient,
  dontKnow,
  getComponentInfo,
  searchKanji,
  nextExercise,
  rateLearning,
  resetProgress,
  snapshot as readSnapshot,
  revealLearning,
  startExercise,
  startLearningExperience,
  submitExercise,
  updateSettings,
  type Rating,
  type ComponentInfo,
  type KanjiDictionaryResult,
  type Settings,
  type Snapshot,
  waitForEngine,
} from "./engine";

const fa=(v:number)=>formatNumber(v,getLanguage());
const text=(v:unknown,fallback="—")=>String(v??"").trim()||fallback;
const pct=(v:number|undefined)=>Math.round(Math.max(0,Math.min(1,Number(v)||0))*100);
const toHiragana=(value:string)=>Array.from(value).map(ch=>{const code=ch.charCodeAt(0);return code>=0x30a1&&code<=0x30f6?String.fromCharCode(code-0x60):ch}).join("");
const skillLabel=(key:string)=>({meaning:t("meaning"),reading:t("reading"),production:t("production"),vocabulary:t("vocabulary"),context:t("context")} as Record<string,string>)[key]??text(key);
const stateLabel=(key:string)=>localizeDynamic(key,getLanguage(),text(key));
const actionLabel=(key:string)=>localizeDynamic(key,getLanguage(),text(key));
const skillKeys=["meaning","reading","production","vocabulary","context"] as const;
const outcomeLabel=(key:string)=>({correct:t("correct"),wrong:t("wrong"),unknown:t("unknown"),near_miss:t("nearMiss"),empty:t("empty"),invalid:t("unavailable")} as Record<string,string>)[key]??text(key);

function Progress({value,label}:{value:number;label:string}){return <div className="progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}><span style={{width:Math.max(0,Math.min(100,value))+"%"}}/></div>}
function Audio({value,label}:{value:string;label:string}){const unsupported=typeof window.speechSynthesis?.speak!=="function"||typeof window.SpeechSynthesisUtterance!=="function";return <button className="audio-button" type="button" disabled={unsupported} aria-label={unsupported?t("audioUnavailable"):label} onClick={()=>{if(unsupported)return;const u=new SpeechSynthesisUtterance(value);u.lang="ja-JP";u.rate=.85;window.speechSynthesis.cancel();window.speechSynthesis.speak(u)}}>🔊</button>}

const ratingOptions=(language:Language)=>language==="en"?([["Easy",t("easy")],["Good",t("good")],["Hard",t("hard")],["Again",t("again")]] as const):([["Again",t("again")],["Hard",t("hard")],["Good",t("good")],["Easy",t("easy")]] as const);

function Learning({card,onReveal,onRate}:{card:NonNullable<Snapshot["learning"]>;onReveal:()=>void;onRate:(r:Rating)=>void}){
  const revealed=Boolean(card.revealed);
  const [componentInfo,setComponentInfo]=useState<ComponentInfo|null>(null);
  const [hiraganaReadings,setHiraganaReadings]=useState(false);
  useEffect(()=>{
    let active=true;
    if(!revealed||!card.character){setComponentInfo(null);return ()=>{active=false};}
    setComponentInfo(null);
    void getComponentInfo(card.character).then(info=>{if(active)setComponentInfo(info)}).catch(()=>{if(active)setComponentInfo(null)});
    return ()=>{active=false};
  },[revealed,card.character]);
  useEffect(()=>{setHiraganaReadings(false)},[card.character]);
  const displayedOn=(card.on??[]).map(v=>hiraganaReadings?toHiragana(v):v);
  const displayedKun=(card.kun??[]).map(v=>hiraganaReadings?toHiragana(v):v);
  const exampleCount=(card.examples??[]).length;
  const componentCount=componentInfo?.available?(componentInfo.components??[]).length:0;
  const readingCount=displayedOn.length+displayedKun.length;
  const densityScore=exampleCount*2+Math.min(componentCount,4)+Math.min(readingCount,6);
  const density=densityScore>=10?"dense":densityScore>=6?"compact":"comfortable";
  const hasExamplesPage=exampleCount>2||(componentCount>=3&&exampleCount>0)||(density==="dense"&&exampleCount>0);
  const backPageCount=hasExamplesPage?2:1;
  const [backPage,setBackPage]=useState(0);
  const swipeStartX=useRef<number|null>(null);
  useEffect(()=>setBackPage(0),[card.character]);
  const changeBackPage=useCallback((delta:number)=>setBackPage(page=>Math.max(0,Math.min(backPageCount-1,page+delta))),[backPageCount]);
  const handleBackPointerDown=(event:PointerEvent<HTMLDivElement>)=>{
    if(backPageCount<2)return;
    swipeStartX.current=event.clientX;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const handleBackPointerUp=(event:PointerEvent<HTMLDivElement>)=>{
    if(backPageCount<2||swipeStartX.current===null)return;
    const delta=event.clientX-swipeStartX.current;
    swipeStartX.current=null;
    if(event.currentTarget.hasPointerCapture?.(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
    if(Math.abs(delta)<48)return;
    changeBackPage(delta<0?1:-1);
  };
  return <section className={"surface card learning-card "+(revealed?"is-revealed":"")} data-card-density={density} data-example-count={exampleCount} data-component-count={componentCount} data-reading-count={readingCount} data-back-page-count={backPageCount} aria-label={t("learningCard")}>
    <div className="learning-card-flip" aria-live="polite">
      <div className="learning-card-face learning-card-front" aria-hidden={revealed}>
        <div className="card-topline"><span className="badge badge-red">学習</span><span className={card.isNew?"badge badge-red":"badge"}>{card.isNew?t("newKanji"):t("learningReview")}</span></div>
        <h2>{t("learningCard")}</h2>
        <div className="kanji-row"><span className="kanji-display" lang="ja">{text(card.character)}</span>{card.character?<Audio value={card.character} label={t("playKanjiPronunciation")}/>:null}</div>
        <div className="first-readings" lang="ja">{[...(card.on??[]),...(card.kun??[])].slice(0,3).join(" · ")}</div>
        <button className="button primary wide" type="button" onClick={onReveal} disabled={revealed}>{localizeDynamic(card.revealLabel,getLanguage(),t("showKanjiInfo"))}</button>
      </div>
      <div className="learning-card-face learning-card-back" aria-hidden={!revealed}>
        <div className="card-topline"><span className="badge badge-red">学習</span><span>{t("cardBack")}</span></div>
        <div className="learning-back-pager-shell" onPointerDown={handleBackPointerDown} onPointerUp={handleBackPointerUp} onPointerCancel={()=>{swipeStartX.current=null;}} data-page-count={backPageCount}>
          <div className="learning-back-pager-track" style={{transform:`translateX(-${backPage*100}%)`}}>
            <div className={"learning-back-page"+(backPage===0?" active":"")} aria-label={getLanguage()==="fa"?"صفحه اطلاعات اصلی":"Core information"} aria-hidden={backPage!==0}>
              <div className="learning-back-scroll">
                <div className="learning-back-overview">
                  {componentInfo?.available&&componentInfo.components.length
                    ? <ComponentBreakdown info={componentInfo} title={getLanguage()==="fa"?"ساختار کانجی":"Kanji structure"} note={getLanguage()==="fa"?"اجزای دیداری":"Visual components"} ariaLabel={getLanguage()==="fa"?"ساختار دیداری کانجی":"Kanji visual structure"}/>
                    : <div className="learning-back-kanji" lang="ja">{text(card.character)}</div>}
                  {card.meanings?.length?<div className="meanings learning-back-meaning">{card.meanings.join(" · ")}</div>:null}
                  <div className="readings-header"><span>{getLanguage()==="fa"?"خوانش‌ها":"Readings"}</span><button className="reading-toggle" type="button" aria-pressed={hiraganaReadings} onClick={()=>setHiraganaReadings(v=>!v)}>{hiraganaReadings?(getLanguage()==="fa"?"نمایش کاتاکانا":"Show Katakana"):(getLanguage()==="fa"?"نمایش هیراگانا":"Show Hiragana")}</button></div>
                  <div className="readings learning-back-readings"><Reading title="On’yomi" values={displayedOn}/><Reading title="Kun’yomi" values={displayedKun}/></div>
                </div>
                {!hasExamplesPage&&card.examples?.length?<div className="examples compact-examples"><h3>{t("vocabularyExamples")}</h3>{card.examples.map((e,i)=><div className="example-row" key={(e.word??"")+"-"+i} lang="ja"><span className="example-content"><span className="example-main">{[e.word,e.reading].filter(Boolean).join(" · ")}</span>{e.meaning?<small className="example-meaning">{e.meaning}</small>:null}</span>{e.reading?<Audio value={e.reading} label={t("playWordPronunciation")}/>:null}</div>)}</div>:null}
              </div>
            </div>
            {hasExamplesPage?<div className={"learning-back-page"+(backPage===1?" active":"")} aria-label={t("vocabularyExamples")} aria-hidden={backPage!==1}>
              <div className="learning-back-scroll">
                <div className="examples compact-examples">
                  <h3>{t("vocabularyExamples")}</h3>
                  {card.examples?.map((e,i)=><div className="example-row" key={(e.word??"")+"-"+i} lang="ja"><span className="example-content"><span className="example-main">{[e.word,e.reading].filter(Boolean).join(" · ")}</span>{e.meaning?<small className="example-meaning">{e.meaning}</small>:null}</span>{e.reading?<Audio value={e.reading} label={t("playWordPronunciation")}/>:null}</div>)}
                </div>
              </div>
            </div>:null}
          </div>
        </div>
        <div className="learning-back-footer">
          {backPageCount>1?<div className="learning-back-page-nav" role="group" aria-label={t("cardPage")}>
            <button className="pager-button" type="button" aria-label={t("previousCardPage")} onClick={()=>changeBackPage(-1)} disabled={backPage===0}>‹</button>
            <span className="pager-status" aria-live="polite">{backPage+1} / {backPageCount}</span>
            <button className="pager-button" type="button" aria-label={t("nextCardPage")} onClick={()=>changeBackPage(1)} disabled={backPage===backPageCount-1}>›</button>
            <span className="pager-hint">{t("swipeForMore")}</span>
          </div>:null}
          <div className="rating-grid">{ratingOptions(getLanguage()).map(([r,l])=><button className={"button rating rating-"+r.toLowerCase()} key={r} type="button" onClick={()=>onRate(r)}>{l}</button>)}</div>
        </div>
      </div>
    </div>
  </section>
}
function Reading({title,values}:{title:string;values:string[]}){return <div className="reading"><span>{title}</span><strong lang="ja">{values.length?values.join(" · "):"—"}</strong>{values[0]?<Audio value={values[0]} label={t("playReading")+" "+title}/>:null}</div>}
function Stimulus({ex}:{ex:NonNullable<Snapshot["exercise"]>}){
  const s=ex.stimulus??{};if(s.kind==="meaning")return <div className="stimulus meaning-stimulus"><small>{t("meaning")}</small><strong>{text(s.primary??ex.prompt)}</strong></div>;
  if(s.kind==="masked-vocabulary")return <div className="stimulus text-stimulus" lang="ja"><strong>{text(s.primary)}</strong>{s.secondary?<span>{s.secondary}</span>:null}{s.translation?<small>{s.translation}</small>:null}</div>;
  if(s.kind==="masked-context")return <div className="stimulus context-stimulus" lang="ja" dir="ltr"><strong>{text(s.primary)}</strong>{s.translation?<small>{s.translation}</small>:null}</div>;
  return <div className="stimulus kanji-stimulus" lang="ja">{text(s.primary??ex.character)}</div>;
}
function Exercise({snapshot,busy,onSubmit,onDontKnow,onNext}:{snapshot:Snapshot;busy:boolean;onSubmit:(v:string)=>Promise<unknown>;onDontKnow:()=>Promise<unknown>;onNext:()=>Promise<unknown>}){
  const ex=snapshot.exercise??{},[answer,setAnswer]=useState(""),[result,setResult]=useState<{correct:boolean;outcome:string;answerHint?:string}|null>(null),choices=(ex.choices??[]).slice(0,4),production=ex.mode==="production"&&choices.length>=4;
  const lockedRef=useRef(false);
  const exerciseKey=String(ex.contentId??"")+"|"+String(ex.mode??"")+"|"+String(ex.character??"");
  const previousKeyRef=useRef(exerciseKey);

  useEffect(()=>{
    if(previousKeyRef.current!==exerciseKey){
      previousKeyRef.current=exerciseKey;
      lockedRef.current=false;
      setAnswer("");
      setResult(null);
    }
  },[exerciseKey]);

  const waitForFeedbackAnimation=useCallback(async(correct:boolean)=>{
    const reduced=typeof window!=="undefined"&&window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches===true;
    const delay=correct?700:1400;
    await new Promise(resolve=>window.setTimeout(resolve,reduced?100:delay));
  },[]);

  const finishAndAdvance=useCallback(async(feedback:{correct?:boolean;outcome?:string;answerHint?:string}|null)=>{
    if(!feedback||typeof feedback.correct!=="boolean")return;
    setResult({correct:feedback.correct,outcome:String(feedback.outcome??(feedback.correct?"correct":"wrong")),answerHint:feedback.answerHint});
    await waitForFeedbackAnimation(feedback.correct);
    await onNext();
  },[onNext,waitForFeedbackAnimation]);

  const handleSubmit=async(value:string)=>{
    if(!value.trim()||busy||lockedRef.current)return;
    lockedRef.current=true;
    try{
      if(ex.mode==="production"&&ex.character){
        const correct=value===ex.character;
        setResult({correct,outcome:correct?"correct":"wrong",answerHint:correct?undefined:ex.character});
        await onSubmit(value);
        await waitForFeedbackAnimation(correct);
        await onNext();
        return;
      }
      const raw=await onSubmit(value);
      const feedback=(raw&&typeof raw==="object"?raw:null) as {correct?:boolean;outcome?:string;answerHint?:string}|null;
      await finishAndAdvance(feedback);
    }catch(_){
      lockedRef.current=false;
    }
  };

  const handleDontKnow=async()=>{
    if(busy||lockedRef.current)return;
    lockedRef.current=true;
    try{
      const raw=await onDontKnow();
      const feedback=(raw&&typeof raw==="object"?raw:null) as {correct?:boolean;outcome?:string}|null;
      await finishAndAdvance({correct:false,outcome:String(feedback?.outcome??"unknown")});
    }catch(_){
      lockedRef.current=false;
    }
  };

  const resultClass=result?(result.correct?" exercise-result-correct":" exercise-result-wrong"):"";
  const revealedAnswer=!result?.correct?(result?.answerHint||ex.answerHint||ex.character):undefined;
  const resultLabel=result?(result.correct?t("correct"):result.outcome==="unknown"?t("unknown"):t("wrong")):undefined;
  const disabled=busy||lockedRef.current||Boolean(result);

  return <section id="exercise" data-result={result?(result.correct?"correct":"wrong"):undefined} aria-label={resultLabel} className={"surface card exercise-card"+resultClass} tabIndex={-1}>
    <div className="card-topline"><span className="badge">{skillLabel(ex.mode??"")}</span><span>{t("activeRecallLabel")}</span></div>
    <h2>{t("currentExercise")}</h2>
    <p className="prompt">{localizeDynamic(ex.prompt,getLanguage(),t("exerciseReady"))}</p>
    {!ex.mode?<div className="empty-state">{t("exerciseReady")}</div>:<><Stimulus ex={ex}/>{result?<div className="exercise-feedback" role="status"><strong>{result.correct?t("correct"):result.outcome==="unknown"?t("unknown"):t("wrong")}</strong>{revealedAnswer?<div className="exercise-correct-answer"><span>پاسخ درست:</span><b lang="ja">{text(revealedAnswer)}</b></div>:null}</div>:<>
      {production?<div className="production-grid">{choices.map(c=><button className="button production-choice" type="button" key={c} lang="ja" disabled={disabled} onClick={()=>void handleSubmit(c)}>{c}</button>)}</div>:<label className="answer-area"><span>{t("answerYourself")}</span><input autoFocus value={answer} disabled={disabled} onChange={e=>setAnswer(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();void handleSubmit(answer)}}} placeholder={localizeDynamic(ex.stimulus?.inputPlaceholder,getLanguage(),t("answerPlaceholder"))}/></label>}
      <div className="actions">{!production?<button className="button primary" type="button" disabled={disabled||!answer.trim()} onClick={()=>void handleSubmit(answer)}>{t("checkAnswer")}</button>:null}<button className="button secondary" type="button" disabled={disabled} onClick={()=>void handleDontKnow()}>{t("dontKnow")}</button></div>
    </>}</>}
  </section>
}
function Panel({title,children}:{title:string;children:ReactNode}){return <section className="surface insight-panel"><h3>{title}</h3>{children}</section>}
function Insights({snapshot}:{snapshot:Snapshot}){return <details className="insights"><summary>{t("sessionDetails")}</summary><div className="insights-grid">
  <Panel title={t("learnerSkills")}>{skillKeys.map(k=>{const s=snapshot.learner?.attributes?.[k]??{};return <p className="row" key={k}><span>{skillLabel(k)}</span><strong>{stateLabel(s.state??"")} · {t("recent")} {fa(pct(s.recentAccuracy))}%</strong></p>})}</Panel>
  <Panel title={t("adaptiveFocus")}><p className="row"><span>{t("skill")}</span><strong>{skillLabel(snapshot.adaptiveReason?.mode??"")}</strong></p><p className="row"><span>{t("action")}</span><strong>{actionLabel(snapshot.adaptiveReason?.action??"")}</strong></p>{(snapshot.adaptiveReason?.reasons??[]).filter(Boolean).map((r,i)=><p className="reason" key={r+"-"+i}>{r}</p>)}</Panel>
  <Panel title={t("sessionSummary")}><p className="row"><span>{t("attempts")}</span><strong>{fa(snapshot.sessionSummary?.attempts??0)}</strong></p><p className="row"><span>{t("right")}</span><strong>{fa(snapshot.sessionSummary?.correct??0)}</strong></p><p className="row"><span>{t("accuracy")}</span><strong>{fa(pct(snapshot.sessionSummary?.accuracy))}{getLanguage()==="fa"?"٪":"%"}</strong></p></Panel>
  <Panel title={t("recentResults")}>{(snapshot.recentOutcomes??[]).map((r,i)=><div className="outcome-row" key={(r.character??"")+"-"+i}><strong lang="ja">{text(r.character)}</strong><span>{skillLabel(r.mode??"")} · {outcomeLabel(r.quality??r.outcome??"")}</span><b>{r.correct?"✓":outcomeLabel(r.outcome??"")}</b></div>)}{!snapshot.recentOutcomes?.length?<p className="empty-text">{t("noResults")}</p>:null}</Panel>
</div></details>}
function Setting({label,value,min,max,onChange}:{label:string;value:number;min:number;max:number;onChange:(v:number)=>void}){return <label className="setting-row"><span>{label}</span><input type="number" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))}/></label>}
function DictionaryDialog({open,busy,language,onClose}:{open:boolean;busy:boolean;language:Language;onClose:()=>void}){
  const [query,setQuery]=useState("");
  const [results,setResults]=useState<KanjiDictionaryResult[]>([]);
  const [searching,setSearching]=useState(false);
  useEffect(()=>{if(!open){setQuery("");setResults([]);setSearching(false)}},[open]);
  useEffect(()=>{
    if(!open)return;
    const clean=query.trim();
    if(!clean){setResults([]);setSearching(false);return}
    let active=true;
    setSearching(true);
    const timer=window.setTimeout(()=>{
      void searchKanji(clean,24).then(value=>{if(active){setResults(value.results);setSearching(false)}}).catch(()=>{if(active){setResults([]);setSearching(false)}});
    },120);
    return ()=>{active=false;window.clearTimeout(timer)};
  },[open,query]);
  return open?<dialog open className="dialog dictionary-dialog" aria-labelledby="dictionary-title">
    <button className="dialog-close" type="button" aria-label={t("close",language)} onClick={onClose}>×</button>
    <h2 id="dictionary-title">{t("dictionaryTitle",language)}</h2>
    <label className="dictionary-search"><span className="sr-only">{t("dictionaryTitle",language)}</span><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("dictionaryPlaceholder",language)} aria-label={t("dictionaryPlaceholder",language)} /></label>
    {!query.trim()?<p className="dictionary-hint">{t("dictionaryHint",language)}</p>:searching?<p className="dictionary-hint" role="status">{t("dictionarySearching",language)}</p>:!results.length?<p className="dictionary-hint">{t("dictionaryNoResults",language)}</p>:<div className="dictionary-results" role="list">
      {results.map(result=><article className="dictionary-result" role="listitem" key={result.character}>
        <div className="dictionary-character" lang="ja">{result.character}</div>
        <div className="dictionary-detail">
          <div className="dictionary-meanings">{result.meanings.join(" · ")||"—"}</div>
          <div className="dictionary-readings">
            {result.on.length?<div><span>{t("dictionaryOn",language)}</span><b lang="ja">{result.on.join(" · ")}</b></div>:null}
            {result.kun.length?<div><span>{t("dictionaryKun",language)}</span><b lang="ja">{result.kun.join(" · ")}</b></div>:null}
          </div>
          <div className="dictionary-meta">
            {result.jlpt?<span>{t("dictionaryJlpt",language)} {result.jlpt}</span>:null}
            {result.grade?<span>{t("dictionaryGrade",language)} {fa(result.grade)}</span>:null}
            {result.strokes?<span>{t("dictionaryStrokes",language)} {fa(result.strokes)}</span>:null}
            {result.frequency?<span>{t("dictionaryFrequency",language)} #{fa(result.frequency)}</span>:null}
          </div>
        </div>
      </article>)}
    </div>}
  </dialog>:null;
}

function SettingsDialog({open,snapshot,busy,language,onLanguageChange,onClose,onSave,onReset}:{open:boolean;snapshot:Snapshot;busy:boolean;language:Language;onLanguageChange:(language:Language)=>void;onClose:()=>void;onSave:(s:Settings)=>void;onReset:()=>void}){
  const s=snapshot.settings??{dailyNew:5,dailyGoal:20,leechThreshold:8,production:true,vocabulary:true,context:true};const [draft,setDraft]=useState<Settings>(s);
  useEffect(()=>{if(open)setDraft(s)},[open,s.dailyNew,s.dailyGoal,s.leechThreshold,s.production,s.vocabulary,s.context]);
  return open?<dialog open className="dialog" aria-labelledby="settings-title"><button className="dialog-close" type="button" aria-label={t("close",language)} onClick={onClose}>×</button><h2 id="settings-title">{t("settingsTitle",language)}</h2><form className="settings-form" onSubmit={e=>{e.preventDefault();onSave(draft)}}><div className="settings-section"><div className="settings-section-title">{t("language",language)}</div><div className="settings-language-switcher" role="group" aria-label={t("language",language)}><button className={"settings-language-button "+(language==="fa"?"active":"")} type="button" aria-pressed={language==="fa"} onClick={()=>onLanguageChange("fa")}>{t("persian",language)}</button><button className={"settings-language-button "+(language==="en"?"active":"")} type="button" aria-pressed={language==="en"} onClick={()=>onLanguageChange("en")}>{t("english",language)}</button></div></div>
    <Setting label={t("newKanjiPerDay")} value={draft.dailyNew} min={1} max={30} onChange={v=>setDraft({...draft,dailyNew:v})}/><Setting label={t("dailyReviewGoal")} value={draft.dailyGoal} min={1} max={500} onChange={v=>setDraft({...draft,dailyGoal:v})}/><Setting label={t("leechThreshold")} value={draft.leechThreshold} min={2} max={30} onChange={v=>setDraft({...draft,leechThreshold:v})}/>
    {([["production",t("productionKanji")],["vocabulary",t("completeVocabulary")],["context",t("contextRecall")]] as const).map(([k,l])=><label className="setting-row" key={k}><span>{l}</span><input type="checkbox" checked={draft[k]} onChange={e=>setDraft({...draft,[k]:e.target.checked})}/></label>)}
    <div className="actions"><button className="button primary" type="submit" disabled={busy}>{t("save")}</button><button className="button secondary" type="button" onClick={onClose}>{t("close")}</button><button className="button secondary" type="button" disabled={busy} onClick={onReset}>{t("resetProgress")}</button></div>
  </form></dialog>:null;
}
function App(){
  const [snapshot,setSnapshot]=useState<Snapshot|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[experience,setExperience]=useState<"review"|"practice">("review"),[statsOpen,setStatsOpen]=useState(false),[dictionaryOpen,setDictionaryOpen]=useState(false),[settingsOpen,setSettingsOpen]=useState(false),[headerMenuOpen,setHeaderMenuOpen]=useState(false),[language,setLanguageState]=useState<Language>(()=>getLanguage());
  useEffect(()=>applyLanguage(language),[language]);
  const changeLanguage=(next:Language)=>{persistLanguage(next);setLanguageState(next)};
  const refresh=useCallback(async()=>{const s=await readSnapshot();setSnapshot(s);return s},[]);
  useEffect(()=>{let mounted=true;void startLearningExperience().catch(()=>{});const listener=(e:Event)=>{const d=(e as CustomEvent<Snapshot>).detail;if(mounted&&d)setSnapshot(d)};void refresh().then(()=>document.addEventListener("kanji5:v1.9-v2-view-models",listener)).catch(e=>{if(mounted)setError(e instanceof Error?e.message:t("learningCoreError"))});return()=>{mounted=false;document.removeEventListener("kanji5:v1.9-v2-view-models",listener)}},[refresh]);
  async function action<T>(task:()=>Promise<T>):Promise<T|undefined>{setBusy(true);setError("");try{const result=await task();setSnapshot(await readSnapshot());return result}catch(e){setError(e instanceof Error?e.message:language==="fa"?"عملیات انجام نشد.":"The operation failed.");return undefined}finally{setBusy(false)}}
  const progress=pct(snapshot?.session?.completionFraction);const hasSessionProgress=snapshot?.session?.status==="active"&&Number(snapshot?.session?.plannedTotal||0)>0;const showExercise=experience==="practice";
  if(error&&!snapshot)return <div className="app-shell centered"><section className="surface fatal"><span className="fatal-kanji" lang="ja">迷</span><h1>{t("learningCoreError")}</h1><p>{error}</p><button className="button primary" type="button" onClick={()=>location.reload()}>{t("tryAgain")}</button></section></div>;
  return <div className="app-shell">
    <a className="skip-link" href="#primary-content">{t("goToMain")}</a>
    <header className="header"><div className="header-brand"><p className="eyebrow red">یادگیری هوشمند</p><h1>کانجی‌یار</h1></div>
      <div className="header-actions">{hasSessionProgress?<div className="session-progress"><Progress value={progress} label={t("sessionProgress")}/><span>{fa((snapshot?.session?.plannedTotal??0)-(snapshot?.session?.remainingTotal??0))} {language==="fa"?"از":"of"} {fa(snapshot?.session?.plannedTotal??0)}</span></div>:null}<div className="header-tools"><button className="button secondary header-menu-trigger" type="button" aria-expanded={headerMenuOpen} aria-controls="header-tools-menu" aria-label={language==="fa"?"بیشتر":"More"} disabled={busy} onClick={()=>setHeaderMenuOpen(v=>!v)}>☰</button><div id="header-tools-menu" className={"header-tools-menu "+(headerMenuOpen?"open":"")}><button className="button secondary" type="button" disabled={busy} onClick={()=>{setDictionaryOpen(true);setHeaderMenuOpen(false)}}>{t("dictionary")}</button><button className="button secondary" type="button" disabled={busy} onClick={()=>{setStatsOpen(true);setHeaderMenuOpen(false)}}>{t("stats")}</button><button className="button secondary" type="button" disabled={busy} onClick={()=>{setSettingsOpen(true);setHeaderMenuOpen(false)}}>{t("settings")}</button></div></div></div>
    </header>
    <nav className="experience-nav" aria-label={t("learningPath",language)}><button className={"experience-tab "+(experience==="review"?"active":"")} type="button" aria-current={experience==="review"?"page":undefined} disabled={busy} onClick={()=>void action(async()=>{await startLearningExperience();await clearTransient();setExperience("review")})}>{t("learning",language)}</button><button className={"experience-tab "+(experience==="practice"?"active":"")} type="button" aria-current={experience==="practice"?"page":undefined} disabled={busy} onClick={()=>{setExperience("practice");void action(startExercise)}}>{t("activeRecall",language)}</button></nav><main id="primary-content" className="content mobile-study-flow">
      {!showExercise?(snapshot?<DailySummary snapshot={snapshot}/>:<div className="surface loading">{t("loading")}</div>):null}
      {!showExercise&&snapshot?.dailyGoal?<section className="surface goal"><div className="goal-top"><strong>{t("dailyGoal")}: {fa(snapshot.dailyGoal.completed??0)}/{fa(snapshot.dailyGoal.target??0)}</strong><span>{snapshot.dailyGoal.celebrated?"🎉 "+t("completed"):""}</span></div><Progress value={pct(snapshot.dailyGoal.progress)} label={t("dailyGoal")}/></section>:null}
      {!showExercise&&snapshot?.upcomingReviews?.length?<details className="surface upcoming"><summary>{t("upcomingReviews")}</summary><div className="upcoming-body">{snapshot.upcomingReviews.map(r=><div className="upcoming-row" key={r.character+r.dueAt}><strong lang="ja">{r.character}</strong><span>{new Date(r.dueAt).toLocaleString(language==="fa"?"fa-IR":"en-US",{dateStyle:"medium",timeStyle:"short"})}</span></div>)}</div></details>:null}
      {showExercise?<Exercise snapshot={snapshot??{}} busy={busy} onSubmit={v=>action(()=>submitExercise(v))} onDontKnow={()=>action(dontKnow)} onNext={()=>action(nextExercise)}/>:snapshot?.learning?.active?<Learning card={snapshot.learning} onReveal={()=>void action(revealLearning)} onRate={r=>void action(async()=>{await rateLearning(r);setExperience("review")})}/>:<section className="surface empty-state"><h2>{t("noSession")}</h2><p>{t("startExercise")}</p><button className="button primary" type="button" onClick={()=>{setExperience("practice");void action(startExercise)}}>{t("startExercise")}</button></section>}
      {!showExercise&&snapshot?<Insights snapshot={snapshot}/>:null}
    </main>
    <footer className="footer">{language==="fa"?"یادگیریت را کوتاه، پیوسته و هدفمند نگه دار.":"Keep your learning short, consistent, and focused."}</footer>
    <DictionaryDialog open={dictionaryOpen} busy={busy} language={language} onClose={()=>setDictionaryOpen(false)}/>
    {statsOpen?<dialog open className="dialog" aria-labelledby="stats-title"><button className="dialog-close" type="button" aria-label={t("close")} onClick={()=>setStatsOpen(false)}>×</button><h2 id="stats-title">{t("stats")}</h2><div className="dialog-grid"><StatRow label={language==="fa"?"کل مرورها":"Total reviews"} value={fa(snapshot?.stats?.totalReviews??0)}/><StatRow label={language==="fa"?"مرورهای غیر Again":"Non-Again reviews"} value={fa(pct(snapshot?.stats?.nonAgainRate))+(language==="fa"?"٪":"%")}/><StatRow label={language==="fa"?"کانجی مطالعه‌شده":"Kanji studied"} value={fa(snapshot?.stats?.studiedCount??0)+" / "+fa(snapshot?.stats?.deckSize??0)}/><StatRow label={language==="fa"?"رشتهٔ فعلی":"Current streak"} value={fa(snapshot?.stats?.currentStreak??0)+" 🔥"}/><StatRow label={language==="fa"?"طولانی‌ترین رشته":"Longest streak"} value={fa(snapshot?.stats?.longestStreak??0)+" 🔥"}/><StatRow label="Leech" value={fa(snapshot?.stats?.leechCount??0)}/></div></dialog>:null}
    <SettingsDialog open={settingsOpen} snapshot={snapshot??{}} busy={busy} language={language} onLanguageChange={changeLanguage} onClose={()=>setSettingsOpen(false)} onSave={s=>void action(async()=>{await updateSettings(s);setSettingsOpen(false)})} onReset={()=>{const message=language==="fa"?"همهٔ پیشرفت یادگیری پاک می‌شود. این کار قابل بازگشت نیست. ادامه می‌دهید?":"All learning progress will be erased. This cannot be undone. Continue?";if(window.confirm(message))void action(async()=>{resetProgress()})}}/>
  </div>
}
function DailySummary({snapshot}:{snapshot:Snapshot}){const s=snapshot.dailySummary??{};return <section className="daily-summary" aria-label="خلاصهٔ امروز">{([[t("todayReviews"),s.dueCount],[t("todayNewKanji"),s.newCount],[t("learned"),s.masteredCount],[t("streak"),s.streak]] as const).map(([label,value])=><div className="stat-card" key={label}><strong>{fa(Number(value)||0)}</strong><span>{label}</span></div>)}</section>}
function StatRow({label,value}:{label:string;value:string}){return <div className="stat-row"><span>{label}</span><strong>{value}</strong></div>}
export { App };
// Production presentation: learning card reveal uses the flip interaction.

// Pages deployment uses source-built React artifact.
// Bilingual UI verified on dedicated release branch.
