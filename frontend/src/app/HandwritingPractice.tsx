import { useEffect, useRef, useState, type PointerEvent } from "react";
import { formatNumber, t, type Language } from "./i18n";
import { kanjiSvgUrl, normalizeStrokeOrderCharacter, parseStrokePaths, type StrokePath } from "./stroke-order-core";
import { gradeHandwriting, type HandwritingGrade, type HandwritingStroke } from "./handwriting-grader";
import { sampleSvgStrokePaths } from "./handwriting-reference";
import { adaptHintLevel, hintLevelName, hintProfile, initialHintLevel, requestMoreHelp } from "./handwriting-hints";

type Point = { x:number; y:number };

const VIEWBOX_SIZE = 109;
const USER_LINE_WIDTH = 4;
const GUIDE_LINE_WIDTH = 2.15;
const MIN_CAPTURE_DISTANCE = 0.35;

function pointFromClient(clientX:number,clientY:number,rect:DOMRect):Point{
  return {
    x:((clientX-rect.left)/Math.max(1,rect.width))*VIEWBOX_SIZE,
    y:((clientY-rect.top)/Math.max(1,rect.height))*VIEWBOX_SIZE,
  };
}

function drawGridAndGuide(
  canvas:HTMLCanvasElement,
  referenceStrokes:HandwritingStroke[],
  wrap:HTMLElement,
  dpr:number,
  hintLevel:number,
  currentStrokeIndex:number,
){
  const rect=wrap.getBoundingClientRect();
  const size=Math.max(1,Math.round(rect.width));
  const ctx=canvas.getContext("2d");
  if(!ctx)return;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,size,size);
  const scale=size/VIEWBOX_SIZE;
  ctx.setTransform(dpr*scale,0,0,dpr*scale,0,0);

  const grid=size/4/scale;
  ctx.strokeStyle="rgba(116,109,97,.13)";
  ctx.lineWidth=0.8/scale;
  for(let i=1;i<4;i+=1){
    ctx.beginPath();ctx.moveTo(i*grid,0);ctx.lineTo(i*grid,VIEWBOX_SIZE);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,i*grid);ctx.lineTo(VIEWBOX_SIZE,i*grid);ctx.stroke();
  }

  const profile=hintProfile(hintLevel,{currentStrokeIndex,referenceLength:referenceStrokes.length});
  const drawStroke=(stroke:HandwritingStroke[],opacity:number,width:number)=>{
    if(stroke.length<2)return;
    ctx.save();ctx.strokeStyle="rgba(116,109,97,1)";ctx.globalAlpha=opacity;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(stroke[0].x,stroke[0].y);
    for(let i=1;i<stroke.length;i+=1)ctx.lineTo(stroke[i].x,stroke[i].y);
    ctx.stroke();ctx.restore();
  };
  if(profile.referenceMode==="all")for(const stroke of referenceStrokes)drawStroke(stroke,profile.opacity,GUIDE_LINE_WIDTH);
  else if(profile.referenceMode==="current"&&profile.currentStroke>=0)drawStroke(referenceStrokes[profile.currentStroke],profile.opacity,GUIDE_LINE_WIDTH*1.15);
  if(profile.currentStroke>=0&&profile.showStart){const start=referenceStrokes[profile.currentStroke]?.[0];if(start){ctx.save();ctx.fillStyle="rgba(192,57,43,.72)";ctx.beginPath();ctx.arc(start.x,start.y,2.35,0,Math.PI*2);ctx.fill();ctx.restore();}}
  if(profile.currentStroke>=0&&profile.showDirection){const stroke=referenceStrokes[profile.currentStroke],start=stroke?.[0],next=stroke?.[Math.min(8,(stroke?.length||1)-1)];if(start&&next){const length=Math.hypot(next.x-start.x,next.y-start.y);if(length>0.01){const ux=(next.x-start.x)/length,uy=(next.y-start.y)/length,tip=9,base=4;ctx.save();ctx.strokeStyle="rgba(192,57,43,.62)";ctx.lineWidth=1.25;ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.lineTo(start.x+ux*tip,start.y+uy*tip);ctx.stroke();ctx.beginPath();ctx.moveTo(start.x+ux*tip,start.y+uy*tip);ctx.lineTo(start.x+ux*(tip-base)-uy*base,start.y+uy*(tip-base)+ux*base);ctx.moveTo(start.x+ux*tip,start.y+uy*tip);ctx.lineTo(start.x+ux*(tip-base)+uy*base,start.y+uy*(tip-base)-ux*base);ctx.stroke();ctx.restore();}}}
  if(profile.currentStroke>=0&&profile.showNumber){const start=referenceStrokes[profile.currentStroke]?.[0];if(start){ctx.save();ctx.fillStyle="rgba(28,26,23,.68)";ctx.font="700 7px Inter,system-ui,sans-serif";ctx.textAlign="left";ctx.textBaseline="bottom";ctx.fillText(String(profile.currentStroke+1),start.x+4,start.y-4);ctx.restore();}}
}

