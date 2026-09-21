import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  clearTransient,
  dontKnow,
  nextExercise,
  rateLearning,
  resetProgress,
  retryExercise,
  snapshot as readSnapshot,
  revealLearning,
  startExercise,
  startLearningExperience,
  submitExercise,
  updateSettings,
  type Rating,
  type Settings,
  type Snapshot,
  waitForEngine,
} from "./engine";

const fa=(v:number)=>String(Math.max(0,Math.round(v))).replace(/\d/g,d=>"۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
const text=(v:unknown,fallback="—")=>String(v??"").trim()||fallback;
const pct=(v:number|undefined)=>Math.round(Math.max(0,Math.min(1,Number(v)||0))*100);
const skills:Record<string,string>={meaning:"معنی",reading:"خوانش",production:"تولید",vocabulary:"واژگان",context:"بافت"};
const states:Record<string,string>={unseen:"دیده نشده",introduced:"معرفی شده",learning:"در حال یادگیری",weak:"ضعیف",recovering:"در حال بازیابی",stable:"پایدار",mastered:"مسلط"};
const actions:Record<string,string>={repair:"ترمیم",reinforce:"تقویت",recover:"بازیابی",maintain:"حفظ",explore:"اکتشاف"};
const outcomes:Record<string,string>={correct:"درست",wrong:"نادرست",unknown:"نمی‌دانم",near_miss:"نزدیک بود",empty:"خالی",invalid:"در دسترس نیست"};

function Progress({value,label}:{value:number;label:string}){return <div className="progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}><span style={{width:Math.max(0,Math.min(100,value))+"%"}}/></div>}
function Audio({value,label}:{value:string;label:string}){const unsupported=typeof window.speechSynthesis?.speak!=="function"||typeof window.SpeechSynthesisUtterance!=="function";return <button className="audio-button" type="button" disabled={unsupported} aria-label={unsupported?"صدا در این مرورگر در دسترس نیست":label} onClick={()=>{if(unsupported)return;const u=new SpeechSynthesisUtterance(value);u.lang="ja-JP";u.rate=.85;window.speechSynthesis.cancel();window.speechSynthesis.speak(u)}}>🔊</button>}

function Learning({card,onReveal,onRate}:{card:NonNullable<Snapshot["learning"]>;onReveal:()=>void;onRate:(r:Rating)=>void}){
  return <section className="surface card"><div className="card-topline"><span className="badge badge-red">学習</span><span>{card.isNew?"آشنایی با کانجی":"مرور یادگیری"}</span></div><h2>کارت یادگیری</h2>
    <div className="kanji-row"><span className="kanji-display" lang="ja">{text(card.character)}</span>{card.character?<Audio value={card.character} label="پخش تلفظ کانجی"/>:null}</div>
    {!card.revealed?<><div className="first-readings" lang="ja">{[...(card.on??[]),...(card.kun??[])].slice(0,3).join(" · ")}</div><p className="hint">{text(card.hint,"اول کانجی را ببین و بعد اطلاعات آن را باز کن.")}</p><button className="button primary wide" type="button" onClick={onReveal}>{text(card.revealLabel,"نمایش اطلاعات کانجی")}</button></>:<>
      {card.meanings?.length?<div className="meanings">{card.meanings.join(" · ")}</div>:null}
      <div className="readings"><Reading title="On’yomi" values={card.on??[]}/><Reading title="Kun’yomi" values={card.kun??[]}/></div>
      {card.examples?.length?<div className="examples"><h3>نمونهٔ واژگانی</h3>{card.examples.map((e,i)=><div className="example-row" key={(e.word??"")+"-"+i} lang="ja"><span>{[e.word,e.reading].filter(Boolean).join(" · ")}</span>{e.reading?<Audio value={e.reading} label="پخش تلفظ واژه"/>:null}</div>)}</div>:null}
      <p className="rating-title">کیفیت مرور بعدی را انتخاب کن.</p><div className="rating-grid">{([["Again","دوباره"],["Hard","سخت"],["Good","خوب"],["Easy","آسان"]] as const).map(([r,l])=><button className={"button rating rating-"+r.toLowerCase()} key={r} type="button" onClick={()=>onRate(r)}>{l}</button>)}</div>
    </>}
  </section>
}
function Reading({title,values}:{title:string;values:string[]}){return <div className="reading"><span>{title}</span><strong lang="ja">{values.length?values.join(" · "):"—"}</strong>{values[0]?<Audio value={values[0]} label={"پخش "+title}/>:null}</div>}
function Stimulus({ex}:{ex:NonNullable<Snapshot["exercise"]>}){
  const s=ex.stimulus??{};if(s.kind==="meaning")return <div className="stimulus meaning-stimulus"><small>راهنمای معنا</small><strong>{text(s.primary??ex.prompt)}</strong></div>;
  if(s.kind==="masked-vocabulary")return <div className="stimulus text-stimulus" lang="ja"><strong>{text(s.primary)}</strong>{s.secondary?<span>{s.secondary}</span>:null}{s.translation?<small>{s.translation}</small>:null}</div>;
  if(s.kind==="masked-context")return <div className="stimulus context-stimulus" lang="ja" dir="ltr"><strong>{text(s.primary)}</strong>{s.translation?<small>{s.translation}</small>:null}</div>;
  return <div className="stimulus kanji-stimulus" lang="ja">{text(s.primary??ex.character)}</div>;
}
function Exercise({snapshot,busy,onSubmit,onDontKnow,onRetry,onNext,onBack}:{snapshot:Snapshot;busy:boolean;onSubmit:(v:string)=>void;onDontKnow:()=>void;onRetry:()=>void;onNext:()=>void;onBack:()=>void}){
  const ex=snapshot.exercise??{},[answer,setAnswer]=useState("");const choices=(ex.choices??[]).slice(0,4);const production=ex.mode==="production"&&choices.length>=4;
  useEffect(()=>setAnswer(""),[ex.mode,ex.character,ex.prompt]);
  return <section id="exercise" className="surface card" tabIndex={-1}><div className="card-topline"><span className="badge">{text(ex.mode,"تمرین")}</span><span>یادآوری فعال</span></div><h2>تمرین فعلی</h2><p className="prompt">{text(ex.prompt,"هنوز تمرینی آماده نیست.")}</p>
    {!ex.mode?<div className="empty-state">هنوز تمرینی آماده نیست.</div>:<><Stimulus ex={ex}/>{production?<div className="production-grid">{choices.map(c=><button className="button production-choice" type="button" key={c} lang="ja" disabled={busy} onClick={()=>onSubmit(c)}>{c}</button>)}</div>:<label className="answer-area"><span>پاسخ شما</span><input autoFocus value={answer} disabled={busy} onChange={e=>setAnswer(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();onSubmit(answer)}}} placeholder={text(ex.stimulus?.inputPlaceholder,"پاسخ را وارد کنید")}/></label>}
    <div className="actions">{!production?<button className="button primary" type="button" disabled={busy} onClick={()=>onSubmit(answer)}>بررسی پاسخ</button>:null}<button className="button secondary" type="button" disabled={busy} onClick={onDontKnow}>نمی‌دانم</button></div>
    {snapshot.feedback?.state==="pending_retry"?<button className="button secondary wide" type="button" disabled={busy} onClick={onRetry}>تکرار همین مهارت</button>:null}
    {snapshot.feedback?.outcome?<button className="button primary wide" type="button" disabled={busy} onClick={onNext}>تمرین بعدی</button>:null}
    <button className="button secondary wide" type="button" disabled={busy} onClick={onBack}>بازگشت به کارت یادگیری</button></>}
  </section>
}
function Feedback({snapshot}:{snapshot:Snapshot}){const f=snapshot.feedback??{};if(!f.outcome)return null;return <section className={"surface feedback "+(f.correct?"feedback-good":"feedback-bad")} role="status" aria-live="polite" tabIndex={-1}><span className="feedback-icon">{f.correct?"✓":f.outcome==="unknown"?"?":"!"}</span><div><h2>{outcomes[f.outcome]??text(f.outcome)}</h2><p>{f.correct?"بازیابی درست بود.":text(f.reason)}</p>{!f.correct&&(snapshot.exercise?.answerHint||f.answerHint)?<p className="answer-hint">پاسخ درست: {text(snapshot.exercise?.answerHint??f.answerHint)}</p>:null}</div></section>}
function Panel({title,children}:{title:string;children:ReactNode}){return <section className="surface insight-panel"><h3>{title}</h3>{children}</section>}
function Insights({snapshot}:{snapshot:Snapshot}){return <details className="insights"><summary>جزئیات جلسه</summary><div className="insights-grid">
  <Panel title="مهارت‌های یادگیرنده">{Object.keys(skills).map(k=>{const s=snapshot.learner?.attributes?.[k]??{};return <p className="row" key={k}><span>{skills[k]}</span><strong>{states[s.state??""]??text(s.state)} · اخیر {fa(pct(s.recentAccuracy))}٪</strong></p>})}</Panel>
  <Panel title="تمرکز تطبیقی"><p className="row"><span>مهارت</span><strong>{skills[snapshot.adaptiveReason?.mode??""]??text(snapshot.adaptiveReason?.mode)}</strong></p><p className="row"><span>عمل</span><strong>{actions[snapshot.adaptiveReason?.action??""]??text(snapshot.adaptiveReason?.action)}</strong></p>{(snapshot.adaptiveReason?.reasons??[]).filter(Boolean).map((r,i)=><p className="reason" key={r+"-"+i}>{r}</p>)}</Panel>
  <Panel title="خلاصه جلسه"><p className="row"><span>تلاش‌ها</span><strong>{fa(snapshot.sessionSummary?.attempts??0)}</strong></p><p className="row"><span>درست</span><strong>{fa(snapshot.sessionSummary?.correct??0)}</strong></p><p className="row"><span>دقت</span><strong>{fa(pct(snapshot.sessionSummary?.accuracy))}٪</strong></p></Panel>
  <Panel title="نتایج اخیر">{(snapshot.recentOutcomes??[]).map((r,i)=><div className="outcome-row" key={(r.character??"")+"-"+i}><strong lang="ja">{text(r.character)}</strong><span>{skills[r.mode??""]??text(r.mode)} · {outcomes[r.quality??""]??outcomes[r.outcome??""]??text(r.quality)}</span><b>{r.correct?"✓":outcomes[r.outcome??""]??"—"}</b></div>)}{!snapshot.recentOutcomes?.length?<p className="empty-text">هنوز نتیجه‌ای ثبت نشده است.</p>:null}</Panel>
</div></details>}
function Setting({label,value,min,max,onChange}:{label:string;value:number;min:number;max:number;onChange:(v:number)=>void}){return <label className="setting-row"><span>{label}</span><input type="number" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))}/></label>}
function SettingsDialog({open,snapshot,busy,onClose,onSave,onReset}:{open:boolean;snapshot:Snapshot;busy:boolean;onClose:()=>void;onSave:(s:Settings)=>void;onReset:()=>void}){
  const s=snapshot.settings??{dailyNew:5,dailyGoal:20,leechThreshold:8,production:true,vocabulary:true,context:true};const [draft,setDraft]=useState<Settings>(s);
  useEffect(()=>{if(open)setDraft(s)},[open,s.dailyNew,s.dailyGoal,s.leechThreshold,s.production,s.vocabulary,s.context]);
  return open?<dialog open className="dialog" aria-labelledby="settings-title"><button className="dialog-close" type="button" aria-label="بستن" onClick={onClose}>×</button><h2 id="settings-title">تنظیمات</h2><form className="settings-form" onSubmit={e=>{e.preventDefault();onSave(draft)}}>
    <Setting label="کانجی جدید در روز" value={draft.dailyNew} min={1} max={30} onChange={v=>setDraft({...draft,dailyNew:v})}/><Setting label="هدف تعداد مرور روزانه" value={draft.dailyGoal} min={1} max={500} onChange={v=>setDraft({...draft,dailyGoal:v})}/><Setting label="آستانهٔ Leech" value={draft.leechThreshold} min={2} max={30} onChange={v=>setDraft({...draft,leechThreshold:v})}/>
    {([["production","تولید کانجی"],["vocabulary","تکمیل واژه"],["context","یادآوری بافت"]] as const).map(([k,l])=><label className="setting-row" key={k}><span>{l}</span><input type="checkbox" checked={draft[k]} onChange={e=>setDraft({...draft,[k]:e.target.checked})}/></label>)}
    <div className="actions"><button className="button primary" type="submit" disabled={busy}>ذخیره</button><button className="button secondary" type="button" onClick={onClose}>بستن</button><button className="button secondary" type="button" disabled={busy} onClick={onReset}>پاک کردن پیشرفت</button></div>
  </form></dialog>:null;
}
function App(){
  const [snapshot,setSnapshot]=useState<Snapshot|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[experience,setExperience]=useState<"review"|"practice">("review"),[statsOpen,setStatsOpen]=useState(false),[settingsOpen,setSettingsOpen]=useState(false);
  const refresh=useCallback(async()=>{const s=await readSnapshot();setSnapshot(s);return s},[]);
  useEffect(()=>{let mounted=true;void startLearningExperience().catch(()=>{});const listener=(e:Event)=>{const d=(e as CustomEvent<Snapshot>).detail;if(mounted&&d)setSnapshot(d)};void refresh().then(()=>document.addEventListener("kanji5:v1.9-v2-view-models",listener)).catch(e=>{if(mounted)setError(e instanceof Error?e.message:"هستهٔ یادگیری در دسترس نیست.")});return()=>{mounted=false;document.removeEventListener("kanji5:v1.9-v2-view-models",listener)}},[refresh]);
  async function action(task:()=>Promise<unknown>){setBusy(true);setError("");try{await task();setSnapshot(await readSnapshot())}catch(e){setError(e instanceof Error?e.message:"عملیات انجام نشد.")}finally{setBusy(false)}}
  const progress=pct(snapshot?.session?.completionFraction);const showExercise=experience==="practice";
  if(error&&!snapshot)return <div className="app-shell centered"><section className="surface fatal"><span className="fatal-kanji" lang="ja">迷</span><h1>رابط هستهٔ یادگیری آماده نشد</h1><p>{error}</p><button className="button primary" type="button" onClick={()=>location.reload()}>تلاش دوباره</button></section></div>;
  return <div className="app-shell">
    <a className="skip-link" href="#primary-content">رفتن به محتوای اصلی</a>
    <header className="header"><div><p className="eyebrow red">常用漢字 · 2,136</p><h1>کانجی ۵</h1><p className="subtitle">پنج کانجی مهم ژاپنی در روز، با مرور تطبیقی</p></div>
      <div className="header-actions"><div className="session-progress"><Progress value={progress} label="پیشرفت جلسه"/><span>{fa((snapshot?.session?.plannedTotal??0)-(snapshot?.session?.remainingTotal??0))} از {fa(snapshot?.session?.plannedTotal??0)}</span></div>
      <button className="button secondary" type="button" disabled={busy} onClick={()=>setStatsOpen(true)}>آمار</button><button className="button secondary" type="button" disabled={busy} onClick={()=>setSettingsOpen(true)}>تنظیمات</button></div>
    </header>
    <nav className="experience-nav" aria-label="مسیر یادگیری"><button className={"experience-tab "+(experience==="review"?"active":"")} type="button" aria-current={experience==="review"?"page":undefined} disabled={busy} onClick={()=>void action(async()=>{await startLearningExperience();await clearTransient();setExperience("review")})}>یادگیری</button><button className={"experience-tab "+(experience==="practice"?"active":"")} type="button" aria-current={experience==="practice"?"page":undefined} disabled={busy} onClick={()=>void action(async()=>{await startExercise();setExperience("practice")})}>یادآوری فعال</button></nav><main id="primary-content" className="content">
      {!showExercise?(snapshot?<DailySummary snapshot={snapshot}/>:<div className="surface loading">در حال اتصال به هستهٔ یادگیری…</div>):null}
      {!showExercise&&snapshot?.dailyGoal?<section className="surface goal"><div className="goal-top"><strong>هدف روزانه: {fa(snapshot.dailyGoal.completed??0)}/{fa(snapshot.dailyGoal.target??0)}</strong><span>{snapshot.dailyGoal.celebrated?"🎉 تکمیل شد":""}</span></div><Progress value={pct(snapshot.dailyGoal.progress)} label="هدف روزانه"/></section>:null}
      {!showExercise&&snapshot?.upcomingReviews?.length?<details className="surface upcoming"><summary>مرورهای پیش‌رو</summary><div className="upcoming-body">{snapshot.upcomingReviews.map(r=><div className="upcoming-row" key={r.character+r.dueAt}><strong lang="ja">{r.character}</strong><span>{new Date(r.dueAt).toLocaleString("fa-IR",{dateStyle:"medium",timeStyle:"short"})}</span></div>)}</div></details>:null}
      {showExercise?<><Exercise snapshot={snapshot??{}} busy={busy} onSubmit={v=>void action(()=>submitExercise(v))} onDontKnow={()=>void action(dontKnow)} onRetry={()=>void action(retryExercise)} onNext={()=>void action(nextExercise)} onBack={()=>void action(async()=>{await startLearningExperience();await clearTransient();setExperience("review")})}/><Feedback snapshot={snapshot??{}}/></>:snapshot?.learning?.active?<Learning card={snapshot.learning} onReveal={()=>void action(revealLearning)} onRate={r=>void action(async()=>{await rateLearning(r);setExperience("review")})}/>:<section className="surface empty-state"><h2>جلسه‌ای برای نمایش وجود ندارد</h2><p>برای شروع تمرین آموزشی از دکمهٔ بالای صفحه استفاده کن.</p><button className="button primary" type="button" onClick={()=>void action(async()=>{await startExercise();setExperience("practice")})}>شروع تمرین</button></section>}
      {!showExercise&&snapshot?<Insights snapshot={snapshot}/>:null}
    </main>
    <footer className="footer">یادگیریت را کوتاه، پیوسته و هدفمند نگه دار.</footer>
    {statsOpen?<dialog open className="dialog" aria-labelledby="stats-title"><button className="dialog-close" type="button" aria-label="بستن" onClick={()=>setStatsOpen(false)}>×</button><h2 id="stats-title">آمار</h2><div className="dialog-grid"><StatRow label="کل مرورها" value={fa(snapshot?.stats?.totalReviews??0)}/><StatRow label="مرورهای غیر Again" value={fa(pct(snapshot?.stats?.nonAgainRate))+"٪"}/><StatRow label="کانجی مطالعه‌شده" value={fa(snapshot?.stats?.studiedCount??0)+" / "+fa(snapshot?.stats?.deckSize??0)}/><StatRow label="رشتهٔ فعلی" value={fa(snapshot?.stats?.currentStreak??0)+" 🔥"}/><StatRow label="طولانی‌ترین رشته" value={fa(snapshot?.stats?.longestStreak??0)+" 🔥"}/><StatRow label="Leech" value={fa(snapshot?.stats?.leechCount??0)}/></div></dialog>:null}
    <SettingsDialog open={settingsOpen} snapshot={snapshot??{}} busy={busy} onClose={()=>setSettingsOpen(false)} onSave={s=>void action(async()=>{await updateSettings(s);setSettingsOpen(false)})} onReset={()=>void action(async()=>{resetProgress()})}/>
  </div>
}
function DailySummary({snapshot}:{snapshot:Snapshot}){const s=snapshot.dailySummary??{};return <section className="daily-summary" aria-label="خلاصهٔ امروز">{([["مرورهای امروز",s.dueCount],["کانجی جدید امروز",s.newCount],["یادگرفته‌شده",s.masteredCount],["روز پیاپی",s.streak]] as const).map(([label,value])=><div className="stat-card" key={label}><strong>{fa(Number(value)||0)}</strong><span>{label}</span></div>)}</section>}
function StatRow({label,value}:{label:string;value:string}){return <div className="stat-row"><span>{label}</span><strong>{value}</strong></div>}
export { App };