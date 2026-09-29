import { useMemo, useState } from "react";
import { formatNumber, t, type Language } from "./i18n";

type GrammarLesson = {
  title: string;
  pattern: string;
  fa: string;
  en: string;
  example: string;
  translation: string;
  question: string;
  options: string[];
  answer: string;
};

const LESSONS: GrammarLesson[] = [
  { title:"Copula", pattern:"です", fa:"برای بیان هویت یا توضیح سادهٔ مؤدبانه استفاده می‌شود.", en:"Use です for a polite identification or simple statement.", example:"これは本です。", translation:"This is a book.", question:"Which sentence means \"This is a book\"?", options:["これは本です。","これは本を。","これは本に。"], answer:"これは本です。" },
  { title:"Topic", pattern:"は", fa:"は موضوع جمله را مشخص می‌کند و معمولاً پس از اسم می‌آید.", en:"は marks the topic of the sentence and usually follows a noun.", example:"私は学生です。", translation:"I am a student.", question:"Which option correctly marks the topic of the sentence?", options:["私を学生です。","私は学生です。","私に学生です。"], answer:"私は学生です。" },
  { title:"Subject / focus", pattern:"が", fa:"が برای مشخص‌کردن فاعل یا چیزی که می‌خواهیم روی آن تمرکز کنیم کاربرد دارد.", en:"が marks the subject or the item being specifically focused on.", example:"猫がいます。", translation:"There is a cat.", question:"Which sentence is correct?", options:["猫をいます。","猫がいます。","猫でいます。"], answer:"猫がいます。" },
  { title:"Object", pattern:"を", fa:"を مفعول مستقیم فعل را مشخص می‌کند.", en:"を marks the direct object of a verb.", example:"水を飲みます。", translation:"I drink water.", question:"Which particle is appropriate for the object \"water\"?", options:["水は飲みます。","水を飲みます。","水に飲みます。"], answer:"水を飲みます。" },
  { title:"Destination / time", pattern:"に", fa:"に برای مقصد، زمان مشخص یا گیرنده در الگوهای رایج استفاده می‌شود.", en:"に commonly marks a destination, a specific time, or a recipient.", example:"七時に起きます。", translation:"I wake up at seven.", question:"Which sentence is correct for a specific time?", options:["七時で起きます。","七時を起きます。","七時に起きます。"], answer:"七時に起きます。" },
  { title:"Place of action", pattern:"で", fa:"で محل انجام یک عمل را مشخص می‌کند.", en:"で marks the place where an action takes place.", example:"図書館で勉強します。", translation:"I study at the library.", question:"Which particle correctly marks the place where \"study\" takes place?", options:["図書館で勉強します。","図書館に勉強します。","図書館を勉強します。"], answer:"図書館で勉強します。" },
  { title:"Possession / relation", pattern:"の", fa:"の برای مالکیت یا رابطهٔ دو اسم استفاده می‌شود.", en:"の links nouns to express possession or a relationship.", example:"これは私の本です。", translation:"This is my book.", question:"Which option expresses \"my book\"?", options:["私を本","私に本","私の本"], answer:"私の本" },
  { title:"Demonstratives", pattern:"これ / それ / あれ", fa:"این سه واژه برای اشاره به اشیاء با فاصلهٔ متفاوت استفاده می‌شوند.", en:"These demonstratives point to things at different distances from the speaker and listener.", example:"これは何ですか。", translation:"What is this?", question:"Which option means \"this\"?", options:["これ","それ","あれ"], answer:"これ" },
  { title:"Place demonstratives", pattern:"ここ / そこ / あそこ", fa:"برای «اینجا / آنجا / آنجا دورتر» به‌کار می‌روند.", en:"These forms mean roughly here / there / over there.", example:"ここは病院です。", translation:"This place is a hospital.", question:"Which option means \"here\"?", options:["ここ","そこ","あそこ"], answer:"ここ" },
  { title:"Also / too", pattern:"も", fa:"も می‌تواند معنای «هم / نیز» بدهد و معمولاً جایگزین は یا が می‌شود.", en:"も can mean “also/too” and often replaces は or が.", example:"私も学生です。", translation:"I am a student too.", question:"Which sentence means \"I am a student too\"?", options:["私も学生です。","私を学生です。","私で学生です。"], answer:"私も学生です。" },
  { title:"From / until", pattern:"から / まで", fa:"から مبدأ و まで نقطهٔ پایان را نشان می‌دهد.", en:"から marks a starting point; まで marks an endpoint.", example:"九時から五時まで働きます。", translation:"I work from nine to five.", question:"Which pair shows the starting point and endpoint?", options:["から / まで","まで / から","に / を"], answer:"から / まで" },
  { title:"Want to do", pattern:"～たいです", fa:"たい برای بیان خواستن انجام یک کار استفاده می‌شود و به ریشهٔ فعل متصل می‌شود.", en:"たい expresses the desire to do something and attaches to the verb stem.", example:"日本へ行きたいです。", translation:"I want to go to Japan.", question:"Which option correctly expresses \"I want to go\"?", options:["行きたいです","行くたいです","行ってたいです"], answer:"行きたいです" },
];

export function GrammarGuide({ language }: { language: Language }) {
  const [index, setIndex] = useState(0);
  const [checked, setChecked] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);

  const lesson = LESSONS[index];
  const percent = Math.round((completed.length / LESSONS.length) * 100);
  const remaining = useMemo(() => LESSONS.length - completed.length, [completed.length]);

  const selectAnswer = (option: string) => {
    setChecked(true);
    if (option === lesson.answer) {
      setCompleted(previous => previous.includes(index) ? previous : previous.concat(index));
    }
  };

  const move = (delta: number) => {
    setIndex(value => (value + delta + LESSONS.length) % LESSONS.length);
    setChecked(false);
  };

  return (
    <section className="grammar-guide" aria-labelledby="grammar-lesson-title">
      <div className="grammar-progress">
        <span>{t("grammarProgress", language)} {formatNumber(percent, language)}%</span>
        <strong>{formatNumber(remaining, language)}</strong>
      </div>
      <article className="grammar-lesson" aria-live="polite">
        <div className="grammar-lesson-top"><span>{formatNumber(index + 1, language)} / {formatNumber(LESSONS.length, language)}</span><b lang="ja">{lesson.pattern}</b></div>
        <h3 id="grammar-lesson-title">{lesson.title}</h3>
        <p>{language === "fa" ? lesson.fa : lesson.en}</p>
        <div className="grammar-example" lang="ja"><strong>{lesson.example}</strong><span>{lesson.translation}</span></div>
        <div className="grammar-check">
          <span>{lesson.question}</span>
          <div className="grammar-options">
            {lesson.options.map(option => (
              <button key={option} className={"grammar-option " + (checked ? (option === lesson.answer ? "correct" : "") : "")} type="button" disabled={checked} onClick={() => selectAnswer(option)}>{option}</button>
            ))}
          </div>
          {checked ? <p className="grammar-feedback">{lesson.answer}</p> : null}
        </div>
      </article>
      <div className="grammar-navigation">
        <button className="button secondary" type="button" onClick={() => move(-1)}>{t("previousLesson", language)}</button>
        <button className="button primary" type="button" onClick={() => move(1)}>{t("nextLesson", language)}</button>
      </div>
    </section>
  );
}