function redrawUserInk(
  canvas:HTMLCanvasElement,
  strokes:HandwritingStroke[],
  wrap:HTMLElement,
  dpr:number,
){
  const rect=wrap.getBoundingClientRect();
  const size=Math.max(1,Math.round(rect.width));
  const ctx=canvas.getContext("2d");
  if(!ctx)return;
  const scale=size/VIEWBOX_SIZE;
  ctx.setTransform(dpr*scale,0,0,dpr*scale,0,0);
  ctx.clearRect(0,0,VIEWBOX_SIZE,VIEWBOX_SIZE);
  ctx.strokeStyle="#1c1a17";
  ctx.lineWidth=USER_LINE_WIDTH;
  ctx.lineCap="round";
  ctx.lineJoin="round";
  for(const stroke of strokes){
    if(stroke.length<2)continue;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x,stroke[0].y);
    for(let i=1;i<stroke.length;i+=1)ctx.lineTo(stroke[i].x,stroke[i].y);
    ctx.stroke();
  }
}

function drawSegment(canvas:HTMLCanvasElement,wrap:HTMLElement,dpr:number,from:Point,to:Point){
  const rect=wrap.getBoundingClientRect();
  const size=Math.max(1,Math.round(rect.width));
  const scale=size/VIEWBOX_SIZE;
  const ctx=canvas.getContext("2d");
  if(!ctx)return;
  ctx.setTransform(dpr*scale,0,0,dpr*scale,0,0);
  ctx.strokeStyle="#1c1a17";
  ctx.lineWidth=USER_LINE_WIDTH;
  ctx.lineCap="round";
  ctx.lineJoin="round";
  ctx.beginPath();
  ctx.moveTo(from.x,from.y);
  ctx.lineTo(to.x,to.y);
  ctx.stroke();
}

type HandwritingLearningSignal={state?:string;confidence?:number;mastery?:number};

