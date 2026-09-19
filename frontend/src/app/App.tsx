import { useCallback, useEffect, useState, type ReactNode } from "react";
import { dontKnow, nextExercise, retryExercise, startExercise, submitExercise, type Boundary, type Rating, type Settings, type Snapshot, waitForEngine } from "./engine";

const fa=(v:number)=>String(Math.max(0,Math.round(v))).replace(/\d/g,d=>"۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
const text=(v:unknown,fallback="—")=>String(v??"").trim()||fallback;
const pct=(v:number|undefined)=>Math.round(Math.max(0,Math.min(1,Number(v)||0))*100);
const skillLabels:Record<string,string>={meaning:"معنی",reading:"خوانش",production:"تولید",vocabulary:"واژگان",context:"بافت"};
const stateLabels:Record<string,string>={unseen:"دیده نشده",introduced:"معرفی شده",learning:"در حال یادگیری",weak:"ضعیف",recovering:"در حال بازیابی",stable:"پایدار",mastered:"مسلط"};
const actionLabels:Record<string,string>={repair:"ترمیم",reinforce:"تقویت",recover:"بازیابی",maintain:"حفظ",explore:"اکتشاف"};
const outcomeLabels:Record<string,string>={correct:"درست",wrong:"نادرست",unknown:"نمی‌دانم",near_miss:"نزدیک بود",empty:"خالی",invalid:"در دسترس نیست"};

function Progress({value,label}:{value:number;label:string}){return <div className="progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}><span style={{width:Math.max(0,Math.min(100,value))+"%"}}/></div>}
function Audio({value,label}:{value:string;label:string}){const disabled=typeof window.speechSynthesis?.speak!=="function"||typeof window.SpeechSynthesisUtterance!=="function";return <button type="button" className="audio-button" disabled={disabled} aria-label={disabled?"صدا در این مرورگر در دسترس نیست":label} onClick={()=>{if(disabled)return;const u=new SpeechSynthesisUtterance(value);u.lang="ja-JP";u.rate=.85;window.speechSynthesis.cancel();window.speechSynthesis.speak(u)}}>🔊</button>}

function LearningCard({card,onReveal,onRate}:{card:NonNullable<Snapshot["learning"]>;onReveal:()=>void;onRate:(r:Rating)=>void}){
  const reads=[...(card.on??[]),...(card.kun??[])].slice(0,3);
  return <section className="surface card learning-card">
    <div className="card-topline"><span className="badge badge-red">学習</span><span>{card.isNew?"آشنایی با کانجی":"مرور یادگیری"}</span></div>
    <h2>کارت یادگیری</h2>
    <div className="kanji-row"><span className="kanji-display" lang="ja">{text(card.character)}</span>{card.character?<Audio value={card.character} label="پخش تلفظ کانجی"/>:null}</div>
    {!card.revealed?<><div className="first-readings" lang="ja">{reads.join(" · ")}</div><p className="hint">{text(card.hint,"اول کانجی را ببین و بعد اطلاعات آن را باز کن.")}</p><button className="button primary wide" type="button" onClick={onReveal}>{text(card.revealLabel,"نمایش اطلاعات کانجی")}</button></>:<>
      {card.meanings?.length?<div className="meanings">{card.meanings.join(" · ")}</div>:null}
      <div className="readings"><Reading title="On’yomi" values={card.on??[]}/><Reading title="Kun’yomi" values={card.kun??[]}/></div>
      {card.examples?.length?<div className="examples"><h3>نمونهٔ واژگانی</h3>{card.examples.map((ex,i)=><div className="example-row" key={(ex.word??"")+"-"+i} lang="ja"><span>{[ex.word,ex.reading].filter(Boolean).join(" · ")}</span>{ex.reading?<Audio value={ex.reading} label="پخش تلفظ واژه"/>:null}</div>)}</div>:null}
      <p className="rating-title">کیفیت مرور بعدی را انتخاب کن.</p><div className="rating-grid">{([["Again","دوباره"],["Hard","سخت"],["Good","خوب"],["Easy","آسان"]] as const).map(([r,l])=><button className={"button rating rating-"+r.toLowerCase()} key={r} type="button" onClick={()=>onRate(r)}>{l}</button>)}</div>
    </>}
  </section>
}
function Reading({title,values}:{title:string;values:string[]}){return <div className="reading"><span>{title}</span><strong lang="ja">{values.length?values.join(" · "):"—"}</strong>{values[0]?<Audio value={values[0]} label={"پخش "+title}/>:null}</div>}
function Stimulus({ex}:{ex:NonNullable<Snapshot["exercise"]>}){
  const s=ex.stimulus??{}, kind=s.kind??"kanji";
  if(kind==="meaning")return <div className="stimulus meaning-stimulus"><small>راهنمای معنا</small><strong>{text(s.primary??ex.prompt)}</strong></div>;
  if(kind==="masked-vocabulary")return <div className="stimulus text-stimulus" lang="ja"><strong>{text(s.primary)}</strong>{s.secondary?<span>{s.secondary}</span>:null}{s.translation?<small>{s.translation}</small>:null}</div>;
  if(kind==="masked-context")return <div className="stimulus context-stimulus" lang="ja" dir="ltr"><strong>{text(s.primary)}</strong>{s.translation?<small>{s.translation}</small>:null}</div>;
  return <div className="stimulus kanji-stimulus" lang="ja">{text(s.primary??ex.character)}</div>;
}
function ExerciseCard({snapshot,busy,onSubmit,onDontKnow,onRetry,onNext,onBack}:{snapshot:Snapshot;busy:boolean;onSubmit:(v:string)=>void;onDontKnow:()=>void;onRetry:()=>void;onNext:()=>void;onBack:()=>void}){
  const ex=snapshot.exercise??{}, [answer,setAnswer]=useState("");
  useEffect(()=>setAnswer(""),[ex.mode,ex.character,ex.prompt]);
  const choices=(ex.choices??[]).slice(0,4), production=ex.mode==="production"&&choices.length>=4;
  return <section id="exercise" className="surface card exercise-card" tabIndex={-1}>
    <div className="card-topline"><span className="badge">{text(ex.mode,"تمرین")}</span><span>یادآوری فعال</span></div><h2>تمرین فعلی</h2><p className="prompt">{text(ex.prompt,"هنوز تمرینی آماده نیست.")}</p>
    {!ex.mode?<div className="empty-state"><p>هنوز تمرینی آماده نیست.</p></div>:<><Stimulus ex={ex}/>
      {production?<div className="production-grid">{choices.map(c=><button className="button production-choice" type="button" key={c} disabled={busy} onClick={()=>onSubmit(c)} lang="ja">{c}</button>)}</div>:<label className="answer-area"><span>پاسخ شما</span><input autoFocus value={answer} disabled={busy} onChange={e=>setAnswer(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();onSubmit(answer)}}} placeholder={text(ex.stimulus?.inputPlaceholder,"پاسخ را وارد کنید")}/></label>}
      <div className="actions">{!production?<button className="button primary" type="button" disabled={busy} onClick={()=>onSubmit(answer)}>بررسی پاسخ</button>:null}<button className="button secondary" type="button" disabled={busy} onClick={onDontKnow}>نمی‌دانم</button></div>
      {snapshot.feedback?.state==="pending_retry"?<button className="button secondary wide" type="button" disabled={busy} onClick={onRetry}>تکرار همین مهارت</button>:null}
      {snapshot.feedback?.outcome?<button className="button primary wide" type="button" disabled={busy} onClick={onNext}>تمرین بعدی</button>:null}
      <button className="button secondary wide" type="button" disabled={busy} onClick={onBack}>بازگشت به کارت یادگیری</button>
    </>}
  </section>
}
function Feedback({snapshot}:{snapshot:Snapshot}){const f=snapshot.feedback??{};if(!f.outcome)return null;return <section className={"surface feedback "+(f.correct?"feedback-good":"feedback-bad")} role="status" aria-live="polite" tabIndex={-1}><span className="feedback-icon" aria-hidden="true">{f.correct?"✓":f.outcome==="unknown"?"?":"!"}</span><div><h2>{outcomeLabels[f.outcome]??text(f.outcome)}</h2><p>{f.correct?"بازیابی درست بود.":text(f.reason,"پاسخ را مرور کن و دوباره تلاش کن.")}</p>{!f.correct&&(snapshot.exercise?.answerHint||f.answerHint)?<p className="answer-hint">پاسخ درست: {text(snapshot.exercise?.answerHint??f.answerHint)}</p>:null}</div></section>}
function Panel({title,children}:{title:string;children:ReactNode}){return <section className="surface insight-panel"><h3>{title}</h3>{children}</section>}
function Row({label,value}:{label:string;value:string}){return <p className="row"><span>{label}</span><strong>{value}</strong></p>}
function Insights({snapshot}:{snapshot:Snapshot}){return <details className="insights"><summary>جزئیات جلسه</summary><div className="insights-grid">
  <Panel title="مهارت‌های یادگیرنده">{Object.keys(skillLabels).map(k=>{const s=snapshot.learner?.attributes?.[k]??{};return <Row key={k} label={skillLabels[k]} value={(stateLabels[s.state??""]??text(s.state))+" · اخیر "+fa(pct(s.recentAccuracy))+"٪"}/>})}</Panel>
  <Panel title="تمرکز تطبیقی"><Row label="مهارت" value={skillLabels[snapshot.adaptiveReason?.mode??""]??text(snapshot.adaptiveReason?.mode)}/><Row label="عمل" value={actionLabels[snapshot.adaptiveReason?.action??""]??text(snapshot.adaptiveReason?.action)}/>{(snapshot.adaptiveReason?.reasons??[]).filter(Boolean).map((r,i)=><p className="reason" key={r+"-"+i}>{r}</p>)}</Panel>
  <Panel title="خلاصه جلسه"><Row label="تلاش‌ها" value={fa(snapshot.sessionSummary?.attempts??0)}/><Row label="درست" value={fa(snapshot.sessionSummary?.correct??0)}/><Row label="دقت" value={fa(pct(snapshot.sessionSummary?.accuracy))+"٪"}/></Panel>
  <Panel title="نتایج اخیر">{(snapshot.recentOutcomes??[]).map((r,i)=><div className="outcome-row" key={(r.character??"")+"-"+i}><strong lang="ja">{text(r.character)}</strong><span>{skillLabels[r.mode??""]??text(r.mode)} · {outcomeLabels[r.quality??""]??outcomeLabels[r.outcome??""]??text(r.quality)}</span><b>{r.correct?"✓":outcomeLabels[r.outcome??""]??"—"}</b></div>)}{!snapshot.recentOutcomes?.length?<p className="empty-text">هنوز نتیجه‌ای ثبت نشده است.</p>:null}</Panel>
</div></details>}
function DailySummary({snapshot}:{snapshot:Snapshot}){const s=snapshot.dailySummary??{};return <section className="daily-summary" aria-label="خلاصهٔ امروز">{([["مرورهای امروز",s.dueCount],["کانجی جدید امروز",s.newCount],["یادگرفته‌شده",s.masteredCount],["روز پیاپی",s.streak]] as const).map(([label,value])=><div className="stat-card" key={label}><strong>{fa(Number(value)||0)}</strong><span>{label}</span></div>)}</section>}
function Setting({label,value,min,max,onChange}:{label:string;value:number;min:number;max:number;onChange:(v:number)=>void}){return <label className="setting-row"><span>{label}</span><input type="number" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))}/></label>}
function SettingsDialog({open,snapshot,busy,onClose,onSave,onReset}:{open:boolean;snapshot:Snapshot;busy:boolean;onClose:()=>void;onSave:(s:Settings)=>void;onReset:()=>void}){
  const s=snapshot.settings??{dailyNew:5,dailyGoal:20,leechThreshold:8,production:true,vocabulary:true,context:true};
  const [draft,setDraft]=useState<Settings>(s);
  useEffect(()=>{if(open)setDraft(s)},[open,s.dailyNew,s.dailyGoal,s.leechThreshold,s.production,s.vocabulary,s.context]);
  return open?<dialog open className="dialog" aria-labelledby="settings-title"><button className="dialog-close" type="button" aria-label="بستن" onClick={onClose}>×</button><h2 id="settings-title">تنظیمات</h2>
    <form className="settings-form" onSubmit={e=>{e.preventDefault();onSave(draft)}}>
      <Setting label="کانجی جدید در روز" value={draft.dailyNew} min={1} max={30} onChange={v=>setDraft({...draft,dailyNew:v})}/>
      <Setting label="هدف تعداد مرور روزانه" value={draft.dailyGoal} min={1} max={500} onChange={v=>setDraft({...draft,dailyGoal:v})}/>
      <Setting label="آستانهٔ Leech" value={draft.leechThreshold} min={2} max={30} onChange={v=>setDraft({...draft,leechThreshold:v})}/>
      {([["production","تولید کانجی"],["vocabulary","تکمیل واژه"],["context","یادآوری بافت"]] as const).map(([k,l])=><label className="setting-row" key={k}><span>{l}</span><input type="checkbox" checked={draft[k]} onChange={e=>setDraft({...draft,[k]:e.target.checked})}/></label>)}
      <div className="actions"><button className="button primary" type="submit" disabled={busy}>ذخیره</button><button className="button secondary" type="button" onClick={onClose}>بستن</button><button className="button secondary" type="button" disabled={busy} onClick={onReset}>پاک کردن پیشرفت</button></div>
    </form></dialog>:null;
}
function App(){
  const [snapshot,setSnapshot]=useState<Snapshot|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[exerciseMode,setExerciseMode]=useState(false),[statsOpen,setStatsOpen]=useState(false),[settingsOpen,setSettingsOpen]=useState(false);
  const refresh=useCallback(async()=>{const b=await waitForEngine();setSnapshot(await b.snapshot());return b},[]);
  useEffect(()=>{let mounted=true;const onVM=(e:Event)=>{if(mounted){const d=(e as CustomEvent<Snapshot>).detail;if(d)setSnapshot(d)}};void refresh().then(()=>document.addEventListener("kanji5:v1.9-v2-view-models",onVM)).catch(e=>{if(mounted)setError(e instanceof Error?e.message:"هستهٔ یادگیری در دسترس نیست.")});return()=>{mounted=false;document.removeEventListener("kanji5:v1.9-v2-view-models",onVM)}},[refresh]);
  async function action(task:()=>Promise<unknown>){setBusy(true);setError("");try{await task();const b=await waitForEngine();setSnapshot(await b.snapshot())}catch(e){setError(e instanceof Error?e.message:"عملیات انجام نشد.")}finally{setBusy(false)}}
  const showExercise=exerciseMode||Boolean(snapshot?.exercise?.mode);
  if(error&&!snapshot)return <div className="app-shell centered"><section className="surface fatal"><span className="fatal-kanji" lang="ja">迷</span><h1>رابط هستهٔ یادگیری آماده نشد</h1><p>{error}</p><button className="button primary" type="button" onClick={()=>location.reload()}>تلاش دوباره</button></section></div>;
  return <div className="app-shell">
    <a className="skip-link" href="#primary-content">رفتن به محتوای اصلی</a>
    <header className="header"><div><p className="eyebrow red">常用漢字 · 2,136</p><h1>کانجی ۵</h1><p className="subtitle">React/TypeScript presentation · v1.9 engine authoritative</p></div>
      <div className="header-actions"><div className="session-progress"><Progress value={pct(snapshot?.session?.completionFraction)} label="پیشرفت جلسه"/><span>{fa((snapshot?.session?.plannedTotal??0)-(snapshot?.session?.remainingTotal??0))} از {fa(snapshot?.session?.plannedTotal??0)}</span></div>
      <button className="button secondary" type="button" disabled={busy} onClick={()=>void action(async()=>{await startExercise();setExerciseMode(true)})}>تمرین آموزشی</button>
      <button className="button secondary" type="button" disabled={busy} onClick={()=>setStatsOpen(true)}>آمار</button>
      <button className="button secondary" type="button" disabled={busy} onClick={()=>setSettingsOpen(true)}>تنظیمات</button></div>
    </header>
    <main id="primary-content" className="content">
      {snapshot?<DailySummary snapshot={snapshot}/>:<div className="surface loading">در حال اتصال به هستهٔ یادگیری…</div>}
      {snapshot?.dailyGoal?<section className="surface goal"><div className="goal-top"><strong>هدف روزانه: {fa(snapshot.dailyGoal.completed??0)}/{fa(snapshot.dailyGoal.target??0)}</strong><span>{snapshot.dailyGoal.celebrated?"🎉 تکمیل شد":""}</span></div><Progress value={pct(snapshot.dailyGoal.progress)} label="هدف روزانه"/></section>:null}
      {snapshot?.upcomingReviews?.length?<details className="surface upcoming"><summary>مرورهای پیش‌رو</summary><div className="upcoming-body">{snapshot.upcomingReviews.map(r=><div className="upcoming-row" key={r.character+r.dueAt}><strong lang="ja">{r.character}</strong><span>{new Date(r.dueAt).toLocaleString("fa-IR",{dateStyle:"medium",timeStyle:"short"})}</span></div>)}</div></details>:null}
      {showExercise?<><ExerciseCard snapshot={snapshot??{}} busy={busy} onSubmit={v=>void action(()=>submitExercise(v))} onDontKnow={()=>void action(dontKnow)} onRetry={()=>void action(retryExercise)} onNext={()=>void action(nextExercise)} onBack={()=>void action(async()=>{await window.__KANJI5_V19_V2_BOUNDARY__?.clearTransient?.();setExerciseMode(false)})}/><Feedback snapshot={snapshot??{}}/></>
      :snapshot?.learning?.active?<LearningCard card={snapshot.learning} onReveal={()=>void action(async()=>{await window.__KANJI5_V19_V2_BOUNDARY__?.revealLearning?.()})} onRate={r=>void action(async()=>{await window.__KANJI5_V19_V2_BOUNDARY__?.rateLearning(r);setExerciseMode(false)})}/>
      :<section className="surface empty-state"><h2>جلسه‌ای برای نمایش وجود ندارد</h2><p>برای شروع تمرین آموزشی از دکمهٔ بالای صفحه استفاده کن.</p><button className="button primary" type="button" onClick={()=>void action(async()=>{await startExercise();setExerciseMode(true)})}>شروع تمرین</button></section>}
      {snapshot?<Insights snapshot={snapshot}/>:null}
    </main>
    <footer className="footer">Sumi Play visual language migrated from Kanjis Bloom; persistence, scheduling, grading, learner modeling, recovery and offline runtime remain owned by Kanji5.</footer>
    {statsOpen?<dialog open className="dialog" aria-labelledby="stats-title"><button className="dialog-close" type="button" aria-label="بستن" onClick={()=>setStatsOpen(false)}>×</button><h2 id="stats-title">آمار</h2><div className="dialog-grid">
      <StatRow label="کل مرورها" value={fa(snapshot?.stats?.totalReviews??0)}/><StatRow label="مرورهای غیر Again" value={fa(pct(snapshot?.stats?.nonAgainRate))+"٪"}/><StatRow label="کانجی مطالعه‌شده" value={fa(snapshot?.stats?.studiedCount??0)+" / "+fa(snapshot?.stats?.deckSize??0)}/><StatRow label="رشتهٔ فعلی" value={fa(snapshot?.stats?.currentStreak??0)+" 🔥"}/><StatRow label="طولانی‌ترین رشته" value={fa(snapshot?.stats?.longestStreak??0)+" 🔥"}/><StatRow label="Leech" value={fa(snapshot?.stats?.leechCount??0)}/></div></dialog>:null}
    <SettingsDialog open={settingsOpen} snapshot={snapshot??{}} busy={busy} onClose={()=>setSettingsOpen(false)} onSave={s=>void action(async()=>{const b:Boundary=await waitForEngine();await b.updateSettings(s);setSettingsOpen(false)})} onReset={()=>void action(async()=>{window.__KANJI5_V19_V2_BOUNDARY__?.resetProgress?.()})}/>
  </div>;
}
function StatRow({label,value}:{label:string;value:string}){return <div className="stat-row"><span>{label}</span><strong>{value}</strong></div>}
export { App };