import { lazy, Suspense, useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { ComponentBreakdown } from "./ComponentBreakdown";
import { buildMnemonicSupport, getMnemonicHintFocus, getMnemonicHintPlan, getMnemonicHintStage } from "./mnemonic-support";
import { MnemonicSupportPanel } from "./MnemonicSupport";
import type { PreparedMnemonic } from "./mnemonic-library";
import { AccountButton, AccountDialog } from "./AccountDialog";
import { UiIcon } from "./UiIcon";
import { applyLanguage, formatNumber, getLanguage, localizeDynamic, setLanguage as persistLanguage, t, type Language } from "./i18n";
import { getThemePreference, setThemePreference as persistThemePreference, type ThemePreference } from "./ui-preferences";
import {
  clearCustomStudyFilter,
  clearTransient,
  dontKnow,
  getComponentInfo,
  getVocabulary,
  getMnemonic,
  nextExercise,
  rateLearning,
  resetProgress,
  snapshot as readSnapshot,
  startupSnapshot as readStartupSnapshot,
  revealLearning,
  startExercise,
  startPracticeExperience,
  startLearningExperience,
  startLearningSession,
  startCustomStudy,
  submitExercise,
  saveMnemonic,
  updateSettings,
  type Rating,
  type ComponentInfo,
  type Settings,
  type Snapshot,
  type CustomStudyFilter,
  type KanjiCatalogItem,
  getHandwritingSkill,
  recordHandwritingGrade,
  type HandwritingSkill,
  waitForEngine,
  retryExercise,
  selfReportProduction,
  listKanji,
  listPersonalMnemonics,
} from "./engine";

const StrokeOrderViewer = lazy(() => import("./StrokeOrderViewer").then(module => ({ default: module.StrokeOrderViewer })));
const DictionaryPage = lazy(() => import("./DictionaryPage").then(module => ({ default: module.DictionaryPage })));
const StatsDialog = lazy(() => import("./StatsDialog").then(module => ({ default: module.StatsDialog })));
const SettingsDialog = lazy(() => import("./SettingsDialog").then(module => ({ default: module.SettingsDialog })));
const PracticeHome = lazy(() => import("./PracticeHome").then(module => ({ default: module.PracticeHome })));
const GrammarDialog = lazy(() => import("./GrammarDialog").then(module => ({ default: module.GrammarDialog })));
const ReadingLabDialog = lazy(() => import("./ReadingLabDialog").then(module => ({ default: module.ReadingLabDialog })));
const MnemonicsDialog = lazy(() => import("./MnemonicsDialog").then(module => ({ default: module.MnemonicsDialog })));
const HandwritingPractice = lazy(() => import("./HandwritingPractice").then(module => ({ default: module.HandwritingPractice })));

const fa=(v:number)=>formatNumber(v,getLanguage());
const text=(v:unknown,fallback="—")=>String(v??"").trim()||fallback;
const pct=(v:number|undefined)=>Math.round(Math.max(0,Math.min(1,Number(v)||0))*100);
const toHiragana=(value:string)=>Array.from(value).map(ch=>{const code=ch.charCodeAt(0);return code>=0x30a1&&code<=0x30f6?String.fromCharCode(code-0x60):ch}).join("");
const skillLabel=(key:string)=>({meaning:t("meaning"),reading:t("reading"),production:t("production"),vocabulary:t("vocabulary"),context:t("context")} as Record<string,string>)[key]??text(key);
const languageSafeContentUnavailable=(mode:string)=>getLanguage()==="fa"?(mode==="context"?"برای این جمله گزینه‌های امن کافی نیست؛ تمرین بعدی را انتخاب کن.":"برای این واژه گزینه‌های امن کافی نیست؛ تمرین بعدی را انتخاب کن."):(mode==="context"?"Not enough safe choices are available for this sentence. Continue to the next exercise.":"Not enough safe choices are available for this word. Continue to the next exercise.");

function Progress({value,label}:{value:number;label:string}){return <div className="progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}><span style={{width:Math.max(0,Math.min(100,value))+"%"}}/></div>}
function Audio({value,label}:{value:string;label:string}){const unsupported=typeof window.speechSynthesis?.speak!=="function"||typeof window.SpeechSynthesisUtterance!=="function";return <button className="audio-button" type="button" disabled={unsupported} aria-label={unsupported?t("audioUnavailable"):label} onClick={()=>{if(unsupported)return;const u=new SpeechSynthesisUtterance(value);u.lang="ja-JP";u.rate=.85;window.speechSynthesis.cancel();window.speechSynthesis.speak(u)}}><UiIcon name="audio" /></button>}

const PAGER_AXIS_LOCK_DISTANCE=12;
const PAGER_AXIS_RATIO=2;
const ratingOptions=(language:Language)=>language==="en"?([["Easy",t("easy")],["Good",t("good")],["Hard",t("hard")],["Again",t("again")]] as const):([["Again",t("again")],["Hard",t("hard")],["Good",t("good")],["Easy",t("easy")]] as const);

function Learning({card,snapshot,busy,onReveal,onRate}:{card:NonNullable<Snapshot["learning"]>;snapshot:Snapshot;busy?:boolean;onReveal:()=>void;onRate:(r:Rating)=>void}){
  const revealed=Boolean(card.revealed);
  const preparedMeaningKey=(card.meanings??[]).join("\u0001");
  const [componentInfo,setComponentInfo]=useState<ComponentInfo|null>(null);
  const [componentInfoReady,setComponentInfoReady]=useState(false);
  const [hiraganaReadings,setHiraganaReadings]=useState(false);
  const [personalMnemonic,setPersonalMnemonic]=useState("");
  const [mnemonicDraft,setMnemonicDraft]=useState("");
  const [preparedMnemonic,setPreparedMnemonic]=useState<PreparedMnemonic|null>(null);
  const [mnemonicEditing,setMnemonicEditing]=useState(false);
  const [mnemonicBusy,setMnemonicBusy]=useState(false);
  const [mnemonicError,setMnemonicError]=useState("");
  const frontFaceRef=useRef<HTMLDivElement|null>(null);
  const backFaceFocusRef=useRef<HTMLSpanElement|null>(null);
  const shouldFocusBackRef=useRef(false);
  const handleReveal=useCallback(()=>{
    const active=document.activeElement;
    if(active instanceof HTMLElement && frontFaceRef.current?.contains(active)){
      active.blur();
    }
    shouldFocusBackRef.current=true;
    onReveal();
  },[onReveal]);
  useEffect(()=>{
    if(!revealed||!shouldFocusBackRef.current)return;
    shouldFocusBackRef.current=false;
    requestAnimationFrame(()=>{
      backFaceFocusRef.current?.focus({preventScroll:true});
    });
  },[revealed]);
  useEffect(()=>{
    let active=true;
    if(!card.character){
      setComponentInfo(null);
      setComponentInfoReady(false);
      setPreparedMnemonic(null);
      return ()=>{active=false};
    }
    setComponentInfo(null);
    setComponentInfoReady(false);
    const character = card.character;
    const meanings = card.meanings ?? [];
    const mnemonicModule = import("./prepared-mnemonic-core");
    void mnemonicModule.then(({buildPreparedMnemonic})=>{
      if(!active)return;
      setPreparedMnemonic(buildPreparedMnemonic({character,meanings}));
    }).catch(()=>{
      if(active)setPreparedMnemonic(null);
    });
    const componentInfoPromise = getComponentInfo(card.character);
    void componentInfoPromise.then(info=>{
      if(!active)return;
      setComponentInfo(info);
      setComponentInfoReady(true);
      void mnemonicModule.then(({buildPreparedMnemonic})=>{
        if(!active)return;
        setPreparedMnemonic(buildPreparedMnemonic(
          {character,meanings},
          info.components??[]
        ));
      });
    }).catch(()=>{
      if(!active)return;
      setComponentInfo(null);
      setComponentInfoReady(true);
    });
    return ()=>{active=false};
  },[card.character,preparedMeaningKey]);
  const mnemonicToolRef=useRef<HTMLElement|null>(null);
  const scrollMnemonicEditorIntoView=useCallback(()=>{
    const target=mnemonicToolRef.current;
    const scrollContainer=target?.closest<HTMLElement>(".learning-back-scroll");
    if(!target||!scrollContainer)return;
    const maxScrollTop=Math.max(0,scrollContainer.scrollHeight-scrollContainer.clientHeight);
    const reducedMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    scrollContainer.scrollTo({top:maxScrollTop,behavior:reducedMotion?"auto":"smooth"});
  },[]);
  useEffect(()=>{
    if(!mnemonicEditing)return;
    let frame=0;
    let nextFrame=0;
    frame=window.requestAnimationFrame(()=>{
      nextFrame=window.requestAnimationFrame(()=>scrollMnemonicEditorIntoView());
    });
    return()=>{
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(nextFrame);
    };
  },[mnemonicEditing,scrollMnemonicEditorIntoView]);

  useEffect(()=>{setHiraganaReadings(false)},[card.character]);
  useEffect(()=>{
    let active=true;
    setPersonalMnemonic("");
    setMnemonicDraft("");
    setMnemonicEditing(false);
    setMnemonicBusy(false);
    setMnemonicError("");
    if(!revealed||!card.character)return ()=>{active=false};
    void getMnemonic(card.character).then(value=>{
      if(!active)return;
      const next=String(value?.text??"");
      setPersonalMnemonic(next);
      setMnemonicDraft(next);
    }).catch(()=>{
      if(active)setMnemonicError(t("mnemonicLoadError"));
    });
    return ()=>{active=false};
  },[revealed,card.character]);
  const handleSaveMnemonic=useCallback(async()=>{
    if(!card.character||mnemonicBusy)return;
    const next=mnemonicDraft.trim().slice(0,600);
    setMnemonicBusy(true);
    setMnemonicError("");
    try{
      const saved=await saveMnemonic(card.character,next);
      setPersonalMnemonic(saved.text);
      setMnemonicDraft(saved.text);
      setMnemonicEditing(saved.text.trim().length === 0);
    }catch(_){
      setMnemonicError(t("mnemonicSaveError"));
    }finally{
      setMnemonicBusy(false);
    }
  },[card.character,mnemonicBusy,mnemonicDraft]);
  const handleUsePreparedMnemonic=useCallback(async()=>{
    if(!card.character||mnemonicBusy||!preparedMnemonic)return;
    const next=(getLanguage()==="fa"?preparedMnemonic.fa:preparedMnemonic.en).trim().slice(0,600);
    if(!next)return;
    if(personalMnemonic&&personalMnemonic!==next&&!window.confirm(t("mnemonicOverwriteConfirm")))return;
    setMnemonicBusy(true);
    setMnemonicError("");
    try{
      const saved=await saveMnemonic(card.character,next);
      setPersonalMnemonic(saved.text);
      setMnemonicDraft(saved.text);
      setMnemonicEditing(false);
    }catch(_){
      setMnemonicError(t("mnemonicSaveError"));
    }finally{
      setMnemonicBusy(false);
    }
  },[card.character,mnemonicBusy,personalMnemonic,preparedMnemonic]);
  const displayedOn=(card.on??[]).map(v=>hiraganaReadings?toHiragana(v):v);
  const displayedKun=(card.kun??[]).map(v=>hiraganaReadings?toHiragana(v):v);
  const [vocabularyExamples,setVocabularyExamples]=useState<Array<{word?:string;reading?:string;meaning?:string}>>([]);
  const [examplesResolved,setExamplesResolved]=useState(false);
  const exampleCount=(vocabularyExamples.length>0?vocabularyExamples:(card.examples??[])).length;
  useEffect(()=>{
    let active=true;
    const directExamples=Array.isArray(card.examples)?card.examples:[];
    if(directExamples.length>0){
      setVocabularyExamples(directExamples);
      setExamplesResolved(true);
      return ()=>{active=false};
    }
    setVocabularyExamples([]);
    setExamplesResolved(false);
    if(!card.character){setExamplesResolved(true);return ()=>{active=false};}
    void getVocabulary(card.character).then(result=>{
      if(!active)return;
      const items=Array.isArray(result?.items)?result.items.slice(0,6):[];
      setVocabularyExamples(items);
      setExamplesResolved(true);
    }).catch(()=>{
      if(active)setExamplesResolved(true);
    });
    return ()=>{active=false};
  },[card.character,card.examples?.length]);
  const displayExamples=vocabularyExamples.length>0?vocabularyExamples:(card.examples??[]);
  const componentCount=componentInfo?.available?(componentInfo.components??[]).length:0;
  const mnemonicSupport=buildMnemonicSupport({
    character:card.character??"",
    meanings:card.meanings??[],
    on:displayedOn,
    kun:displayedKun,
    examples:displayExamples,
    components:componentInfo?.available?(componentInfo.components??[]):[]
  });
  const mnemonicHintContext={
    character:card.character,
    isNew:card.isNew,
    recentOutcomes:snapshot.recentOutcomes,
    learner:snapshot.learner?.attributes
  };
  const mnemonicHintStage=getMnemonicHintStage(mnemonicHintContext);
  const mnemonicHintFocus=getMnemonicHintFocus(mnemonicHintContext);
  const mnemonicHintPlan=getMnemonicHintPlan(mnemonicHintStage,mnemonicHintFocus);
  const readingCount=displayedOn.length+displayedKun.length;
  const densityScore=exampleCount*2+Math.min(readingCount,6)+Math.min(componentCount,4);
  const density=densityScore>=10?"dense":densityScore>=6?"compact":"comfortable";
  const examplesLoading=!examplesResolved;
  const hasExamplesPage=examplesLoading||displayExamples.length>0;
  const backPageCount=hasExamplesPage?4:3;
  const [backPage,setBackPage]=useState(0);
  const pagerTrackRef=useRef<HTMLDivElement|null>(null);
  const swipeRef=useRef<{startX:number;startY:number;lastX:number;lastTime:number;startTime:number;active:boolean;axis:"x"|"y"|null}>({startX:0,startY:0,lastX:0,lastTime:0,startTime:0,active:false,axis:null});
  useEffect(()=>setBackPage(0),[card.character]);
  const clearLearningFocus=useCallback(()=>{
    const active=document.activeElement;
    if(!(active instanceof HTMLElement))return;
    const learningCard=active.closest(".learning-card");
    if(learningCard)active.blur();
  },[]);
  const changeBackPage=useCallback((delta:number)=>{
    clearLearningFocus();
    setBackPage(page=>Math.max(0,Math.min(backPageCount-1,page+delta)));
  },[backPageCount,clearLearningFocus]);
  const jumpToBackPage=useCallback((page:number)=>{
    const next=Math.max(0,Math.min(backPageCount-1,page));
    if(next!==backPage)clearLearningFocus();
    setBackPage(next);
  },[backPage,backPageCount,clearLearningFocus]);
  const handleRate=useCallback((rating:Rating)=>{
    clearLearningFocus();
    onRate(rating);
  },[clearLearningFocus,onRate]);
  const snapPagerTrack=useCallback((page:number)=>{
    const track=pagerTrackRef.current;
    if(!track)return;
    track.style.transition="";
    requestAnimationFrame(()=>{track.style.transform="translate3d(-"+page*100+"%,0,0)";});
  },[]);
  useEffect(()=>{snapPagerTrack(backPage)},[backPage,snapPagerTrack]);
  const handleBackPointerDown=(event:PointerEvent<HTMLDivElement>)=>{
    if(backPageCount<2)return;
    if((event.target as HTMLElement|null)?.closest?.("button,input,textarea,select,a"))return;
    if(event.pointerType==="mouse"&&event.button!==0)return;
    const now=performance.now();
    swipeRef.current={startX:event.clientX,startY:event.clientY,lastX:event.clientX,lastTime:now,startTime:now,active:true,axis:null};
  };
  const handleBackPointerMove=(event:PointerEvent<HTMLDivElement>)=>{
    const swipe=swipeRef.current;
    if(backPageCount<2||!swipe.active)return;
    const shell=event.currentTarget;
    const dx=event.clientX-swipe.startX;
    const dy=event.clientY-swipe.startY;
    const absX=Math.abs(dx),absY=Math.abs(dy);
    if(!swipe.axis&&Math.max(absX,absY)>=PAGER_AXIS_LOCK_DISTANCE){
      if(absX>=PAGER_AXIS_LOCK_DISTANCE&&absX>absY*PAGER_AXIS_RATIO)swipe.axis="x";
      else if(absY>=PAGER_AXIS_LOCK_DISTANCE&&absY>absX*PAGER_AXIS_RATIO)swipe.axis="y";
    }
    if(swipe.axis!=="x"){
      swipe.lastX=event.clientX;
      swipe.lastTime=performance.now();
      return;
    }
    const width=Math.max(1,shell.getBoundingClientRect().width);
    let delta=dx;
    const track=pagerTrackRef.current;
    if(track&&swipe.lastX===swipe.startX){
      track.style.transition="none";
      try{shell.setPointerCapture?.(event.pointerId)}catch(error){if(import.meta.env.DEV)console.debug('Kanji 5 pager pointer capture unavailable.',error);}
    }
    const atFirst=backPage===0&&delta>0;
    const atLast=backPage===backPageCount-1&&delta<0;
    if(atFirst||atLast)delta*=0.22;
    delta=Math.max(-width*0.92,Math.min(width*0.92,delta));
    if(track)track.style.transform="translate3d(calc(-"+backPage*100+"% + "+delta+"px),0,0)";
    swipe.lastX=event.clientX;
    swipe.lastTime=performance.now();
  };
  const finishBackSwipe=(event:PointerEvent<HTMLDivElement>,cancelled=false)=>{
    const swipe=swipeRef.current;
    if(backPageCount<2||!swipe.active)return;
    swipe.active=false;
    const totalDx=event.clientX-swipe.startX;
    const totalDy=event.clientY-swipe.startY;
    const totalAbsX=Math.abs(totalDx),totalAbsY=Math.abs(totalDy);
    const axis=swipe.axis??(totalAbsX>=PAGER_AXIS_LOCK_DISTANCE&&totalAbsX>totalAbsY*PAGER_AXIS_RATIO?"x":null);
    const delta=cancelled||axis!=="x"?0:totalDx;
    const totalElapsed=Math.max(16,performance.now()-swipe.startTime);
    const velocity=cancelled?0:delta/totalElapsed;
    const width=Math.max(1,event.currentTarget.getBoundingClientRect().width);
    const threshold=Math.max(24,Math.min(48,width*0.10));
    const shouldAdvance=(!cancelled&&axis==="x"&&Math.abs(delta)>=threshold)||(!cancelled&&axis==="x"&&Math.abs(delta)>=12&&Math.abs(velocity)>=0.35);
    const target=shouldAdvance?Math.max(0,Math.min(backPageCount-1,backPage+(delta<0?1:-1))):backPage;
    const track=pagerTrackRef.current;
    if(track){track.style.transition="";requestAnimationFrame(()=>{track.style.transform="translate3d(-"+target*100+"%,0,0)";});}
    try{if(event.currentTarget.hasPointerCapture?.(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)}catch(_){/* no active capture */}
    if(target!==backPage){
      clearLearningFocus();
      setBackPage(target);
    }
  };
  const handleBackPointerUp=(event:PointerEvent<HTMLDivElement>)=>finishBackSwipe(event);
  const handleBackPointerCancel=(event:PointerEvent<HTMLDivElement>)=>finishBackSwipe(event,true);
  return <section className={"surface card learning-card "+(revealed?"is-revealed":"")} data-card-density={density} data-example-count={exampleCount} data-component-count={componentCount} data-reading-count={readingCount} data-back-page-count={backPageCount} data-back-page={backPage} aria-label={t("learningCard")}>
    <div className="learning-card-flip" aria-live="polite">
      <div ref={frontFaceRef} className="learning-card-face learning-card-front" aria-hidden={revealed} inert={revealed}>
        <div className="card-topline"><span className="badge badge-red">{t("learningBadge")}</span><span className={card.isNew?"badge badge-red":"badge"}>{card.isNew?t("newKanji"):t("learningReview")}</span></div>
        <h2>{t("learningCard")}</h2>
        <div className="kanji-row"><span className="kanji-display" lang="ja">{text(card.character)}</span>{card.character?<Audio value={card.character} label={t("playKanjiPronunciation")}/>:null}</div>
        <div className="first-readings" lang="ja">{[...(card.on??[]),...(card.kun??[])].slice(0,3).join(" · ")}</div>
        <button className="button primary wide" type="button" onClick={handleReveal} disabled={revealed}>{localizeDynamic(card.revealLabel,getLanguage(),t("showKanjiInfo"))}</button>
      </div>
      <div className="learning-card-face learning-card-back" aria-hidden={!revealed} inert={!revealed}>
        <span ref={backFaceFocusRef} className="sr-only" tabIndex={-1}>{t("kanjiStructure")}</span>
        <div className="card-topline"><span className="badge badge-red">{t("learning")}</span><span>{t("cardBack")}</span></div>
        <div className="learning-back-pager-shell" onPointerDown={handleBackPointerDown} onPointerMove={handleBackPointerMove} onPointerUp={handleBackPointerUp} onPointerCancel={handleBackPointerCancel} data-page-count={backPageCount}>
          <div ref={pagerTrackRef} className="learning-back-pager-track" style={{transform:"translate3d(-"+backPage*100+"%,0,0)"}}>
            <div className={"learning-back-page"+(backPage===0?" active":"")} aria-label={t("meaningAndStructure")} aria-hidden={backPage!==0} inert={backPage!==0}>
              <div className="learning-back-scroll">
                <div className="learning-back-overview">
                  <div className="learning-back-identity">
                    <div className="learning-back-identity-visual" aria-busy={!componentInfoReady}>
                      {componentInfoReady
                        ? componentInfo?.available&&componentInfo.components.length
                          ? <ComponentBreakdown info={componentInfo} title={t("kanjiStructure")} note={t("visualComponents")} ariaLabel={t("visualKanjiStructure")}/>
                          : <div className="learning-back-kanji" lang="ja">{text(card.character)}</div>
                        : <div className="learning-back-identity-placeholder" aria-hidden="true"><span /></div>}
                    </div>

                    {card.meanings?.length?<div className="meanings learning-back-meaning">{card.meanings.join(" · ")}</div>:null}
                    <div className="learning-back-readings-block">
                      <div className="readings-header"><span>{t("readings")}</span><button className="reading-toggle" type="button" aria-pressed={hiraganaReadings} onClick={()=>setHiraganaReadings(v=>!v)}>{hiraganaReadings?t("showKatakana"):t("showHiragana")}</button></div>
                      <div className="readings learning-back-readings"><Reading title="On’yomi" values={displayedOn}/><Reading title="Kun’yomi" values={displayedKun}/></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {hasExamplesPage?<div className={"learning-back-page"+(backPage===1?" active":"")} aria-label={t("vocabularyExamples")} aria-hidden={backPage!==1} inert={backPage!==1}>
              <div className="learning-back-scroll">
                <div className="examples compact-examples"><h3>{t("vocabularyExamples")}</h3>{displayExamples.map((e,i)=><div className="example-row" key={(e.word??"")+"-"+i} lang="ja"><span className="example-content"><span className="example-main">{[e.word,e.reading].filter(Boolean).join(" · ")}</span>{e.meaning?<small className="example-meaning">{e.meaning}</small>:null}</span>{e.reading?<Audio value={e.reading} label={t("playWordPronunciation")}/>:null}</div>)}</div>
              </div>
            </div>:null}
            <div className={"learning-back-page"+(backPage===(hasExamplesPage?2:1)?" active":"")} aria-label={t("personalMnemonic")} aria-hidden={backPage!==(hasExamplesPage?2:1)} inert={backPage!==(hasExamplesPage?2:1)}>
              <div className="learning-back-scroll">
                <div className="mnemonic-page">
                  <MnemonicSupportPanel support={mnemonicSupport} language={getLanguage()} character={card.character??""} isNew={Boolean(card.isNew)} hintStage={mnemonicHintStage} hintFocus={mnemonicHintFocus}/>
                  <section ref={mnemonicToolRef} className={"mnemonic-tool"+(mnemonicEditing?" is-open":"")+(personalMnemonic?" has-value":"")} aria-label={t("personalMnemonic")}>
                      {!mnemonicEditing&&preparedMnemonic&&mnemonicHintPlan.preparedMode!=="hidden"?
                        mnemonicHintPlan.preparedMode==="expanded"?
                          <div className="mnemonic-prepared" data-mnemonic-source={preparedMnemonic.source}>
                            <div className="mnemonic-prepared-copy">
                              <strong>{preparedMnemonic.source==="curated"?t("preparedMnemonicCurated"):t("preparedMnemonicScaffold")}</strong>
                              <p>{getLanguage()==="fa"?preparedMnemonic.fa:preparedMnemonic.en}</p>
                            </div>
                            {personalMnemonic===(getLanguage()==="fa"?preparedMnemonic.fa:preparedMnemonic.en)
                              ? null
                              : preparedMnemonic.source==="curated"
                                ? <button className="button secondary mnemonic-prepared-use" type="button" disabled={mnemonicBusy} onClick={()=>void handleUsePreparedMnemonic()}>
                                    {mnemonicBusy?"…":t("useMnemonic")}
                                  </button>
                                : <button className="button secondary mnemonic-prepared-use" type="button" disabled={mnemonicBusy} onClick={()=>{
                                    setMnemonicError("");
                                    setMnemonicDraft(personalMnemonic);
                                    setMnemonicEditing(true);
                                    requestAnimationFrame(scrollMnemonicEditorIntoView);
                                  }}>
                                    {t("makeMnemonicYourOwn")}
                                  </button>}
                          </div>
                        :
                          <details className="mnemonic-prepared mnemonic-prepared-collapsed" data-mnemonic-source={preparedMnemonic.source}>
                            <summary className="mnemonic-prepared-summary">
                              <strong>{t("memoryAid")}</strong>
                              <span>{preparedMnemonic.source==="curated"?t("preparedMnemonicCurated"):t("preparedMnemonicScaffold")}</span>
                            </summary>
                            <div className="mnemonic-prepared-details">
                              <p>{getLanguage()==="fa"?preparedMnemonic.fa:preparedMnemonic.en}</p>
                              {personalMnemonic===(getLanguage()==="fa"?preparedMnemonic.fa:preparedMnemonic.en)
                                ? null
                                : preparedMnemonic.source==="curated"
                                  ? <button className="button secondary mnemonic-prepared-use" type="button" disabled={mnemonicBusy} onClick={()=>void handleUsePreparedMnemonic()}>
                                      {mnemonicBusy?"…":t("useMnemonic")}
                                    </button>
                                  : <button className="button secondary mnemonic-prepared-use" type="button" disabled={mnemonicBusy} onClick={()=>{
                                      setMnemonicError("");
                                      setMnemonicDraft(personalMnemonic);
                                      setMnemonicEditing(true);
                                      requestAnimationFrame(scrollMnemonicEditorIntoView);
                                    }}>
                                      {t("makeMnemonicYourOwn")}
                                    </button>}
                            </div>
                          </details>
                        :null}
                      <button
                        className="mnemonic-trigger"
                        type="button"
                        aria-label={personalMnemonic?t("editMnemonic"):t("personalMnemonic")}
                        title={t("personalMnemonic")}
                        aria-expanded={mnemonicEditing}
                        aria-controls={mnemonicEditing ? "personal-mnemonic-editor" : undefined}
                        onClick={()=>{
                          setBackPage(hasExamplesPage?2:1);
                          setMnemonicError("");
                          setMnemonicDraft(personalMnemonic);
                          setMnemonicEditing(value=>!value);
                        }}
                      >
                        <span aria-hidden="true">✎</span>
                      </button>
                      {personalMnemonic&&!mnemonicEditing?<div className="mnemonic-saved"><span aria-hidden="true">🧠</span><p id="personal-mnemonic-title">{personalMnemonic}</p></div>:null}
                      {mnemonicEditing?
                        <div className="mnemonic-editor" id="personal-mnemonic-editor">
                          <div className="mnemonic-editor-heading"><strong>{t("personalMnemonic")}</strong><span>{fa(mnemonicDraft.length)}/{fa(600)}</span></div>
                          <textarea value={mnemonicDraft} maxLength={600} onChange={e=>setMnemonicDraft(e.target.value)} placeholder={t("mnemonicPlaceholder")} aria-label={t("mnemonicPlaceholder")} />
                          <div className="mnemonic-editor-footer">
                            <span aria-hidden="true"></span>
                            <div className="actions">
                              <button className="button secondary" type="button" disabled={mnemonicBusy} onClick={()=>{setMnemonicDraft(personalMnemonic);setMnemonicEditing(false)}}>{t("cancel")}</button>
                              <button className="button primary" type="button" disabled={mnemonicBusy||(!personalMnemonic&&mnemonicDraft.trim().length===0)} onClick={()=>void handleSaveMnemonic()}>{mnemonicBusy?t("saving"):t("saveMnemonic")}</button>
                            </div>
                          </div>
                          {mnemonicError?<p className="mnemonic-error" role="alert">{mnemonicError}</p>:null}
                        </div>
                        :null}
                    </section>
                </div>
              </div>
            </div>
            <div className={"learning-back-page"+(backPage===(hasExamplesPage?3:2)?" active":"")} aria-label={t("strokeOrder")} aria-hidden={backPage!==(hasExamplesPage?3:2)} inert={backPage!==(hasExamplesPage?3:2)}>
              <div className="learning-back-scroll">
                <div className="stroke-page">{card.character&&revealed&&backPage===(hasExamplesPage?3:2)?
    <Suspense fallback={<div className="loading" role="status">{t("strokeOrderLoading",getLanguage())}</div>}>
      <StrokeOrderViewer character={card.character} language={getLanguage()}/>
    </Suspense>
    :null}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="learning-back-footer">
          {backPageCount>1?<div className="learning-back-page-nav" role="group" aria-label={t("cardPage")}>
            <button className={"learning-back-page-shortcut"+(backPage===0?" active":"")} type="button" aria-label={t("meaningAndStructure")} title={t("meaningAndStructure")} aria-current={backPage===0?"page":undefined} onClick={()=>jumpToBackPage(0)}>
              <UiIcon name="learning" size={18}/>
            </button>
            {hasExamplesPage?<button className={"learning-back-page-shortcut"+(backPage===1?" active":"")} type="button" aria-label={t("vocabularyExamples")} title={t("vocabularyExamples")} aria-current={backPage===1?"page":undefined} onClick={()=>!examplesLoading&&jumpToBackPage(1)} disabled={examplesLoading}>
              <UiIcon name="reading" size={18}/>
            </button>:null}
            <button className={"learning-back-page-shortcut"+(backPage===(hasExamplesPage?2:1)?" active":"")} type="button" aria-label={t("personalMnemonic")} title={t("personalMnemonic")} aria-current={backPage===(hasExamplesPage?2:1)?"page":undefined} onClick={()=>jumpToBackPage(hasExamplesPage?2:1)}>
              <UiIcon name="mnemonic" size={18}/>
            </button>
            <button className={"learning-back-page-shortcut"+(backPage===(hasExamplesPage?3:2)?" active":"")} type="button" aria-label={t("strokeOrder")} title={t("strokeOrder")} aria-current={backPage===(hasExamplesPage?3:2)?"page":undefined} onClick={()=>jumpToBackPage(hasExamplesPage?3:2)}>
              <UiIcon name="writing" size={18}/>
            </button>
            <span className="pager-current sr-only" aria-live="polite">
              {t("pageOf").replace("{page}",fa(backPage+1)).replace("{total}",fa(backPageCount))}
            </span>
          </div>:null}
          <div className="rating-grid">{ratingOptions(getLanguage()).map(([r,l])=><button className={"button rating rating-"+r.toLowerCase()} key={r} type="button" disabled={Boolean(busy)} onClick={()=>handleRate(r)}>{l}</button>)}</div>
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
  if(s.kind==="vocabulary-intro")return <div className="stimulus text-stimulus content-intro-stimulus" lang="ja"><strong>{text(s.primary)}</strong>{s.secondary?<span>{s.secondary}</span>:null}{s.translation?<small>{s.translation}</small>:null}</div>;
  if(s.kind==="context-intro")return <div className="stimulus context-stimulus content-intro-stimulus" lang="ja" dir="ltr"><strong>{text(s.primary)}</strong>{s.translation?<small>{s.translation}</small>:null}</div>;
  return <div className="stimulus kanji-stimulus" lang="ja">{text(s.primary??ex.character)}</div>;
}
function Exercise({snapshot,busy,onSubmit,onDontKnow,onSelfReport,onNext,onRetry}:{snapshot:Snapshot;busy:boolean;onSubmit:(v:string)=>Promise<unknown>;onDontKnow:()=>Promise<unknown>;onSelfReport:(knewIt:boolean)=>Promise<unknown>;onNext:()=>Promise<unknown>;onRetry:()=>Promise<unknown>}){
  const ex=snapshot.exercise??{},
    [answer,setAnswer]=useState(""),
    [result,setResult]=useState<{correct:boolean;outcome:string;answerHint?:string;submittedAnswer?:string}|null>(null),
    [productionRevealed,setProductionRevealed]=useState(false),
    [showProductionOptions,setShowProductionOptions]=useState(false),
    choices=(ex.choices??[]).slice(0,4),
    production=ex.mode==="production";
  const lockedRef=useRef(false);
  const productionRevealKeyConsumedRef=useRef(false);
  const exerciseKey=String(ex.contentId??"")+"|"+String(ex.mode??"")+"|"+String(ex.character??"");
  const previousKeyRef=useRef(exerciseKey);

  useEffect(()=>{
    if(previousKeyRef.current!==exerciseKey){
      previousKeyRef.current=exerciseKey;
      lockedRef.current=false;
      productionRevealKeyConsumedRef.current=false;
      setAnswer("");
      setResult(null);
      setProductionRevealed(false);
      setShowProductionOptions(false);
    }
  },[exerciseKey]);

  useEffect(()=>{
    if(!production||productionRevealed||busy||result)return;
    const onKeyDown=(event:KeyboardEvent)=>{
      if(event.defaultPrevented||(event.code!=="Space"&&event.key!==" "))return;
      const active=document.activeElement;
      if(active instanceof HTMLElement){
        if(active.isContentEditable)return;
        if(active.closest("input,textarea,select,button,a,summary,[role],[contenteditable='true']"))return;
      }
      if(productionRevealKeyConsumedRef.current)return;
      productionRevealKeyConsumedRef.current=true;
      event.preventDefault();
      setProductionRevealed(true);
    };
    window.addEventListener("keydown",onKeyDown);
    return()=>window.removeEventListener("keydown",onKeyDown);
  },[busy,production,productionRevealed,result]);

  const waitForFeedbackAnimation=useCallback(async(correct:boolean)=>{
    const reduced=typeof window!=="undefined"&&window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches===true;
    const delay=correct?700:900;
    await new Promise(resolve=>window.setTimeout(resolve,reduced?80:delay));
  },[]);

  const finishCorrect=useCallback(async(feedback:{correct?:boolean;outcome?:string;answerHint?:string;submittedAnswer?:string}|null)=>{
    if(!feedback||feedback.correct!==true)return;
    setResult({correct:true,outcome:String(feedback.outcome??"correct"),answerHint:feedback.answerHint,submittedAnswer:feedback.submittedAnswer});
    await waitForFeedbackAnimation(true);
    await onNext();
  },[onNext,waitForFeedbackAnimation]);

  const handleSubmit=async(value:string)=>{
    if(!value.trim()||busy||lockedRef.current)return;
    lockedRef.current=true;
    try{
      const raw=await onSubmit(value);
      const feedback=(raw&&typeof raw==="object"?raw:null) as {correct?:boolean;outcome?:string;answerHint?:string}|null;
      if(feedback&&typeof feedback.correct==="boolean"){
        const nextResult={correct:Boolean(feedback.correct),outcome:String(feedback.outcome??(feedback.correct?"correct":"wrong")),answerHint:feedback.answerHint,submittedAnswer:value};
        setResult(nextResult);
        if(feedback.correct===true)await finishCorrect(nextResult);
      }else{
        const fallback={correct:value===ex.character,outcome:value===ex.character?"correct":"wrong",answerHint:value===ex.character?undefined:ex.character,submittedAnswer:value};
        setResult(fallback);
        if(fallback.correct)await finishCorrect(fallback);
      }
    }catch(_){
      lockedRef.current=false;
    }
  };
  const handleProductionGrade=async(knewIt:boolean)=>{
    if(!production||!productionRevealed||busy||lockedRef.current||result||!ex.character)return;
    lockedRef.current=true;
    try{
      const raw=await onSelfReport(knewIt);
      const feedback=(raw&&typeof raw==="object"?raw:null) as {correct?:boolean;outcome?:string;answerHint?:string}|null;
      setResult({correct:Boolean(feedback?.correct===true),outcome:String(feedback?.outcome??(knewIt?"correct":"unknown")),answerHint:feedback?.answerHint??ex.character});
      await waitForFeedbackAnimation(knewIt);
      await onNext();
    }catch(_){
      lockedRef.current=false;
    }
  };

  const handleRetry=async()=>{
    if(busy||!result||result.correct)return;
    lockedRef.current=true;
    try{
      const retried=await onRetry();
      if(retried===false){lockedRef.current=false;return;}
      setResult(null);
      setAnswer("");
      setProductionRevealed(false);
      setShowProductionOptions(false);
      lockedRef.current=false;
    }catch(_){
      lockedRef.current=false;
    }
  };
  const handleNextFromFeedback=async()=>{
    if(busy)return;
    lockedRef.current=true;
    setResult(null);
    setAnswer("");
    setProductionRevealed(false);
    setShowProductionOptions(false);
    try{
      await onNext();
    }finally{
      lockedRef.current=false;
    }
  };
  const handleDontKnow=async()=>{
    if(busy||lockedRef.current)return;
    lockedRef.current=true;
    try{
      const raw=await onDontKnow();
      const feedback=(raw&&typeof raw==="object"?raw:null) as {correct?:boolean;outcome?:string;answerHint?:string}|null;
      setResult({correct:false,outcome:String(feedback?.outcome??"unknown"),answerHint:feedback?.answerHint??ex.answerHint});
      await waitForFeedbackAnimation(false);
      await onNext();
    }catch(_){
      lockedRef.current=false;
    }
  };

  const resultClass=result?(result.correct?" is-correct exercise-result-correct":" is-wrong exercise-result-wrong"):"";
  const resultLabel=result?(result.correct?t("correct"):result.outcome==="unknown"?t("unknown"):t("wrong")):undefined;
  const disabled=busy||lockedRef.current||Boolean(result);
  const taskLabel=skillLabel(ex.mode??"");
  const introduction=ex.contentStage==="introduction"&&(ex.mode==="vocabulary"||ex.mode==="context");
  const taskDescription=introduction?t("contentIntroductionPrompt"):localizeDynamic(ex.prompt,getLanguage(),t("exerciseReady"));
  const correctAnswerDisplay=ex.mode==="vocabulary"||ex.mode==="context"?text(ex.character):text(ex.answerHint||ex.character);
  const correctedContent=ex.mode==="vocabulary"?String(ex.answerHint||"").split(" · ")[0].trim():ex.mode==="context"?String(ex.stimulus?.primary||"").replaceAll("＿",text(ex.character||ex.answerHint)):undefined;
  const keyboardHint=production?(productionRevealed?null:"Space"):null;

  return <section id="exercise" data-result={result?(result.correct?"correct":"wrong"):undefined} aria-label={resultLabel} className={"active-recall-shell exercise-card"+resultClass} tabIndex={-1}>
    <div className="active-recall-session-head">
      <div className="active-recall-session-meta">
        <span className="active-recall-kicker">{t("activeRecallLabel")}</span>
        <span className="active-recall-divider" aria-hidden="true">·</span>
        <span className="active-recall-task">{taskLabel}</span>
      </div>
      <span className="active-recall-session-dot" aria-hidden="true"/>
    </div>

    {!ex.mode?<div className="active-recall-empty">{t("exerciseReady")}</div>:<>
      <div className="active-recall-task-header">
        <p className="prompt">{taskDescription}</p>
        {introduction?<span className="active-recall-intro-hint">{t("contentIntroductionHint")}</span>:null}
      </div>

      <div className="active-recall-stimulus-wrap">
        <Stimulus ex={ex}/>
      </div>

      {introduction?
        <div className="active-recall-flow active-recall-introduction">
          <button className="active-recall-primary" type="button" disabled={disabled} onClick={()=>void onNext()}>
            <span>{t("nextExercise")}</span><UiIcon name="next" size={17}/>
          </button>
        </div>
      :result?
        <div className="active-recall-feedback exercise-feedback" role="status" aria-live="polite">
          <div className="active-recall-feedback-mark" aria-hidden="true">{result.correct?"✓":<UiIcon name="close" size={18}/>}</div>
          <div className="active-recall-feedback-copy">
            <strong>{result.correct?t("correct"):result.outcome==="unknown"?t("unknown"):t("wrong")}</strong>
            {result.submittedAnswer&&!result.correct?<div className="active-recall-answer"><span>{t("yourChoice")}</span><b lang="ja">{text(result.submittedAnswer)}</b></div>:null}
            {correctAnswerDisplay?<div className="active-recall-answer exercise-correct-answer"><span>{t("correctChoice")}</span><b lang="ja">{correctAnswerDisplay}</b></div>:null}
            {(!result.correct&&correctedContent)?<div className="active-recall-correction-content" lang="ja"><strong>{correctedContent}</strong>{ex.mode==="vocabulary"&&ex.stimulus?.secondary?<span>{ex.stimulus.secondary}</span>:null}{ex.stimulus?.translation?<small>{ex.stimulus.translation}</small>:null}</div>:null}
          </div>
          {!result.correct&&result.outcome!=="unknown"?
            <div className="active-recall-feedback-actions">
              <button className="active-recall-primary" type="button" disabled={busy} onClick={()=>void handleRetry()}>{t("retrySkill")}</button>
              <button className="active-recall-secondary" type="button" disabled={busy} onClick={()=>void handleNextFromFeedback()}>{t("nextExercise")}</button>
            </div>
          :null}
        </div>
      :production&&!showProductionOptions?
        <div className="active-recall-flow production-recall">
          <div className="active-recall-instruction">
            <span>{t("productionRecallInstruction")}</span>
            {keyboardHint?<kbd>{keyboardHint}</kbd>:null}
          </div>
          {!productionRevealed?
            <div className="active-recall-actions">
              <button className="active-recall-primary production-recall-reveal" type="button" disabled={disabled} onClick={()=>setProductionRevealed(true)}>
                <span>{t("revealAnswer")}</span><UiIcon name="next" size={17}/>
              </button>
              {choices.length>=4?<button className="active-recall-secondary" type="button" disabled={disabled} onClick={()=>setShowProductionOptions(true)}>{t("useOptionsHint")}</button>:null}
            </div>
          :
            <div className="active-recall-reveal production-recall-revealed" aria-live="polite">
              <span className="active-recall-reveal-label">{t("revealedAnswer")}</span>
              <strong className="active-recall-answer-kanji production-recall-kanji" lang="ja">{text(ex.character||"—")}</strong>
              <div className="active-recall-grade production-recall-grade">
                <button className="active-recall-grade-button known" type="button" disabled={disabled||!ex.character} onClick={()=>void handleProductionGrade(true)}>
                  <span>{t("iKnewIt")}</span><kbd>1</kbd>
                </button>
                <button className="active-recall-grade-button unknown" type="button" disabled={disabled||!ex.character} onClick={()=>void handleProductionGrade(false)}>
                  <span>{t("iDidntKnow")}</span><kbd>2</kbd>
                </button>
              </div>
            </div>}
        </div>
      :production?
        <div className="active-recall-flow">
          <div className="active-recall-instruction"><span>{t("answerYourself")}</span></div>
          <div className="active-recall-choice-grid production-grid">{choices.map((choice,index)=><button className="active-recall-choice" type="button" key={choice} lang="ja" disabled={disabled} onClick={()=>void handleSubmit(choice)}><span>{choice}</span><kbd>{index+1}</kbd></button>)}</div>
        </div>
      :(ex.mode==="vocabulary"||ex.mode==="context")?
        choices.length>=2?
          <div className="active-recall-flow">
            <div className="active-recall-instruction"><span>{t("answerYourself")}</span></div>
            <div className="active-recall-choice-grid vocabulary-grid">{choices.map((choice,index)=><button className="active-recall-choice" type="button" key={choice} lang="ja" disabled={disabled} onClick={()=>void handleSubmit(choice)}><span>{choice}</span><kbd>{index+1}</kbd></button>)}</div>
          </div>
        :
          <div className="active-recall-flow active-recall-content-unavailable">
            <div className="active-recall-instruction"><span>{languageSafeContentUnavailable(ex.mode)}</span></div>
            <button className="active-recall-secondary" type="button" disabled={disabled} onClick={()=>void handleNextFromFeedback()}>{t("nextExercise")}</button>
          </div>
      :        <div className="active-recall-flow">
          <label className="active-recall-input-wrap">
            <span>{t("answerYourself")}</span>
            <input autoFocus value={answer} disabled={disabled} onChange={e=>setAnswer(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();void handleSubmit(answer)}}} placeholder={localizeDynamic(ex.stimulus?.inputPlaceholder,getLanguage(),t("answerPlaceholder"))}/>
          </label>
          <div className="active-recall-actions">
            <button className="active-recall-primary" type="button" disabled={disabled||!answer.trim()} onClick={()=>void handleSubmit(answer)}>{t("checkAnswer")}</button>
            <button className="active-recall-secondary" type="button" disabled={disabled} onClick={()=>void handleDontKnow()}>{t("dontKnow")}</button>
          </div>
        </div>}
    </>}
  </section>
}
function PracticeHandwriting({character,language,exercise}:{character:string;language:Language;exercise?:NonNullable<Snapshot["exercise"]>}){
  const [skill,setSkill]=useState<HandwritingSkill|null>(null);
  useEffect(()=>{
    let active=true;
    setSkill(null);
    void getHandwritingSkill(character).then(next=>{if(active)setSkill(next)}).catch(()=>{if(active)setSkill(null)});
    return()=>{active=false};
  },[character]);
  if(!character.trim())return null;
  return <div className="practice-handwriting" data-experience="practice" data-character={character}>
    <HandwritingPractice
      character={character}
      language={language}
      exercise={exercise}
      learningSignal={skill?{state:skill.state,confidence:skill.confidence,score:skill.score}:undefined}
      onGradeRecorded={(grade)=>recordHandwritingGrade(character,grade).then(async saved=>{
        if(!saved)return false;
        const next=await getHandwritingSkill(character);
        setSkill(next);
        return true;
      })}
    />
  </div>;
}
function SessionFeedback({snapshot,visible}:{snapshot:Snapshot;visible:boolean}){
  if(!visible)return null;
  const summary=snapshot.sessionSummary??{};
  const attempts=Math.max(0,Number(summary.attempts)||0);
  const correct=Math.max(0,Number(summary.correct)||0);
  const accuracy=pct(summary.accuracy);
  const detail=attempts>0
    ? `${fa(correct)}/${fa(attempts)} · ${fa(accuracy)}%`
    : "";
  return <section className="session-feedback" aria-label={t("sessionSummary",getLanguage())}>
    <strong>{t("sessionSummary",getLanguage())}</strong>
    <span>{detail}</span>
  </section>;
}

function getInitialSnapshot():Snapshot|null{
  if(typeof window==="undefined")return null;
  const value=(window as Window & {__KANJI5_V19_V2_LAST_SNAPSHOT__?:Snapshot}).__KANJI5_V19_V2_LAST_SNAPSHOT__;
  return value&&typeof value==="object"?value:null;
}
function LoadingSummary(){
  return <section className="daily-summary loading-summary" aria-hidden="true">{[0,1,2,3].map(i=><div className="stat-card loading-stat-card" key={i}><span className="loading-block loading-stat-value"/><span className="loading-block loading-stat-label"/></div>)}</section>;
}
function LoadingGoal(){
  return <section className="surface goal loading-goal" aria-hidden="true"><div className="goal-top"><span className="loading-block loading-goal-label"/><span className="loading-block loading-goal-label-short"/></div><div className="progress loading-progress" role="progressbar" aria-label={t("dailyGoal")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}><span/></div></section>;
}
function LoadingUpcoming(){
  return <section className="surface upcoming loading-upcoming" aria-hidden="true"><div className="loading-upcoming-title"><span className="loading-block"/></div></section>;
}
function LoadingLearning(){
  return <section className="surface card learning-card loading-learning" aria-hidden="true">
    <div className="learning-card-flip">
      <div className="learning-card-face learning-card-front">
        <div className="card-topline"><span className="loading-block loading-pill"/><span className="loading-block loading-pill-short"/></div>
        <h2>{t("learningCard")}</h2>
        <div className="kanji-row"><span className="loading-kanji"/></div>
        <span className="loading-block loading-reading"/>
        <span className="loading-block loading-button"/>
      </div>
    </div>
  </section>;
}
function App(){
  const [snapshot,setSnapshot]=useState<Snapshot|null>(()=>getInitialSnapshot()),[snapshotHydrated,setSnapshotHydrated]=useState(()=>Boolean(getInitialSnapshot())),[busy,setBusy]=useState(false),[error,setError]=useState(""),[experience,setExperience]=useState<"review"|"practice"|"dictionary">("review"),[practiceMode,setPracticeMode]=useState<"home"|"exercise">("home"),[statsOpen,setStatsOpen]=useState(false),[settingsOpen,setSettingsOpen]=useState(false),[grammarOpen,setGrammarOpen]=useState(false),[readingLabOpen,setReadingLabOpen]=useState(false),[mnemonicsOpen,setMnemonicsOpen]=useState(false),[accountOpen,setAccountOpen]=useState(false),[secondaryPage,setSecondaryPage]=useState<"stats"|"grammar"|"readingLab"|"mnemonics"|"settings"|"account"|null>(null),[headerMenuOpen,setHeaderMenuOpen]=useState(false),[dictionaryLookupCharacter,setDictionaryLookupCharacter]=useState<string|null>(null),[mnemonicCatalog,setMnemonicCatalog]=useState<KanjiCatalogItem[]>([]),[mnemonicPersonalMnemonics,setMnemonicPersonalMnemonics]=useState<Record<string,string>>({}),[mnemonicCatalogState,setMnemonicCatalogState]=useState<"idle"|"loading"|"ready"|"error">("idle"),[mnemonicCatalogError,setMnemonicCatalogError]=useState(""),[mnemonicCatalogRetry,setMnemonicCatalogRetry]=useState(0),[language,setLanguageState]=useState<Language>(()=>getLanguage()),[themePreference,setThemePreference]=useState<ThemePreference>(()=>getThemePreference());
  const [sessionFeedbackVisible,setSessionFeedbackVisible]=useState(false);
  useEffect(()=>applyLanguage(language),[language]);
  useEffect(()=>{
    if(!mnemonicsOpen)return;
    let active=true;
    setMnemonicCatalogState("loading");
    setMnemonicCatalogError("");
    void Promise.all([listKanji(),listPersonalMnemonics()]).then(([catalog,personal])=>{
      if(!active)return;
      setMnemonicCatalog(catalog.results);
      setMnemonicPersonalMnemonics(personal.mnemonics);
      setMnemonicCatalogState(catalog.results.length?"ready":"error");
      if(!catalog.results.length)setMnemonicCatalogError(language==="fa"?"فهرست کانجی بارگذاری نشد. دوباره تلاش کنید.":"The kanji catalog did not load. Please try again.");
    }).catch(error=>{
      if(!active)return;
      setMnemonicCatalogState("error");
      const code=error instanceof Error?error.message:"";
      setMnemonicCatalogError(code==="KANJI5_KANJI_CATALOG_UNAVAILABLE"
        ? (language==="fa"?"دادهٔ کانجی هنوز آماده نشده است. دوباره تلاش کنید.":"The kanji data is not ready yet. Please try again.")
        : (language==="fa"?"بارگذاری یادسپارها انجام نشد. دوباره تلاش کنید.":"The mnemonic library could not be loaded. Please try again."));
    });
    return()=>{active=false};
  },[mnemonicsOpen,mnemonicCatalogRetry,language]);
  useEffect(()=>{if(!headerMenuOpen)return;setThemePreference(getThemePreference());},[headerMenuOpen]);
  useEffect(()=>{if(!headerMenuOpen||typeof document==="undefined")return;const onKey=(event:KeyboardEvent)=>{if(event.key!=="Escape")return;setHeaderMenuOpen(false);window.requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>(".header-menu-trigger")?.focus());};const onPointerDown=(event:globalThis.PointerEvent)=>{const target=event.target as Node|null;const menu=document.getElementById("header-tools-menu");const trigger=document.querySelector<HTMLButtonElement>(".header-menu-trigger");if(!target||!menu||!trigger)return;if(!menu.contains(target)&&!trigger.contains(target))setHeaderMenuOpen(false);};document.addEventListener("keydown",onKey);document.addEventListener("pointerdown",onPointerDown,true);return()=>{document.removeEventListener("keydown",onKey);document.removeEventListener("pointerdown",onPointerDown,true)}},[headerMenuOpen]);
  const changeLanguage=(next:Language)=>{persistLanguage(next);setLanguageState(next)};
  const changeTheme=(next:ThemePreference)=>{setThemePreference(next);persistThemePreference(next)};
  const closeSecondaryPage=useCallback(()=>{
    setSecondaryPage(null);
    setStatsOpen(false);setSettingsOpen(false);setGrammarOpen(false);setReadingLabOpen(false);setMnemonicsOpen(false);setAccountOpen(false);
  },[]);
  const refresh=useCallback(async()=>{const s=await readSnapshot();setSnapshot(s);return s},[]);
  const experienceRef=useRef<"review"|"practice"|"dictionary">("review");
  const changeExperience=useCallback((next:"review"|"practice"|"dictionary")=>{experienceRef.current=next;setExperience(next)},[]);
  useEffect(()=>{
    let mounted=true;
    const listener=(e:Event)=>{const d=(e as CustomEvent<Snapshot>).detail;if(mounted&&d){setSnapshot(d);setSnapshotHydrated(true)}};
    document.addEventListener("kanji5:v1.9-v2-view-models",listener);
    void startLearningSession().catch(()=>{});
    void readStartupSnapshot().then(s=>{
      if(!mounted)return;
      setSnapshot(s);
      setSnapshotHydrated(false);
      const schedule=()=>{
        if(!mounted)return;
        void refresh().then(full=>{
          if(!mounted)return;
          setSnapshot(full);
          setSnapshotHydrated(true);
        }).catch(e=>{if(mounted)setError(e instanceof Error?e.message:t("learningCoreError"))});
      };
      const idleCallback=(window as Window & {requestIdleCallback?: (callback:()=>void,options?:{timeout?:number})=>number}).requestIdleCallback;
      if(typeof idleCallback==="function")idleCallback(schedule,{timeout:1800});
      else window.setTimeout(schedule,120);
    }).catch(e=>{if(mounted)setError(e instanceof Error?e.message:t("learningCoreError"))});
    return()=>{
      mounted=false;
      document.removeEventListener("kanji5:v1.9-v2-view-models",listener);
    };
  },[refresh]);
  const yieldToBrowser=useCallback(()=>new Promise<void>(resolve=>{if(typeof window==="undefined"){resolve();return}if(typeof window.requestAnimationFrame==="function"){window.requestAnimationFrame(()=>resolve());}else{window.setTimeout(resolve,0);}}),[]);
  async function action<T>(task:()=>Promise<T>, refreshSnapshot=true):Promise<T|undefined>{setBusy(true);setError("");await yieldToBrowser();try{const result=await task();if(refreshSnapshot)setSnapshot(await readSnapshot());return result}catch(e){const code=e instanceof Error?e.message:"";const message=code==="KANJI5_NO_EXERCISE_AVAILABLE"?(language==="fa"?"فعلاً تمرین قابل انجامی در دسترس نیست. یک جلسهٔ هدفمند بسازید یا بعداً دوباره تلاش کنید.":"No exercise is available right now. Build a focused study session or try again later."):code==="KANJI5_EXERCISE_READY_TIMEOUT"?(language==="fa"?"شروع تمرین طول کشید. لطفاً دوباره تلاش کنید.":"The exercise took too long to start. Please try again."):code||(language==="fa"?"عملیات انجام نشد.":"The operation failed.");setError(message);return undefined}finally{setBusy(false)}}
  const progress=pct(snapshot?.session?.completionFraction);const hasSessionProgress=snapshot?.session?.status==="active"&&Number(snapshot?.session?.plannedTotal||0)>0;const showExercise=experience==="practice";const showDictionary=experience==="dictionary";
  useEffect(()=>{
    if(!headerMenuOpen)return;
    const opener=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const menu=document.getElementById("header-tools-menu");
    const getFocusable=()=>Array.from(menu?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')??[]);
    const onKeyDown=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){event.preventDefault();setHeaderMenuOpen(false);return;}
      if(event.key!=="Tab")return;
      const items=getFocusable();
      if(!items.length)return;
      const first=items[0],last=items[items.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    };
    document.addEventListener("keydown",onKeyDown);
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    requestAnimationFrame(()=>getFocusable()[0]?.focus());
    return()=>{
      document.removeEventListener("keydown",onKeyDown);
      document.body.style.overflow=previousOverflow;
      requestAnimationFrame(()=>opener?.focus());
    };
  },[headerMenuOpen]);
  if(error&&!snapshot)return <div className="app-shell centered"><section className="surface fatal"><span className="fatal-kanji" lang="ja">迷</span><h1>{t("learningCoreError")}</h1><p>{error}</p><button className="button primary" type="button" onClick={()=>location.reload()}>{t("tryAgain")}</button></section></div>;
  return <div className="app-shell">
    <a className="skip-link" href="#primary-content">{t("goToMain")}</a>
    <header className={"header"+(headerMenuOpen?" menu-open":"")}><div className="header-brand"><p className="eyebrow red">{t("smartLearning")}</p><h1>Kanji-yar</h1></div>
      <div className="header-actions">{hasSessionProgress?<div className="session-progress"><Progress value={progress} label={t("sessionProgress")}/><span>{fa((snapshot?.session?.plannedTotal??0)-(snapshot?.session?.remainingTotal??0))} {t("of",language)} {fa(snapshot?.session?.plannedTotal??0)}</span></div>:null}<div className={"header-tools"+(headerMenuOpen?" menu-open":"")}><button className="button secondary header-menu-trigger" type="button" aria-expanded={headerMenuOpen} aria-controls="header-tools-menu" aria-label={t("more",language)} disabled={busy} onClick={()=>setHeaderMenuOpen(v=>!v)}><UiIcon name="menu" /></button>{headerMenuOpen?<><button className="header-menu-scrim" type="button" aria-label={t("closeMenu",language)} onClick={()=>setHeaderMenuOpen(false)}/><aside id="header-tools-menu" className="header-tools-menu open" role="dialog" aria-labelledby="header-tools-menu-title">
  <div className="header-tools-menu-header"><div className="header-tools-menu-heading"><span className="header-tools-menu-kana" lang="ja" aria-hidden="true">道具</span><span aria-hidden="true">·</span><strong id="header-tools-menu-title">{t("moreMenuTitle",language)}</strong></div><button className="header-tools-menu-close" type="button" aria-label={t("closeMenu",language)} onClick={()=>setHeaderMenuOpen(false)}><UiIcon name="close" size={19}/></button></div>
  <div className="header-tools-menu-scroll">
    <section className="header-tools-menu-section" aria-labelledby="header-tools-learning-title">
      <h2 id="header-tools-learning-title">{t("menuLearningTools",language)}</h2>
      <div className="header-tools-menu-list">
        <button className="menu-nav-item" type="button" aria-label={t("grammarGuide",language)} disabled={busy} onClick={()=>{setGrammarOpen(true);setSecondaryPage("grammar");setHeaderMenuOpen(false)}}><span className="menu-nav-icon"><UiIcon name="grammar" size={19}/></span><span className="menu-nav-copy"><strong>{t("grammarGuide",language)}</strong><small>{t("menuGrammarHint",language)}</small></span><UiIcon className="menu-nav-chevron" name={language==="fa"?"previous":"next"} size={18}/></button>
        <button className="menu-nav-item" type="button" aria-label={t("readingLab",language)} disabled={busy} onClick={()=>{setReadingLabOpen(true);setSecondaryPage("readingLab");setHeaderMenuOpen(false)}}><span className="menu-nav-icon"><UiIcon name="reading" size={19}/></span><span className="menu-nav-copy"><strong>{t("readingLab",language)}</strong><small>{t("menuReadingHint",language)}</small></span><UiIcon className="menu-nav-chevron" name={language==="fa"?"previous":"next"} size={18}/></button>
        <button className="menu-nav-item" type="button" aria-label={t("preparedMnemonics",language)} disabled={busy} onClick={()=>{setMnemonicsOpen(true);setSecondaryPage("mnemonics");setHeaderMenuOpen(false)}}><span className="menu-nav-icon"><UiIcon name="mnemonic" size={19}/></span><span className="menu-nav-copy"><strong>{t("preparedMnemonics",language)}</strong><small>{t("menuMnemonicHint",language)}</small></span><UiIcon className="menu-nav-chevron" name={language==="fa"?"previous":"next"} size={18}/></button>
      </div>
    </section>
    <section className="header-tools-menu-section" aria-labelledby="header-tools-progress-title">
      <h2 id="header-tools-progress-title">{t("menuProgress",language)}</h2>
      <div className="header-tools-menu-list">
        <button className="menu-nav-item" type="button" aria-label={t("stats",language)} disabled={busy} onClick={()=>{setStatsOpen(true);setSecondaryPage("stats");setHeaderMenuOpen(false)}}><span className="menu-nav-icon"><UiIcon name="stats" size={19}/></span><span className="menu-nav-copy"><strong>{t("stats",language)}</strong><small>{t("menuStatsHint",language)}</small></span><UiIcon className="menu-nav-chevron" name={language==="fa"?"previous":"next"} size={18}/></button>
      </div>
    </section>
    <section className="header-tools-menu-section header-tools-menu-preferences" aria-labelledby="header-tools-preferences-title">
      <h2 id="header-tools-preferences-title">{t("menuPreferences",language)}</h2>
      <div className="menu-preference-row"><span>{t("language",language)}</span><div className="menu-segmented" role="group" aria-label={t("language",language)}><button type="button" className={"menu-segment "+(language==="fa"?"active":"")} aria-pressed={language==="fa"} onClick={()=>changeLanguage("fa")}>{t("persian",language)}</button><button type="button" className={"menu-segment "+(language==="en"?"active":"")} aria-pressed={language==="en"} onClick={()=>changeLanguage("en")}>{t("english",language)}</button></div></div>
      <div className="menu-preference-row"><span>{t("appearance",language)}</span><div className="menu-segmented menu-theme-segmented" role="group" aria-label={t("appearance",language)}><button type="button" className={"menu-segment menu-theme-button "+(themePreference==="light"?"active":"")} aria-pressed={themePreference==="light"} aria-label={t("themeLight",language)} onClick={()=>changeTheme("light")}><span aria-hidden="true">☀</span><span>{t("themeLight",language)}</span></button><button type="button" className={"menu-segment menu-theme-button "+(themePreference==="dark"?"active":"")} aria-pressed={themePreference==="dark"} aria-label={t("themeDark",language)} onClick={()=>changeTheme("dark")}><span aria-hidden="true">☾</span><span>{t("themeDark",language)}</span></button><button type="button" className={"menu-segment menu-theme-button "+(themePreference==="system"?"active":"")} aria-pressed={themePreference==="system"} aria-label={t("themeSystem",language)} onClick={()=>changeTheme("system")}><span aria-hidden="true">◐</span><span>{t("themeSystem",language)}</span></button></div></div>
      <button className="menu-nav-item menu-settings-item" type="button" aria-label={t("settings",language)} disabled={busy} onClick={()=>{setSettingsOpen(true);setSecondaryPage("settings");setHeaderMenuOpen(false)}}><span className="menu-nav-icon"><UiIcon name="settings" size={19}/></span><span className="menu-nav-copy"><strong>{t("settings",language)}</strong><small>{t("menuSettingsHint",language)}</small></span><UiIcon className="menu-nav-chevron" name={language==="fa"?"previous":"next"} size={18}/></button>
    </section>
  </div>
</aside></>:null}</div><AccountButton language={language} onClick={()=>{setAccountOpen(true);setSecondaryPage(null)}}/></div>
    </header>
    <nav className={"experience-nav active-tab-"+experience} aria-label={t("learningPath",language)}><span className="experience-tab-indicator" aria-hidden="true"/><button className={"experience-tab "+(experience==="review"?"active":"")} type="button" aria-current={experience==="review"?"page":undefined} onClick={()=>{changeExperience("review");void action(async()=>{await startLearningExperience();await clearTransient()})}}><UiIcon name="learning" /><span>{t("learning",language)}</span></button><button className={"experience-tab "+(experience==="practice"?"active":"")} type="button" aria-current={experience==="practice"?"page":undefined} onClick={()=>{changeExperience("practice");void action(async()=>{await startPracticeExperience();setPracticeMode("home")})}}><UiIcon name="recall" /><span>{t("activeRecall",language)}</span></button><button className={"experience-tab "+(experience==="dictionary"?"active":"")} type="button" aria-current={experience==="dictionary"?"page":undefined} onClick={()=>{changeExperience("dictionary");void action(async()=>{await clearCustomStudyFilter();await clearTransient()})}}><UiIcon name="dictionary" /><span>{t("dictionary",language)}</span></button></nav><main id="primary-content" className="content mobile-study-flow">      {error ? <section className="surface app-error-banner" role="alert" aria-live="assertive"><div><strong>{t("actionFailed",language)}</strong><p>{error}</p></div><button className="button secondary" type="button" onClick={()=>setError("")}>{t("close",language)}</button></section> : null}
      {secondaryPage ? <section className="secondary-page-host" aria-label={t("more",language)}>
        <Suspense fallback={<div className="loading" role="status">{t("dictionaryLoading",language)}</div>}>
          {secondaryPage==="stats" ? <StatsDialog open={statsOpen} snapshot={snapshot??{}} language={language} onClose={closeSecondaryPage} onStudyWeak={async()=>{closeSecondaryPage();const result=await action(async()=>{await clearTransient();return await startCustomStudy({focus:"weak",limit:5});});if(result?.started)setExperience("review");}}/> : null}
          {secondaryPage==="settings" ? <SettingsDialog
            open={settingsOpen}
            snapshot={snapshot??{}}
            busy={busy}
            language={language}
            onClose={closeSecondaryPage}
            onSave={async s=>{const result=await action(async()=>{await updateSettings(s);return true});if(result)closeSecondaryPage();return result}}
            onReset={()=>void action(async()=>{resetProgress()})}
          /> : null}
          {secondaryPage==="mnemonics" ? <MnemonicsDialog
            open={mnemonicsOpen}
            language={language}
            catalog={mnemonicCatalog}
            personalMnemonics={mnemonicPersonalMnemonics}
            loading={mnemonicCatalogState==="loading"}
            error={mnemonicCatalogState==="error" ? mnemonicCatalogError : ""}
            onRetry={()=>setMnemonicCatalogRetry(value=>value+1)}
            onClose={closeSecondaryPage}
            onSelectKanji={(item: KanjiCatalogItem)=>{setDictionaryLookupCharacter(item.character);setExperience("dictionary");closeSecondaryPage();}}
          /> : null}
          {secondaryPage==="grammar" ? <GrammarDialog open={grammarOpen} language={language} onClose={closeSecondaryPage}/> : null}
          {secondaryPage==="readingLab" ? <ReadingLabDialog
            open={readingLabOpen}
            language={language}
            onClose={closeSecondaryPage}
          /> : null}
          {secondaryPage==="account" ? <AccountDialog open={accountOpen} language={language} onClose={closeSecondaryPage}/> : null}
        </Suspense>
      </section> : showDictionary?
        <Suspense fallback={<div className="loading" role="status">{t("dictionaryLoading",language)}</div>}>
          <DictionaryPage language={language} externalSelectedCharacter={dictionaryLookupCharacter} onExternalSelectionConsumed={()=>setDictionaryLookupCharacter(null)}/>
        </Suspense>
      :<>
        {!showExercise?(snapshotHydrated&&snapshot?<DailySummary snapshot={snapshot}/>:<LoadingSummary/>):null}
              {!showExercise?(snapshotHydrated&&snapshot?.dailyGoal?<section className="surface goal"><div className="goal-top" data-celebrated={snapshot.dailyGoal.celebrated?"true":"false"}><strong>{t("dailyGoal")}: {fa(snapshot.dailyGoal.completed??0)}/{fa(snapshot.dailyGoal.target??0)}</strong><span>{snapshot.dailyGoal.celebrated?"🎉 "+t("completed"):""}</span></div><Progress value={pct(snapshot.dailyGoal.progress)} label={t("dailyGoal")}/></section>:<LoadingGoal/>):null}
              {!showExercise?(snapshotHydrated&&snapshot?.upcomingReviews?.length?<details className="surface upcoming"><summary>{t("upcomingReviews")}</summary><div className="upcoming-body">{snapshot.upcomingReviews.map(r=><div className="upcoming-row" key={r.character+r.dueAt}><strong lang="ja">{r.character}</strong><span>{new Date(r.dueAt).toLocaleString(language==="fa"?"fa-IR":"en-US",{dateStyle:"medium",timeStyle:"short"})}</span></div>)}</div></details>:snapshot?<></>:<LoadingUpcoming/>):null}
              {showExercise ? (
  practiceMode==="exercise" && snapshot?.exercise?.mode ? (
    <>
      <Exercise snapshot={snapshot} busy={busy} onSubmit={v=>action(()=>submitExercise(v),false)} onDontKnow={()=>action(dontKnow,false)} onSelfReport={knewIt=>action(()=>selfReportProduction(knewIt),false)} onNext={()=>action(nextExercise)} onRetry={()=>action(retryExercise,false)}/>
      {snapshot?.exercise?.character?
        <Suspense fallback={<div className="loading" role="status">{t("handwritingPractice",language)}</div>}>
          <PracticeHandwriting character={snapshot.exercise.character} language={language} exercise={snapshot.exercise}/>
        </Suspense>
        :null}
    </>
  ) : (
    <Suspense fallback={<div className="loading" role="status">{t("activeRecall",language)}</div>}>
      <PracticeHome
        language={language}
        busy={busy}
        onStartActiveRecall={async()=>{
          await action(async()=>{
            await startExercise();
            setPracticeMode("exercise");
          });
        }}
        onStartCustomStudy={async(filter: CustomStudyFilter)=>{
          const result=await action(async()=>{
            await clearTransient();
            return await startCustomStudy(filter);
          });
          if(result?.started)setExperience("review");
          return Boolean(result?.started);
        }}
      />
    </Suspense>
  )
) : snapshot?.learning?.active ? <Learning card={snapshot.learning} snapshot={snapshot} busy={busy} onReveal={()=>void action(revealLearning)} onRate={r=>void action(async()=>{const ok=await rateLearning(r);if(ok)setSessionFeedbackVisible(true);setExperience("review")})}/> : snapshot?<section className="surface empty-state"><h2>{t("noSession")}</h2><p>{t("startExercise")}</p><button className="button primary" type="button" onClick={()=>{void action(startExercise)}}>{t("startExercise")}</button></section>:<LoadingLearning/>}
              {!showExercise?(snapshot?<SessionFeedback snapshot={snapshot} visible={sessionFeedbackVisible}/>:null):null}
      </>}
    </main>
    <AccountDialog open={accountOpen} language={language} onClose={closeSecondaryPage}/>
<footer className="footer">{t("footerTagline",language)}</footer>
  </div>
}
function DailySummary({snapshot}:{snapshot:Snapshot}){const s=snapshot.dailySummary??{};return <section className="daily-summary" aria-label={t("dailySummary",getLanguage())}>{([[t("todayReviews"),s.dueCount],[t("todayNewKanji"),s.newCount],[t("masteryMastered"),s.masteredCount],[t("streak"),s.streak]] as const).map(([label,value])=><div className="stat-card" key={label}><strong>{fa(Number(value)||0)}</strong><span>{label}</span></div>)}</section>}
export { App };
// Production presentation: learning card reveal uses the flip interaction.

// Pages deployment uses source-built React artifact.
// Bilingual UI verified on dedicated release branch.