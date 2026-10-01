import { useEffect, useState } from "react";
import { formatNumber, t, type Language } from "./i18n";

type GrammarLesson = { title:string; pattern:string; fa:string; en:string; example:string; translation:string; questionFa:string; questionEn:string; options:string[]; answer:string; explanationFa:string; explanationEn:string; };

const LESSONS: GrammarLesson[] = [
  {title:"Copula",pattern:"です",fa:"برای بیان هویت یا توضیح سادهٔ مؤدبانه استفاده می‌شود.",en:"Use です for a polite identification or simple statement.",example:"これは本です。",translation:"This is a book.",questionFa:"کدام جمله یعنی «این یک کتاب است»؟",questionEn:"Which sentence means “This is a book”?",options:["これは本です。","これは本を。","これは本に。"],answer:"これは本です。",explanationFa:"です جمله را به یک بیان مؤدبانه و اسمی تبدیل می‌کند.",explanationEn:"です makes the noun phrase a polite statement."},
  {title:"Topic",pattern:"は",fa:"は موضوع جمله را مشخص می‌کند.",en:"は marks the topic of the sentence.",example:"私は学生です。",translation:"I am a student.",questionFa:"کدام جمله موضوع «من» را درست نشان می‌دهد؟",questionEn:"Which sentence correctly marks “I” as the topic?",options:["私を学生です。","私は学生です。","私に学生です。"],answer:"私は学生です。",explanationFa:"は بعد از 私 می‌آید تا «من» را به‌عنوان موضوع معرفی کند.",explanationEn:"は follows 私 to mark “I” as the topic."},
  {title:"Subject / focus",pattern:"が",fa:"が فاعل یا مورد مورد تأکید را مشخص می‌کند.",en:"が marks the subject or the item in focus.",example:"猫がいます。",translation:"There is a cat.",questionFa:"کدام جمله برای بیان وجود گربه درست است؟",questionEn:"Which sentence correctly says that there is a cat?",options:["猫をいます。","猫がいます。","猫でいます。"],answer:"猫がいます。",explanationFa:"در این الگو، が گربه را به‌عنوان فاعلِ وجود داشتن مشخص می‌کند.",explanationEn:"Here が marks 猫 as the subject of います."},
  {title:"Object",pattern:"を",fa:"を مفعول مستقیم فعل را مشخص می‌کند.",en:"を marks the direct object of a verb.",example:"水を飲みます。",translation:"I drink water.",questionFa:"کدام جمله «آب می‌نوشم» را درست می‌سازد؟",questionEn:"Which sentence correctly says “I drink water”?",options:["水は飲みます。","水を飲みます。","水に飲みます。"],answer:"水を飲みます。",explanationFa:"を بعد از 水 می‌آید چون آب مفعول مستقیم نوشیدن است.",explanationEn:"を marks 水 because it is the direct object of 飲みます."},
  {title:"Destination / time",pattern:"に",fa:"に برای مقصد، زمان مشخص یا گیرنده در الگوهای رایج استفاده می‌شود.",en:"に commonly marks a destination, specific time, or recipient.",example:"七時に起きます。",translation:"I wake up at seven.",questionFa:"کدام جمله زمان مشخص را درست نشان می‌دهد؟",questionEn:"Which sentence correctly marks a specific time?",options:["七時で起きます。","七時を起きます。","七時に起きます。"],answer:"七時に起きます。",explanationFa:"برای یک زمان مشخص مانند ساعت هفت، از に استفاده می‌کنیم.",explanationEn:"に marks a specific time such as seven o’clock."},
  {title:"Place of action",pattern:"で",fa:"で محل انجام یک عمل را مشخص می‌کند.",en:"で marks where an action takes place.",example:"図書館で勉強します。",translation:"I study at the library.",questionFa:"کدام جمله محل انجام مطالعه را درست نشان می‌دهد؟",questionEn:"Which sentence correctly marks the place of study?",options:["図書館で勉強します。","図書館に勉強します。","図書館を勉強します。"],answer:"図書館で勉強します。",explanationFa:"で محل انجام عمل 勉強します را مشخص می‌کند.",explanationEn:"で marks the place where 勉強します happens."},
  {title:"Possession / relation",pattern:"の",fa:"の برای مالکیت یا رابطهٔ دو اسم استفاده می‌شود.",en:"の links nouns to express possession or a relationship.",example:"これは私の本です。",translation:"This is my book.",questionFa:"کدام گزینه «کتاب من» را می‌سازد؟",questionEn:"Which option means “my book”?",options:["私を本","私に本","私の本"],answer:"私の本",explanationFa:"の بین 私 و 本 رابطهٔ مالکیت می‌سازد.",explanationEn:"の links 私 and 本 to express possession."},
  {title:"Demonstratives",pattern:"これ / それ / あれ",fa:"برای اشاره به اشیاء با فاصلهٔ متفاوت استفاده می‌شوند.",en:"These demonstratives point to things at different distances.",example:"これは何ですか。",translation:"What is this?",questionFa:"برای «این» کدام گزینه درست است؟",questionEn:"Which option means “this”?",options:["これ","それ","あれ"],answer:"これ",explanationFa:"これ به چیزی نزدیک گوینده اشاره می‌کند.",explanationEn:"これ refers to something near the speaker."},
  {title:"Place demonstratives",pattern:"ここ / そこ / あそこ",fa:"برای «اینجا / آنجا / آنجا دورتر» به‌کار می‌روند.",en:"These forms mean roughly here / there / over there.",example:"ここは病院です。",translation:"This place is a hospital.",questionFa:"برای «اینجا» کدام گزینه درست است؟",questionEn:"Which option means “here”?",options:["ここ","そこ","あそこ"],answer:"ここ",explanationFa:"ここ به مکانی نزدیک گوینده اشاره می‌کند.",explanationEn:"ここ refers to a place near the speaker."},
  {title:"Also / too",pattern:"も",fa:"も می‌تواند معنای «هم / نیز» بدهد و معمولاً جایگزین は یا が می‌شود.",en:"も can mean “also/too” and often replaces は or が.",example:"私も学生です。",translation:"I am a student too.",questionFa:"کدام جمله یعنی «من هم دانشجو هستم»؟",questionEn:"Which sentence means “I am a student too”?",options:["私も学生です。","私を学生です。","私で学生です。"],answer:"私も学生です。",explanationFa:"も بعد از 私 نشان می‌دهد که «من هم» در همان دسته قرار می‌گیرم.",explanationEn:"も after 私 adds the meaning “also/too.”"},
  {title:"From / until",pattern:"から / まで",fa:"から مبدأ و まで نقطهٔ پایان را نشان می‌دهد.",en:"から marks a starting point; まで marks an endpoint.",example:"九時から五時まで働きます。",translation:"I work from nine to five.",questionFa:"کدام جفت مبدأ و پایان را نشان می‌دهد؟",questionEn:"Which pair marks a starting point and an endpoint?",options:["から / まで","まで / から","に / を"],answer:"から / まで",explanationFa:"から برای شروع و まで برای پایان استفاده می‌شود.",explanationEn:"から marks the start; まで marks the endpoint."},
  {title:"Want to do",pattern:"～たいです",fa:"たい برای بیان خواستن انجام یک کار استفاده می‌شود و به ریشهٔ فعل متصل می‌شود.",en:"たい expresses the desire to do something and attaches to the verb stem.",example:"日本へ行きたいです。",translation:"I want to go to Japan.",questionFa:"کدام گزینه «می‌خواهم بروم» را درست می‌سازد؟",questionEn:"Which option correctly means “I want to go”?",options:["行きたいです","行くたいです","行ってたいです"],answer:"行きたいです",explanationFa:"たい به ریشهٔ فعل 行き می‌چسبد: 行きたいです.",explanationEn:"たい attaches to the verb stem 行き: 行きたいです."},
];