export function HandwritingPractice({ character, language, learningSignal }: { character:string; language:Language; learningSignal?:HandwritingLearningSignal }){
  const normalized=normalizeStrokeOrderCharacter(character);
  const wrapRef=useRef<HTMLDivElement|null>(null);
  const guideCanvasRef=useRef<HTMLCanvasElement|null>(null);
  const inkCanvasRef=useRef<HTMLCanvasElement|null>(null);
  const activeStrokeRef=useRef<Point[]>([]);
  const strokesRef=useRef<HandwritingStroke[]>([]);
  const dprRef=useRef(1);
  const [paths,setPaths]=useState<StrokePath[]>([]);
  const [referenceStrokes,setReferenceStrokes]=useState<HandwritingStroke[]>([]);
  const [strokes,setStrokes]=useState<HandwritingStroke[]>([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [result,setResult]=useState<HandwritingGrade|null>(null);
  const [expanded,setExpanded]=useState(false);
  const [hintLevel,setHintLevel]=useState(()=>initialHintLevel(learningSignal));

  useEffect(()=>{
    let active=true;
    setPaths([]);
    setReferenceStrokes([]);
    strokesRef.current=[];
    activeStrokeRef.current=[];
    setStrokes([]);
    setResult(null);
    setError("");
    setHintLevel(initialHintLevel(learningSignal));
    if(!normalized)return()=>{active=false};
    setLoading(true);
    fetch(kanjiSvgUrl(normalized),{cache:"force-cache"})
      .then(response=>{
        if(!response.ok)throw new Error("KanjiVG request failed");
        return response.text();
      })
      .then(svg=>{
        const nextPaths=parseStrokePaths(svg);
        if(!nextPaths.length)throw new Error("No stroke paths found");
        const sampled=sampleSvgStrokePaths(svg,48);
        if(!sampled.length)throw new Error("No sampled stroke paths found");
        if(active){
          setPaths(nextPaths);
          setReferenceStrokes(sampled.map(path=>path.points));
        }
      })
      .catch(()=>{
        if(active){
          setError(t("handwritingUnavailable",language));
          setPaths([]);
          setReferenceStrokes([]);
        }
      })
      .finally(()=>{if(active)setLoading(false)});
    return()=>{active=false};
  },[language,normalized]);

  useEffect(()=>{
    if(!expanded)return;
    const wrap=wrapRef.current;
    const guide=guideCanvasRef.current;
    const ink=inkCanvasRef.current;
    if(!wrap||!guide||!ink)return;

    const resize=()=>{
      const rect=wrap.getBoundingClientRect();
      const size=Math.max(1,Math.round(rect.width));
      const dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));
      dprRef.current=dpr;
      guide.width=Math.round(size*dpr);
      guide.height=Math.round(size*dpr);
      ink.width=Math.round(size*dpr);
      ink.height=Math.round(size*dpr);
      const guideStrokeIndex=strokesRef.current.length<referenceStrokes.length?strokesRef.current.length:-1;
      drawGridAndGuide(guide,referenceStrokes,wrap,dpr,hintLevel,guideStrokeIndex);
      redrawUserInk(ink,strokesRef.current,wrap,dpr);
    };

    resize();
    const observer=new ResizeObserver(resize);
    observer.observe(wrap);
    return()=>observer.disconnect();
  },[expanded,paths,referenceStrokes,hintLevel,strokes.length]);

  const commitPoint=(point:Point)=>{
    const active=activeStrokeRef.current;
    const previous=active[active.length-1];
    if(!previous||Math.hypot(point.x-previous.x,point.y-previous.y)>=MIN_CAPTURE_DISTANCE){
      active.push(point);
      const ink=inkCanvasRef.current,wrap=wrapRef.current;
      if(ink&&wrap&&previous)drawSegment(ink,wrap,dprRef.current,previous,point);
      else if(ink&&wrap){
        const ctx=ink.getContext("2d");
        const rect=wrap.getBoundingClientRect();
        const size=Math.max(1,Math.round(rect.width));
        const scale=size/VIEWBOX_SIZE;
        if(ctx){
          ctx.setTransform(dprRef.current*scale,0,0,dprRef.current*scale,0,0);
          ctx.fillStyle="#1c1a17";
          ctx.beginPath();ctx.arc(point.x,point.y,USER_LINE_WIDTH/2,0,Math.PI*2);ctx.fill();
        }
      }
    }
  };

  const beginStroke=(event:PointerEvent<HTMLCanvasElement>)=>{
    if(loading||error||!referenceStrokes.length)return;
    try{event.currentTarget.setPointerCapture(event.pointerId)}catch{}
    setResult(null);
    activeStrokeRef.current=[];
    const nativeEvent=event.nativeEvent as globalThis.PointerEvent;
    commitPoint(pointFromClient(nativeEvent.clientX,nativeEvent.clientY,event.currentTarget.getBoundingClientRect()));
  };

  const moveStroke=(event:PointerEvent<HTMLCanvasElement>)=>{
    if(!activeStrokeRef.current.length)return;
    const nativeEvent=event.nativeEvent as globalThis.PointerEvent;
    const events=typeof nativeEvent.getCoalescedEvents==="function"?nativeEvent.getCoalescedEvents():[nativeEvent];
    const rect=event.currentTarget.getBoundingClientRect();
    for(const pointEvent of events){
      commitPoint(pointFromClient(pointEvent.clientX,pointEvent.clientY,rect));
    }
  };

  const finishStroke=(event:PointerEvent<HTMLCanvasElement>)=>{
    const active=activeStrokeRef.current;
    if(!active.length)return;
    const nativeEvent=event.nativeEvent as globalThis.PointerEvent;
    commitPoint(pointFromClient(nativeEvent.clientX,nativeEvent.clientY,event.currentTarget.getBoundingClientRect()));
    if(active.length>=2){
      const committed=active.map(point=>({...point}));
      strokesRef.current=[...strokesRef.current,committed];
      setStrokes(strokesRef.current);
    }else if(inkCanvasRef.current&&wrapRef.current){
      redrawUserInk(inkCanvasRef.current,strokesRef.current,wrapRef.current,dprRef.current);
    }
    activeStrokeRef.current=[];
    try{if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)}catch{}
  };

  const cancelStroke=(event:PointerEvent<HTMLCanvasElement>)=>{
    activeStrokeRef.current=[];
    if(inkCanvasRef.current&&wrapRef.current)redrawUserInk(inkCanvasRef.current,strokesRef.current,wrapRef.current,dprRef.current);
    try{if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)}catch{}
  };

  const clear=()=>{
    strokesRef.current=[];
    activeStrokeRef.current=[];
    setStrokes([]);
    setResult(null);
    if(inkCanvasRef.current&&wrapRef.current)redrawUserInk(inkCanvasRef.current,[],wrapRef.current,dprRef.current);
  };

  const grade=()=>{
    const next=gradeHandwriting(strokesRef.current,referenceStrokes);
    setResult(next);
    setHintLevel(current=>adaptHintLevel(current,next));
  };

  const messageKey=(code:HandwritingGrade["feedbackCode"])=>{
    switch(code){
      case "stroke-count":return"handwritingFeedbackStrokeCount";
      case "stroke-order":return"handwritingFeedbackOrder";
      case "placement":return"handwritingFeedbackPlacement";
      case "endpoints":return"handwritingFeedbackEndpoints";
      case "direction":return"handwritingFeedbackDirection";
      case "length":return"handwritingFeedbackLength";
      case "curvature":return"handwritingFeedbackCurvature";
      case "shape":return"handwritingFeedbackShape";
      case "good":return"handwritingGreat";
      default:return nextMessageKey(result?.overallSimilarity??0);
    }
  };

  const nextMessageKey=(similarity:number)=>similarity>=88?"handwritingGreat":similarity>=70?"handwritingGood":"handwritingRetry";

  const feedbackKey=result?messageKey(result.feedbackCode):null;
  const feedbackStrokeSpecific=result&&result.feedbackStroke!==null&&["endpoints","direction","length","curvature","shape"].includes(result.feedbackCode);
  const tone=result?(result.overallSimilarity>=88?"great":result.overallSimilarity>=70?"good":"retry"):"";

  return(
    <section className={"handwriting-practice "+(expanded?"is-expanded":"is-collapsed")} aria-label={t("handwritingPractice",language)} data-hint-level={hintLevel} data-hint-mode={hintLevelName(hintLevel)}>
      <button
        className="handwriting-header"
        type="button"
        aria-expanded={expanded}
        onClick={()=>setExpanded(value=>!value)}
      >
        <span className="handwriting-header-copy">
          <h3>{t("handwritingPractice",language)}</h3>
          <p>{t("handwritingHint",language)}</p>
        </span>
        <span className="handwriting-header-end">
          <span className="handwriting-stroke-count">{formatNumber(paths.length,language)} {t("strokesLabel",language)}</span>
          <span className="handwriting-toggle-icon" aria-hidden="true">⌄</span>
        </span>
      </button>

      {expanded?(
        <>
          {loading?<div className="handwriting-status" role="status">{t("strokeOrderLoading",language)}</div>:null}
          {!loading&&error?<div className="handwriting-status handwriting-error" role="status">{error}</div>:null}
          {!loading&&!error?(
            <>
              <div className="handwriting-hint-row" aria-live="polite">
                <span className="handwriting-hint-badge">{t("handwritingHintLevel",language)}: {(() => {const key=hintLevel===0?"handwritingTrace":hintLevel===1?"handwritingGhost":hintLevel===2?"handwritingStrokeGuide":hintLevel===3?"handwritingMinimal":"handwritingRecall";return t(key,language);})()}</span>
                <button className="handwriting-hint-button" type="button" onClick={()=>setHintLevel(current=>requestMoreHelp(current))} disabled={hintLevel===0}>{t("handwritingMoreHelp",language)}</button>
              </div>
              <p id={"handwriting-help-"+normalized} className="handwriting-help">
                {t("handwritingPracticeHelp",language)}
              </p>
              <div className="handwriting-canvas-wrap" ref={wrapRef}>
                <canvas
                  ref={guideCanvasRef}
                  className="handwriting-canvas handwriting-guide-canvas"
                  aria-hidden="true"
                />
                <canvas
                  ref={inkCanvasRef}
                  className="handwriting-canvas handwriting-ink-canvas"
                  aria-label={t("handwritingPractice",language)}
                  aria-describedby={"handwriting-help-"+normalized}
                  onPointerDown={beginStroke}
                  onPointerMove={moveStroke}
                  onPointerUp={finishStroke}
                  onPointerCancel={cancelStroke}
                />
              </div>
              <div className="handwriting-actions">
                <button className="button secondary" type="button" onClick={clear} disabled={!strokes.length&&!activeStrokeRef.current.length}>
                  {t("clearDrawing",language)}
                </button>
                <button className="button primary" type="button" onClick={grade} disabled={!strokes.length}>
                  {t("gradeDrawing",language)}
                </button>
              </div>
              {result?(
                <div
                  className={"handwriting-result "+tone}
                  role="status"
                  aria-live="polite"
                  data-score={result.overallSimilarity}
                  data-feedback-code={result.feedbackCode}
                >
                  <div className="handwriting-result-score">
                    <strong>{formatNumber(result.overallSimilarity,language)}%</strong>
                    <span>{t("handwritingSimilarity",language)}</span>
                  </div>
                  <div className="handwriting-result-copy">
                    <span>{feedbackKey?t(feedbackKey,language):t(nextMessageKey(result.overallSimilarity),language)}</span>
                    {feedbackStrokeSpecific?(
                      <small>
                        {t("handwritingStrokeDetail",language).replace("{n}",formatNumber(result.feedbackStroke??0,language))}
                      </small>
                    ):null}
                  </div>
                </div>
              ):null}
            </>
          ):null}
        </>
      ):null}
    </section>
  );
}