const GRAMMAR_PROGRESS_KEY="kanji5-grammar-progress";

function readGrammarProgress(){
 try{
  const raw=sessionStorage.getItem(GRAMMAR_PROGRESS_KEY);
  const parsed=raw?JSON.parse(raw):[];
  return Array.isArray(parsed)?parsed.filter((value):value is number=>Number.isInteger(value)&&value>=0&&value<LESSONS.length):[];
 }catch{return [];}
}

export function GrammarGuide({language}:{language:Language}){
 const [index,setIndex]=useState(0),[checked,setChecked]=useState(false),[selectedOption,setSelectedOption]=useState(""),[completed,setCompleted]=useState<number[]>(readGrammarProgress);
 const lesson=LESSONS[index], percent=Math.round(completed.length/LESSONS.length*100);
 const remaining=Math.max(0,LESSONS.length-completed.length);
 useEffect(()=>{try{sessionStorage.setItem(GRAMMAR_PROGRESS_KEY,JSON.stringify(completed));}catch{}},[completed]);
 const selectAnswer=(option:string)=>{setSelectedOption(option);setChecked(true);if(option===lesson.answer)setCompleted(p=>p.includes(index)?p:p.concat(index));};
 const retry=()=>{setChecked(false);setSelectedOption("");};
 const move=(delta:number)=>{setIndex(v=>Math.max(0,Math.min(LESSONS.length-1,v+delta)));retry();};
 return <section className="grammar-guide">
   <div className="grammar-guide-nav" role="tablist" aria-label={language==="fa"?"انتخاب درس گرامر":"Grammar lessons"}>
    {LESSONS.map((item,i)=><button key={item.pattern} type="button" role="tab" aria-selected={i===index} className={"grammar-chip "+(i===index?"active":"")} onClick={()=>{setIndex(i);setChecked(false);setSelectedOption("")}}>{item.pattern}</button>)}
   </div>
   <div className="grammar-progress"><div><span>{t("grammarProgress",language)} {formatNumber(percent,language)}%</span><strong>{formatNumber(remaining,language)} {language==="fa"?"درس باقی‌مانده":"lessons left"}</strong></div><div className="grammar-progress-track" aria-hidden="true"><span style={{width:percent+"%"}}/></div></div>
   <article className="grammar-lesson" aria-live="polite">
    <div className="grammar-lesson-top"><span>{formatNumber(index+1,language)} / {formatNumber(LESSONS.length,language)}</span><b lang="ja">{lesson.pattern}</b></div>
    <h3>{lesson.title}</h3><p>{language==="fa"?lesson.fa:lesson.en}</p>
    <div className="grammar-example" lang="ja"><strong>{lesson.example}</strong><span>{lesson.translation}</span></div>
    <div className="grammar-check"><span>{language==="fa"?lesson.questionFa:lesson.questionEn}</span>
     <div className="grammar-options">{lesson.options.map(option=><button key={option} className={"grammar-option "+(checked?(option===lesson.answer?"correct":option===selectedOption?"wrong":""):"")} type="button" disabled={checked} onClick={()=>selectAnswer(option)}>{option}</button>)}</div>
     {checked?<div className={"grammar-feedback "+(selectedOption===lesson.answer?"correct":"incorrect")} role="status"><strong>{selectedOption===lesson.answer?(language==="fa"?"درست":"Correct"):(language==="fa"?"نیاز به بازبینی دارد":"Not quite")}</strong><span>{lesson.answer}</span><small>{language==="fa"?lesson.explanationFa:lesson.explanationEn}</small><button className="button secondary grammar-retry" type="button" onClick={retry}>{language==="fa"?"تلاش دوباره":"Try again"}</button></div>:null}
    </div>
   </article>
   <div className="grammar-navigation"><button className="button secondary" type="button" disabled={index===0} onClick={()=>move(-1)}>{t("previousLesson",language)}</button><button className="button primary" type="button" disabled={!checked||selectedOption!==lesson.answer||index===LESSONS.length-1} onClick={()=>move(1)}>{t("nextLesson",language)}</button></div>
 </section>;
}