export const PREPARED_MNEMONIC_VERSION = "2.6.0";

const BASE_CURATED_PREPARED_MNEMONICS = Object.freeze({
  "日": [{ fa: "یک خورشید مربعی؛ شکلش مثل پنجره‌ای رو به نور روز است.", en: "A square sun; its shape is a window filled with daylight.", source: "curated" }],
  "月": [{ fa: "هلال ماه را در ذهن بگیر؛ 月 مثل یک ماه باریک و کشیده است.", en: "Picture a crescent moon; 月 is a slim, curved moon shape.", source: "curated" }],
  "火": [{ fa: "دو شعلهٔ آتش را ببین که در 火 به طرف بالا می‌پرند.", en: "Picture two flames leaping upward in 火.", source: "curated" }],
  "水": [{ fa: "یک جریان آب را تصور کن که از مرکز 水 به دو طرف پخش می‌شود.", en: "Picture water flowing from the center and splitting outward in 水.", source: "curated" }],
  "木": [{ fa: "یک درخت با تنه و دو شاخه؛ 木 ساده‌ترین تصویر یک درخت است.", en: "A tree with a trunk and two branches; 木 looks like a simple tree.", source: "curated" }],
  "金": [{ fa: "گنجی از فلز و طلا را زیر یک سقف تصور کن؛ 金 یادآور طلاست.", en: "Picture metal and gold treasured together under a roof; 金 points to gold.", source: "curated" }],
  "土": [{ fa: "یک تپهٔ کوچک از خاک روی زمین؛ 土 مثل خاکی است که از زمین بالا آمده.", en: "A small mound of earth on the ground; 土 looks like soil rising from the earth.", source: "curated" }],
  "人": [{ fa: "دو خط مثل دو پا که یک انسان ایستاده را نشان می‌دهند.", en: "Two strokes like two legs forming a standing person.", source: "curated" }],
  "大": [{ fa: "آدمی را با دست‌های کاملاً باز تصور کن؛ 大 یعنی بزرگ و گسترده.", en: "Picture a person stretching both arms wide; 大 feels big and expansive.", source: "curated" }],
  "小": [{ fa: "یک چیز خیلی کوچک با دو ذرهٔ ریز کنارش؛ 小 را کوچک ببین.", en: "Picture something tiny with two little dots beside it; 小 feels small.", source: "curated" }],
  "中": [{ fa: "یک خط مستقیم که درست از وسط قاب می‌گذرد؛ 中 یعنی وسط.", en: "A straight line passing through the exact center; 中 means middle.", source: "curated" }],
  "上": [{ fa: "یک خط پایه و چیزی بالای آن؛ 上 یعنی بالا.", en: "A baseline with something above it; 上 means up or above.", source: "curated" }],
  "下": [{ fa: "یک خط بالا و چیزی آویزان زیر آن؛ 下 یعنی پایین.", en: "A top line with something hanging below it; 下 means down or below.", source: "curated" }],
  "左": [{ fa: "دستی که چیزی را نگه می‌دارد و به سمت چپ اشاره می‌کند؛ 左 را سمت چپ بگیر.", en: "A hand guiding you left; 左 is your left side.", source: "curated" }],
  "右": [{ fa: "دستی که به سمت راست راهنمایی می‌کند؛ 右 را سمت راست به خاطر بسپار.", en: "A hand guiding you right; 右 is your right side.", source: "curated" }],
  "山": [{ fa: "سه قلهٔ کوه کنار هم؛ 山 خودش شبیه رشته‌کوه است.", en: "Three mountain peaks together; 山 looks like a mountain range.", source: "curated" }],
  "川": [{ fa: "سه جریان آب که کنار هم پایین می‌روند؛ 川 مثل رودخانه‌های موازی است.", en: "Three streams flowing side by side; 川 looks like parallel river channels.", source: "curated" }],
  "田": [{ fa: "یک مزرعهٔ برنج که به چهار قسمت تقسیم شده؛ 田 مثل قطعه‌زمین شالیزار است.", en: "A rice field divided into four plots; 田 looks like a boxed field.", source: "curated" }],
  "口": [{ fa: "یک دهان باز به شکل مربع؛ 口 یعنی دهان.", en: "An open square mouth; 口 means mouth.", source: "curated" }],
  "目": [{ fa: "چشم را داخل یک قاب کشیده تصور کن؛ 目 شکل یک چشم است.", en: "Picture an eye inside a frame; 目 resembles an eye.", source: "curated" }],
  "耳": [{ fa: "لالهٔ گوش کشیده و جمع‌وجور؛ 耳 را مثل یک گوش ببین.", en: "A compact outline of an ear; 耳 can be pictured as an ear.", source: "curated" }],
  "手": [{ fa: "کف دست و انگشتانی که رو به پایین باز شده‌اند؛ 手 یادآور دست است.", en: "An open hand with fingers reaching down; 手 can be pictured as a hand.", source: "curated" }],
  "足": [{ fa: "پای راست و ساق را تصور کن؛ 足 را با راه رفتن و پا به هم وصل کن.", en: "Picture a leg and foot; connect 足 with walking and feet.", source: "curated" }],
  "力": [{ fa: "بازویی که نیرو وارد می‌کند؛ 力 را با قدرت عضلانی گره بزن.", en: "An arm exerting force; connect 力 with physical strength.", source: "curated" }],
  "女": [{ fa: "یک پیکرهٔ نشسته و متعادل؛ 女 را به یک زن آرام ربط بده.", en: "A balanced seated figure; connect 女 with a woman.", source: "curated" }],
  "男": [{ fa: "مردی که روی مزرعه کار می‌کند؛ 男 را به مرد و کار در مزرعه وصل کن.", en: "Picture a man working in a field; connect 男 with a man and farm work.", source: "curated" }],
  "子": [{ fa: "یک کودک با دست‌های باز؛ 子 را با کودک به خاطر بسپار.", en: "A child with arms reaching out; connect 子 with a child.", source: "curated" }],
  "学": [{ fa: "کودکی که زیر سقف در حال یادگیری است؛ 学 را به مطالعه وصل کن.", en: "A child learning under a roof; connect 学 with studying.", source: "curated" }],
  "生": [{ fa: "یک جوانه که از خاک بیرون می‌آید؛ 生 را با رشد و زندگی گره بزن.", en: "A sprout emerging from the earth; connect 生 with life and growth.", source: "curated" }],
  "先": [{ fa: "کسی جلوتر از بقیه راه می‌رود؛ 先 را با «اول/پیش‌تر» به خاطر بسپار.", en: "Someone walking ahead of the others; connect 先 with being ahead or first.", source: "curated" }],
  "年": [{ fa: "چرخهٔ کشاورزی که یک بار کامل می‌شود؛ 年 یعنی یک سال.", en: "Picture a full farming cycle; 年 is one year.", source: "curated" }],
  "今": [{ fa: "همین لحظه را بین دو طرف نگه داشته‌ای؛ 今 یعنی اکنون.", en: "Hold this exact moment in your mind; 今 means now.", source: "curated" }],
  "時": [{ fa: "خورشید در یک لحظهٔ مشخص؛ 時 را با زمان و ساعت گره بزن.", en: "Picture the sun marking a specific moment; 時 connects to time.", source: "curated" }],
  "前": [{ fa: "چیزی درست جلوی تو قرار دارد؛ 前 یعنی جلو/قبل.", en: "Something is directly in front of you; 前 means front or before.", source: "curated" }],
  "後": [{ fa: "چیزی که پشت سرت مانده؛ 後 یعنی عقب/بعد.", en: "Something left behind you; 後 means behind or after.", source: "curated" }],
  "東": [{ fa: "طلوع خورشید در سمت شرق؛ 東 را با طلوع گره بزن.", en: "The sun rising in the east; 東 connects east with sunrise.", source: "curated" }],
  "西": [{ fa: "غروب خورشید در غرب؛ 西 را با پایان روز به خاطر بسپار.", en: "The sun setting in the west; 西 connects west with the end of day.", source: "curated" }],
  "南": [{ fa: "به سمت گرم و آفتابی جنوب فکر کن؛ 南 یعنی جنوب.", en: "Think of the warm, sunny south; 南 means south.", source: "curated" }],
  "北": [{ fa: "باد سرد شمال را پشت سرت احساس کن؛ 北 یعنی شمال.", en: "Feel the cold northern wind behind you; 北 means north.", source: "curated" }]
});

const ENRICHED_PREPARED_MNEMONICS_1 = Object.freeze({
  "一": [{ fa: "یک خط صاف و تنها؛ فقط یک چیز روی صفحه مانده است.", en: "One straight stroke standing alone; there is only one thing on the page.", source: "curated" }],
  "国": [{ fa: "یک کشور را داخل مرز چهارگوش ببین که玉 مثل گنج آن داخلش نگهبانی می‌شود.", en: "Picture a country inside a square border, with 玉 like a treasure guarded inside it.", source: "curated" }],
  "会": [{ fa: "آدم‌ها دور هم جمع شده‌اند و برای یک دیدار قرار می‌گذارند؛ 人 و 云 یک صحنهٔ ملاقات می‌سازند.", en: "Picture people gathering to meet; 人 and 云 form one meeting scene.", source: "curated" }],
  "十": [{ fa: "یک تقاطع ساده و تمیز؛ دو خط همدیگر را قطع کرده‌اند.", en: "A clean cross where two strokes meet; anchor the shape to ten.", source: "curated" }],
  "二": [{ fa: "دو خط موازی؛ وقتی این جفت را می‌بینی، دو را ببین.", en: "Two parallel strokes; whenever you see the pair, think two.", source: "curated" }],
  "本": [{ fa: "یک درخت 木 که روی تنه‌اش یک علامت گذاشته‌اند؛ آن نشانه کتاب و اصل را یادت می‌آورد.", en: "A 木 tree with a mark at its base; that mark anchors book and origin.", source: "curated" }],
  "長": [{ fa: "چیزی بلند از پایین بالا کشیده شده و انتهایش خمیده است؛ یک کشیدگی طولانی تصور کن.", en: "Something stretches upward and ends in a curve; picture a long extension.", source: "curated" }],
  "出": [{ fa: "یک کوه از زمین بیرون زده و راهی از آن خارج می‌شود؛ 出 یعنی بیرون آمدن.", en: "A mountain rises out of the ground and a path comes out with it; 出 is exiting.", source: "curated" }],
  "三": [{ fa: "سه خط روی هم؛ سه‌تا را در یک نگاه بشمار.", en: "Three stacked strokes; count all three in one glance.", source: "curated" }],
  "同": [{ fa: "یک فضای بسته با دهانی در وسط؛ همه در یک قاب و در یک حال‌اند، یعنی همان.", en: "A shared box with a mouth inside; everyone is in the same frame, giving same.", source: "curated" }],
  "政": [{ fa: "正 را با ضربهٔ 攵 اجرا می‌کنند؛ یک مأمور حکومتی در حال اصلاح کردن است.", en: "Picture an official using 攵 to enforce 正; that government action anchors the scene.", source: "curated" }],
  "事": [{ fa: "یک موضوع پیچیده از چند خط درهم ساخته شده؛ آن را به یک «کار/مسئله» در مرکز گره بزن.", en: "Picture a matter built from several interlocking strokes, held in the center.", source: "curated" }],
  "自": [{ fa: "یک چشم 目 با نقطه‌ای جلویش؛ چشم به صاحب خودش برمی‌گردد، یعنی خود.", en: "A 目 eye with a small mark before it; the eye points back to its owner, the self.", source: "curated" }],
  "行": [{ fa: "دو مسیر کنار هم و یک قدم در میانشان؛ راه رفتن را در شکل ببین.", en: "Two paths with a step between them; see walking in the shape.", source: "curated" }],
  "社": [{ fa: "معبد 礻 روی خاک 土 ایستاده؛ یک سازمان روی زمین خودش مستقر شده است.", en: "Picture 礻 standing on 土 like an institution planted on its own ground.", source: "curated" }],
  "見": [{ fa: "یک چشم 目 که پاهای 儿 گرفته و به سمت چیزی می‌رود؛ دیدن یعنی نگاه کردن.", en: "Picture an eye 目 growing feet 儿 and walking toward what it wants to see.", source: "curated" }],
  "分": [{ fa: "یک چیز به دو بخش بریده می‌شود؛ 八 باز می‌شود و刀 جدا می‌کند.", en: "Picture 八 opening while 刀 cuts something into parts.", source: "curated" }],
  "議": [{ fa: "حرف‌های 言 و صحنهٔ 義 دور یک میز جمع شده‌اند و بحث می‌کنند.", en: "Put 言 and 義 around one table, debating carefully.", source: "curated" }],
  "民": [{ fa: "مردم در یک صف، با نشانه‌های巳 و氏 روی کارت‌هایشان؛ خودِ مردم را ببین.", en: "Picture people lined up with 巳 and 氏 as marks on their identity cards.", source: "curated" }],
  "連": [{ fa: "چند خودرو 車 روی یک راه 辶 پشت سر هم حرکت می‌کنند؛ همه به هم وصل‌اند.", en: "Picture several 車 moving along one 辶 path, linked one after another.", source: "curated" }],
  "五": [{ fa: "پنج را مثل عددی فشرده و دست‌ساز ببین که بین خطوط گیر کرده است.", en: "Picture five packed into a compact, handmade-looking shape.", source: "curated" }],
  "発": [{ fa: "کسی از جا می‌جهد و دست‌وپاهایش باز می‌شود؛ ناگهان راه می‌افتد و departure را می‌سازد.", en: "Picture someone springing up with limbs spread; suddenly they depart.", source: "curated" }],
  "間": [{ fa: "یک دروازه 門 که خورشید 日 در آن گیر کرده؛ یک روز در فاصلهٔ دو دروازه.", en: "A 門 gate with a bright 日 trapped inside; a day caught in an interval.", source: "curated" }],
  "対": [{ fa: "دو طرف با 文 و 寸 روبه‌روی هم ایستاده‌اند؛ تقابل مستقیم را ببین.", en: "Picture two sides facing each other through 文 and 寸; direct opposition.", source: "curated" }],
  "部": [{ fa: "یک ساختمان به بخش‌های 立 و口 و 阝 تقسیم شده؛ هر قسمت یک دپارتمان است.", en: "Picture a building divided into 立, 口, and 阝 sections, like departments.", source: "curated" }],
  "者": [{ fa: "یک پیرمرد 耂 کنار خورشید 日 ایستاده و به آن شخص اشاره می‌کند.", en: "Picture an old person 耂 standing in the sun 日 and pointing out that person.", source: "curated" }],
  "党": [{ fa: "اعضای یک گروه زیر سقف 宀 دور یک 兄 جمع شده‌اند؛ یک حزب شکل گرفته است.", en: "Picture a group gathering under 宀 around 兄, forming a faction.", source: "curated" }],
  "地": [{ fa: "یک نشانهٔ 也 روی خاک 土 افتاده؛ فقط به همان تکه‌زمین اشاره کن.", en: "Picture a mark 也 resting on 土; focus on that patch of ground.", source: "curated" }],
  "合": [{ fa: "یک آدم 人 همه چیز را در یک قاب کوچک جمع می‌کند تا با هم جور شوند.", en: "Picture 人 gathering things together until they fit and join.", source: "curated" }],
  "市": [{ fa: "بازار شهری با سقف亠 و پارچه‌های آویزان巾؛ شهر و بازار یک‌جا.", en: "Picture a city market with a roof 亠 and hanging cloth 巾.", source: "curated" }],
  "業": [{ fa: "یک کارگاه از چند میله و未 ساخته شده؛ همه‌چیز برای یک حرفه آماده است.", en: "Picture a workshop assembled from bars and 未, organized around a vocation.", source: "curated" }],
  "内": [{ fa: "یک آدم 人 داخل قاب 冂 رفته است؛ داخل بودن کاملاً جلوی چشم است.", en: "Picture 人 stepping inside the enclosing frame 冂.", source: "curated" }],
  "相": [{ fa: "یک درخت 木 روبه‌روی یک چشم 目 ایستاده؛ دو چیز همدیگر را می‌بینند.", en: "Picture 木 facing an eye 目; two things look at each other.", source: "curated" }],
  "方": [{ fa: "یک فلش زاویه‌دار که جهتی را نشان می‌دهد؛ هر طرف که اشاره کند، همان سمت است.", en: "Picture an angular arrow pointing somewhere; wherever it points is the direction.", source: "curated" }],
  "四": [{ fa: "عدد چهار در قاب 囗 نشسته و شکل 儿 در آن دیده می‌شود.", en: "Picture four sitting inside a 囗 frame with 儿 tucked within.", source: "curated" }],
  "定": [{ fa: "یک سقف 宀 روی پای ثابت 止؛ تصمیم یعنی انتخابی که سر جای خود قفل شده است.", en: "Picture 宀 over a firm 止; a decision is a choice fixed in place.", source: "curated" }],
  "回": [{ fa: "یک مربع داخل مربع؛ یک دور کامل را با چشم دنبال کن.", en: "A square inside a square; trace the complete round with your eyes.", source: "curated" }],
  "新": [{ fa: "یک چیز تازه کنار 立 و木 است و斤 آن را از قدیمی جدا می‌کند؛ نو را ببین.", en: "Picture something new beside 立 and 木, with 斤 cutting it free from the old.", source: "curated" }],
  "場": [{ fa: "یک جای مشخص روی 土 که 日 روشنش می‌کند و勿 مثل پرچم علامتش می‌زند.", en: "Picture a specific place on 土, lit by 日 and marked by 勿 like a flag.", source: "curated" }],
  "員": [{ fa: "یک دهان 口 و یک 貝 مثل مهره روی کارت عضویت؛ اینجا یک عضو یا کارمند است.", en: "Picture 口 and shell-like 貝 printed on an employee badge.", source: "curated" }],
  "九": [{ fa: "یک خط خمیده که یک قدم مانده به ده متوقف شده؛ نه تا را نگه دار.", en: "Picture a curved stroke stopping one step short of ten: nine.", source: "curated" }],
  "入": [{ fa: "دو خط مثل دری که به سمت داخل جمع می‌شوند؛ وارد شو.", en: "Two strokes narrow like a doorway funneling inward; step in.", source: "curated" }],
  "選": [{ fa: "چند گزینه روی راه 辶 حرکت می‌کنند و巳 و共 مثل انتخاب‌های صف هستند.", en: "Picture choices moving along 辶, with 巳 and 共 as the options in line.", source: "curated" }],
  "立": [{ fa: "یک پیکره کاملاً صاف روی زمین ایستاده؛ شکل خودش حالت ایستادن است.", en: "Picture a figure standing upright on solid ground; the shape itself is standing.", source: "curated" }],
  "開": [{ fa: "دو لنگهٔ 門 با廾 از هم کنار زده شده‌اند؛ دروازه کاملاً باز است.", en: "Picture the two leaves of 門 pushed apart by 廾; the gate is open.", source: "curated" }],
  "米": [{ fa: "یک دانهٔ برنج که چهار طرفش شاخه‌های ریز پخش شده؛ یک دانه که به برنج تبدیل می‌شود.", en: "Picture one rice grain with fine lines spreading in four directions.", source: "curated" }],
  "問": [{ fa: "یک دهان 口 پشت دروازه 門 سؤالش را بلند می‌پرسد؛ پرسیدن یعنی در را صدا زدن.", en: "Picture a mouth 口 behind a 門 calling out a question.", source: "curated" }],
  "高": [{ fa: "یک برج با سقف亠، پنجرهٔ口 و قاب پایین冂؛ چیزی که بالا رفته بلند است.", en: "Picture a tall tower with roof 亠, window 口, and lower frame 冂.", source: "curated" }],
  "代": [{ fa: "یک آدم 亻 چیزی را با弋 جایگزین می‌کند؛ نفر بعدی جای قبلی می‌آید.", en: "Picture a person 亻 using 弋 to swap one thing for another.", source: "curated" }],
  "明": [{ fa: "خورشید 日 و ماه 月 کنار هم آمده‌اند؛ با هر دو، صحنه روشن است.", en: "Put the sun 日 beside the moon 月; together they make the scene bright.", source: "curated" }],
  "実": [{ fa: "چیزی بزرگ زیر سقف宀 جا گرفته؛ حقیقت همان چیزی است که واقعاً داخل است.", en: "Picture something substantial under 宀; reality is what is truly there.", source: "curated" }],
  "円": [{ fa: "یک سکهٔ گرد داخل قاب؛ همان دایره را به ین وصل کن.", en: "Picture a round coin inside a frame; connect the circle with yen.", source: "curated" }],
  "関": [{ fa: "دروازهٔ 門 با چیزی شبیه قفل 天 بسته شده؛ یک مانع جلوی عبور است.", en: "Picture a 門 blocked by a 天-like bar; a barrier stops passage.", source: "curated" }],
  "決": [{ fa: "آب氵 با شکاف 夬 راهش را باز می‌کند؛ تصمیم یعنی باز کردن مسیر.", en: "Picture water 氵 breaking through a sharp gap 夬; deciding opens a path.", source: "curated" }],
  "動": [{ fa: "یک جسم سنگین 重 را نیروی力 هل می‌دهد تا حرکت کند.", en: "Picture heavy 重 being pushed by 力 until it moves.", source: "curated" }],
  "京": [{ fa: "یک برج کوچک پایتخت از亠 و口 و小 ساخته شده؛ مرکز شهر را تصور کن.", en: "Picture a compact capital tower made from 亠, 口, and 小.", source: "curated" }],
  "全": [{ fa: "یک آدم 人،王 را کامل در آغوش گرفته؛ هیچ بخشی بیرون نمانده است.", en: "Picture 人 holding 王 completely inside; nothing is left out.", source: "curated" }],
  "表": [{ fa: "یک لباس衣 روی سطحی مرتب شده؛ چیزی که روی آن دیده می‌شود، سطح و جدول است.", en: "Picture 衣 laid over a structured surface; what you see on top is the表.", source: "curated" }],
  "戦": [{ fa: "یک سرباز با 戈 و تجهیزات 单 وارد میدان می‌شود؛ صحنهٔ جنگ را ببین.", en: "Picture a soldier carrying 戈 and equipment into a battle field.", source: "curated" }],
  "経": [{ fa: "نخ糸 از خاک土 می‌گذرد و با又 حلقه می‌زند؛ یک مسیر طولانی ساخته می‌شود.", en: "Picture thread 糸 crossing 土 and looping with 又 into a long route.", source: "curated" }],
  "通": [{ fa: "کسی از راه辶 عبور می‌کند و از قاب用 رد می‌شود؛ مسیر باز است.", en: "Picture someone moving along 辶 and passing through 用; the route is open.", source: "curated" }],
  "外": [{ fa: "چیزی بیرون از مرز در غروب夕 قرار دارد و卜 آن را نشان می‌دهد.", en: "Picture something outside the boundary at 夕 dusk, pointed out by 卜.", source: "curated" }],
  "最": [{ fa: "خورشید 日 می‌تابد و دست 取 از بین همه، شدیدترین مورد را برمی‌دارد.", en: "Picture 日 shining while 取 grabs the most extreme item.", source: "curated" }],
  "言": [{ fa: "چند خط مثل حرفی که از دهان بیرون می‌آید؛ واژه را در دهان نگه دار.", en: "Picture structured strokes flowing out as spoken words.", source: "curated" }],
  "氏": [{ fa: "نام خانوادگی روی پلاکی با 弋 حک شده؛ اسم خاندان را ببین.", en: "Picture a family name carved on a plaque with 弋.", source: "curated" }],
  "現": [{ fa: "王 جلوی چشم 見 ظاهر می‌شود؛ چیزی که جلوی چشمت است، حاضر و واقعی است.", en: "Put 王 before 見; what appears before the eyes is present and real.", source: "curated" }],
  "理": [{ fa: "جواهر 王 در مسیر 里 مرتب می‌شود؛ منطق یعنی دیدن نظم داخل چیزها.", en: "Picture 王 being arranged along 里; logic is finding order within things.", source: "curated" }],
  "調": [{ fa: "حرف 言 کنار 周 نشسته و صدای آهنگ را تنظیم می‌کند؛ tune و tone را ببین.", en: "Put 言 beside 周 and imagine tuning a song to the right tone.", source: "curated" }],
  "体": [{ fa: "یک آدم 亻 کنار درخت 本؛ بدن مثل تنهٔ اصلی یک انسان است.", en: "Picture 亻 beside 本; the body is the main trunk of a person.", source: "curated" }],
  "化": [{ fa: "یک آدم 亻 جلوی 匕 ناگهان شکل عوض می‌کند؛ لحظهٔ تغییر را ثابت کن.", en: "Picture 亻 meeting 匕 and suddenly changing form.", source: "curated" }],
  "当": [{ fa: "وقتی علامت دقیقاً سر جای خودش می‌خورد، درست است؛ هدف و ضربه را هم‌راستا ببین.", en: "Picture a mark landing exactly where it should; that is right and appropriate.", source: "curated" }],
  "八": [{ fa: "دو خط از هم باز می‌شوند؛ این شکاف بازشونده را به هشت وصل کن.", en: "Two strokes open apart; anchor that spreading shape to eight.", source: "curated" }],
  "六": [{ fa: "یک سقف亠 بالای دو شاخهٔ八؛ شش را مثل یک خانهٔ کوچک با دو خروجی ببین.", en: "Picture a roof 亠 above a split 八, like a small house.", source: "curated" }],
  "約": [{ fa: "نخ糸 دور یک قلاب勺 گره خورده؛ وعده مثل گره‌ای است که نگهش می‌دارد.", en: "Picture thread 糸 tied around a 勺 hook; a promise is a knot.", source: "curated" }],
  "主": [{ fa: "یک قطره丶 روی王 نشسته و می‌گوید «این یکی رئیس است».", en: "Picture a dot sitting above 王 and declaring, this one is the master.", source: "curated" }],
  "題": [{ fa: "صفحهٔ سؤال با 是 و 頁؛ عنوان موضوع را بالای برگه تصور کن.", en: "Picture a question page with 是 and 頁; the title is the topic.", source: "curated" }],
  "首": [{ fa: "یک علامت بالا روی 自؛ سر و گردن در ابتدای بدن نشسته‌اند.", en: "Picture a top mark above 自; the head and neck lead the body.", source: "curated" }],
  "意": [{ fa: "صدا از 音 مستقیم به قلب心 می‌رود؛ یک ایده در دل می‌نشیند.", en: "Picture 音 dropping into the heart 心; an idea settles in the mind.", source: "curated" }],
  "法": [{ fa: "آب氵 چیزی را در مسیر 去 می‌برد؛ قانون مثل جریانی است که راه را تعیین می‌کند.", en: "Picture water 氵 channeling something through 去; law sets the path.", source: "curated" }],
  "不": [{ fa: "یک «نه» بزرگ جلوی مسیر ایستاده و راه را قطع می‌کند.", en: "Picture a big no blocking the path.", source: "curated" }],
  "来": [{ fa: "چیزی از 未 به سمت تو می‌آید؛ هنوز نرسیده اما در راه است.", en: "Picture something coming from 未 toward you; it is still on the way.", source: "curated" }],
  "作": [{ fa: "یک آدم亻 در حال ساختن است؛ حرکت 乍 را به کار و تولید وصل کن.", en: "Picture 亻 actively making something with 乍.", source: "curated" }],
  "性": [{ fa: "یک قلب忄 کنار 生 رشد می‌کند؛ طبیعت درونی یک موجود را ببین.", en: "Picture a heart 忄 growing beside 生; it is the inner nature of a living thing.", source: "curated" }],
  "的": [{ fa: "یک تیر سفید白 به هدف勺 خورده؛ mark و target را یکجا نگه دار.", en: "Picture a white 白 arrow hitting a 勺 target; mark and target fuse together.", source: "curated" }],
  "要": [{ fa: "یک زن女 زیر 西 چیزی را نگه داشته و می‌گوید «این لازم است».", en: "Picture 女 holding something under 西 and saying, this is needed.", source: "curated" }],
  "用": [{ fa: "یک ابزار داخل قاب شده و آمادهٔ کار است؛ شکلش را خودِ ابزار تصور کن.", en: "Picture a tool enclosed in a frame, ready to be used.", source: "curated" }],
  "制": [{ fa: "یک گاو牛 با پارچه巾 و تیغ刂 مهار شده؛ نظام یعنی کنترل دقیق.", en: "Picture 牛 controlled by 巾 while 刂 enforces the boundary; that is a system.", source: "curated" }],
  "治": [{ fa: "آب氵 کنار سکوی台 آرام می‌شود؛ حکومت خوب آبِ آشفته را آرام می‌کند.", en: "Picture turbulent water 氵 settling beside a platform 台; good rule brings peace.", source: "curated" }],
  "度": [{ fa: "زیر سقف广 چیزی را با廿 و又 اندازه می‌گیری؛ یک درجه و یک فاصله.", en: "Picture measuring under 广 with 廿 and 又; each pass marks an extent.", source: "curated" }],
  "務": [{ fa: "نیزه矛، قدم夂 و نیروی力 کنار هم‌اند؛ یک وظیفهٔ جدی روی دوش توست.", en: "Picture 矛, a marching foot 夂, and strength 力; a serious duty is on you.", source: "curated" }],
  "強": [{ fa: "یک کمان弓 محکم با虫 درونش کشیده شده؛ نیرو آن را نگه داشته است.", en: "Picture a taut 弓 holding 虫 inside; strength keeps it firm.", source: "curated" }],
  "気": [{ fa: "هوا气 از بدنت می‌گذرد و乂 آن را قطع و برمی‌گرداند؛ جریان روح و حال را حس کن.", en: "Picture air 气 flowing through you while 乂 redirects it; feel your spirit.", source: "curated" }],
  "七": [{ fa: "یک خط کوتاه که خم شده؛ هفت را مثل یک ضربهٔ سریع به یاد بیاور.", en: "Picture a short stroke bent sharply; anchor it to seven.", source: "curated" }],
  "成": [{ fa: "弋 کار را با 万 به پایان می‌رساند؛ کار کامل شد و «شد».", en: "Picture 弋 finishing the job marked by 万; the task is done.", source: "curated" }],
  "期": [{ fa: "ماه 月 کنار 其 مثل صفحهٔ تقویم است؛ دور یک بازهٔ مشخص خط بکش.", en: "Picture 月 beside 其 like a calendar card; circle a defined period.", source: "curated" }],
  "公": [{ fa: "八 و 厶 روبه‌روی هم قرار گرفته‌اند؛ چیزی از شخصی به عمومی باز می‌شود.", en: "Picture 八 and 厶 separating private from public space.", source: "curated" }],
  "持": [{ fa: "یک دست扌 محکم چیزی کنار寺 را نگه داشته؛ داشتن یعنی در دست نگه داشتن.", en: "Picture a hand 扌 firmly holding something by 寺; that is to hold.", source: "curated" }],
  "野": [{ fa: "چیزی از里 به سمت予 روی دشت باز کشیده شده؛ میدان باز را ببین.", en: "Picture something stretching from 里 toward 予 across an open plain.", source: "curated" }],
  "協": [{ fa: "ده十 با چند نیروی力 همکاری می‌کنند؛ چند نیرو برای یک هدف یکی شده‌اند.", en: "Picture 十 working with several 力; different strengths cooperate.", source: "curated" }],
  "取": [{ fa: "دستی耳 را می‌گیرد و又 آن را جدا می‌کند؛ چیزی را بردار.", en: "Picture a hand grabbing 耳 and pulling it away with 又.", source: "curated" }],
  "都": [{ fa: "یک منطقهٔ شهری با者 و阝؛ آدم‌ها دور مرکز شهر جمع‌اند.", en: "Picture a city district built from 者 and 阝, crowded around a center.", source: "curated" }],
  "和": [{ fa: "گیاه禾 کنار دهان口 است؛ غذای مشترک صلح و هماهنگی می‌آورد.", en: "Picture 禾 beside a mouth 口; sharing the meal creates harmony.", source: "curated" }],
  "統": [{ fa: "نخ糸 همه چیز را به充 می‌بندد؛ بخش‌های مختلف زیر یک ارتباط کلی می‌آیند.", en: "Picture 糸 tying parts together around 充 into one whole.", source: "curated" }],
  "以": [{ fa: "آدم 人 از میان خطوط عبور می‌کند و به نتیجه می‌رسد؛ آن را به «با این وسیله» وصل کن.", en: "Picture 人 passing through the strokes as a means to reach a result.", source: "curated" }],
  "機": [{ fa: "چوب木 به幾 مثل یک دستگاه پیچیده وصل شده؛ سازوکاری که حرکت را منتقل می‌کند.", en: "Picture 木 joined to 幾 like a machine whose mechanism transfers motion.", source: "curated" }],
  "平": [{ fa: "یک خط صاف روی干؛ همه‌چیز در یک سطح مساوی شده است.", en: "Picture a level line resting on 干; everything is even.", source: "curated" }],
  "総": [{ fa: "رشته‌های糸 با公 و心 یکجا جمع شده‌اند؛ همه را در یک نگاه کلی ببین.", en: "Picture threads 糸 gathered with 公 and 心; see the whole set at once.", source: "curated" }],
  "加": [{ fa: "نیروی力 چیزی را به دهان口 اضافه می‌کند؛ یک چیز به چیز دیگر افزوده می‌شود.", en: "Picture 力 adding something into 口; one thing joins another.", source: "curated" }]
});

const ENRICHED_PREPARED_MNEMONICS_2 = Object.freeze({
  "思": [{ fa: "یک مزرعهٔ 田 بالای قلب 心؛ فکر کردن یعنی نگه داشتن یک تصویر در دل.", en: "Picture 田 above 心; thinking means holding an image in the heart.", source: "curated" }],
  "家": [{ fa: "سقف宀 روی خوک豕؛ یک خانهٔ واقعی و زنده را تصور کن.", en: "Picture a roof 宀 over 豕; a real household comes to life.", source: "curated" }],
  "話": [{ fa: "حرف 言 روی زبان 舌 نشسته؛ گفت‌وگو را جریان حرف از زبان ببین.", en: "Picture 言 resting on 舌; conversation is speech flowing from the tongue.", source: "curated" }],
  "世": [{ fa: "نسل‌ها را مثل لایه‌های凵 و廿 روی هم ببین؛ یکی پس از دیگری می‌آیند.", en: "Picture generations as layers of 凵 and 廿, one after another.", source: "curated" }],
  "受": [{ fa: "دو دست爪 چیزی را زیر سقف冖 به دیگری می‌دهند؛ آن را بپذیر.", en: "Picture hands 爪 passing something under 冖; receive and accept it.", source: "curated" }],
  "区": [{ fa: "یک ناحیهٔ مشخص داخل جعبهٔ匚 با علامت乂 در گوشه؛ فقط همین بخش.", en: "Picture one defined area inside 匚, marked by 乂 in the corner.", source: "curated" }],
  "領": [{ fa: "令 چیزی را روی صفحهٔ頁 هدایت می‌کند؛ قلمرو زیر فرمان است.", en: "Picture 令 guiding what is on 頁; the territory is under command.", source: "curated" }],
  "多": [{ fa: "چند شکل夕 پشت سر هم؛ وقتی یکی کافی نیست، زیاد می‌شوند.", en: "Picture several 夕 in a row; when one is not enough, there are many.", source: "curated" }],
  "県": [{ fa: "یک چشم目 در قاب凵 با نقطهٔ کوچک小؛ نشانه‌ای اداری روی نقشه.", en: "Picture 目 in a 凵 frame with small 小; an administrative map marker.", source: "curated" }],
  "続": [{ fa: "نخ糸 به چیز داخل売 ادامه پیدا می‌کند؛ رشته قطع نمی‌شود.", en: "Picture 糸 continuing into 売; the thread does not break.", source: "curated" }],
  "進": [{ fa: "پرنده隹 روی راه辶 جلو می‌رود؛ هر قدم یعنی پیشروی.", en: "Picture 隹 moving along 辶; every step is advance.", source: "curated" }],
  "正": [{ fa: "پاهای止 دقیقاً زیر خط一 قرار دارند؛ همین هم‌راستایی یعنی درست.", en: "Picture 止 aligned exactly under 一; that alignment is correct.", source: "curated" }],
  "安": [{ fa: "زن女 زیر سقف宀 آرام نشسته؛ خانه حس امنیت می‌دهد.", en: "Picture 女 sitting calmly under 宀; the home feels safe.", source: "curated" }],
  "設": [{ fa: "حرف言 اعلام می‌کند و殳 چیزی را سر جای خود می‌گذارد؛ یک تأسیس شکل می‌گیرد.", en: "Picture 言 announcing while 殳 puts something in place; an establishment forms.", source: "curated" }],
  "保": [{ fa: "یک آدم亻 از呆 مثل کودک کوچکی مراقبت می‌کند؛ محافظت یعنی امن نگه داشتن.", en: "Picture 亻 protecting something small inside 呆; protection keeps it safe.", source: "curated" }],
  "改": [{ fa: "خودِ己 با ضربهٔ攵 اصلاح می‌شود؛ تغییر هدفمند یعنی اصلاح.", en: "Picture 己 being corrected by 攵; deliberate change is reform.", source: "curated" }],
  "数": [{ fa: "دانه‌های米 یکی‌یکی شمرده می‌شوند و攵 ضربه‌های شمارش را می‌زند.", en: "Picture grains 米 being counted one by one while 攵 keeps the tally.", source: "curated" }],
  "記": [{ fa: "言 و己 کنار یک دفتر؛ چیزی را می‌گویی تا ثبتش کنی.", en: "Picture 言 beside 己 on a notebook; you say it so it can be recorded.", source: "curated" }],
  "院": [{ fa: "یک مؤسسه پشت مرزهای阝 و حیاط کامل完؛ ساختمان رسمی را ببین.", en: "Picture a formal institution behind 阝 walls with a complete courtyard 完.", source: "curated" }],
  "初": [{ fa: "لباس衤 تازه از بسته جدا می‌شود و刀 اولین برش را می‌زند؛ شروع را ببین.", en: "Picture 衤 being opened with the first cut of 刀; that first cut is a beginning.", source: "curated" }],
  "午": [{ fa: "میلهٔ干 مثل خورشیدِ بالای سر در ظهر ایستاده؛ وسط روز را تصور کن.", en: "Picture 干 standing under the midday sun; anchor it to noon.", source: "curated" }],
  "指": [{ fa: "یک دست扌 یک انگشت را روی چیزی می‌گذارد و旨 می‌گوید «همین».", en: "Picture a hand 扌 pointing at one target while 旨 says, this one.", source: "curated" }],
  "権": [{ fa: "درخت木 زیر یک پرچم بلند و پرنده隹؛ کسی قدرت تصمیم‌گیری را بالا نگه داشته است.", en: "Picture 木 holding up a tall emblem with 隹; someone is exercising authority.", source: "curated" }],
  "心": [{ fa: "یک نقطهٔ قلب و ضربانش؛ قلب را مثل یک شکل جمع‌وجور ببین.", en: "Picture the compact pulse of a heart; the shape itself is the heart.", source: "curated" }],
  "界": [{ fa: "یک مزرعهٔ田 با آدم介 در مرزش؛ خطی که دو دنیا را جدا می‌کند.", en: "Picture 田 with 介 standing at its edge; a boundary separates two worlds.", source: "curated" }],
  "支": [{ fa: "یک شاخه 十 را با دست又 نگه داشته؛ چیزی را از زیر پشتیبانی می‌کند.", en: "Picture 十 held up by 又; the hand supports a branch.", source: "curated" }],
  "第": [{ fa: "شماره‌گذاری با竹 و弓 مثل یک فهرست چوبی؛ این مورد «شمارهٔ» چندم است.", en: "Picture a bamboo list made with 竹 and 弓; each marked item gets a number.", source: "curated" }],
  "産": [{ fa: "یک جوانهٔ 生 از زیر厂 و立 بیرون می‌آید؛ چیزی متولد و تولید می‌شود.", en: "Picture 生 emerging beneath 厂 and 立; something is born and produced.", source: "curated" }],
  "結": [{ fa: "نخ糸 دور یک گرهٔ吉 بسته می‌شود؛ دو سر را محکم گره بزن.", en: "Picture thread 糸 tied around 吉 like a knot; bind the two ends.", source: "curated" }],
  "百": [{ fa: "یک白 روشن زیر سقف خط一؛ صد را مثل عددی روشن و کامل ببین.", en: "Picture bright 白 under a top line 一; anchor it to one hundred.", source: "curated" }],
  "派": [{ fa: "آب氵 از شاخه‌های丿 و斤 به چند سمت پخش می‌شود؛ یک گروه جدا شکل می‌گیرد.", en: "Picture water 氵 splitting through branching strokes; a separate faction forms.", source: "curated" }],
  "点": [{ fa: "نقطهٔ占 زیر چهار شعله灬؛ یک نقطهٔ درخشان را روی صفحه بگذار.", en: "Picture 占 above four flames 灬, creating one glowing point.", source: "curated" }],
  "教": [{ fa: "کودکِ孝 را با ضربهٔ攵 راه می‌دهند؛ آموزش یعنی جهت دادن به یادگیری.", en: "Picture 孝 being guided by 攵; teaching directs learning.", source: "curated" }],
  "報": [{ fa: "خوش‌خبری از幸 با卩 و又 تحویل داده می‌شود؛ یک گزارش را به دست کسی برسان.", en: "Picture 幸 carried by 卩 and 又 and delivered as a report.", source: "curated" }],
  "済": [{ fa: "آب氵 از斉 عبور کرده و رودخانه را پشت سر گذاشته؛ کار به سرانجام رسیده است.", en: "Picture water 氵 passing cleanly through 斉; the task is settled.", source: "curated" }],
  "書": [{ fa: "قلم聿 روی خورشید日 می‌نویسد؛ چیزی را روی صفحه ثبت کن.", en: "Picture 聿 writing over 日; put the words down on the page.", source: "curated" }],
  "府": [{ fa: "ساختمان رسمی زیر广 و نشانهٔ付؛ یک ادارهٔ شهری را تصور کن.", en: "Picture a government office under 广 with 付 marking its business.", source: "curated" }],
  "活": [{ fa: "آب氵 به زبان舌 جان می‌دهد؛ زنده و پرجنب‌وجوش حرف بزن.", en: "Picture water 氵 bringing 舌 to life; the scene becomes lively.", source: "curated" }],
  "原": [{ fa: "زیر صخرهٔ厂، سفید白 و کوچک小 روی دشتی باز قرار دارند؛ اصل را از سرچشمه ببین.", en: "Picture 白 and 小 beneath 厂 on an open field; trace things back to the source.", source: "curated" }],
  "共": [{ fa: "چند دست کنار هم زیر廾؛ دو یا چند نفر چیزی را با هم نگه داشته‌اند.", en: "Picture several hands beneath 廾 holding something together.", source: "curated" }],
  "得": [{ fa: "یک قدم彳 به صبح旦 و مهر寸 می‌رسد؛ با رسیدن، چیزی به دست می‌آوری.", en: "Picture a step 彳 reaching a dawn marker 旦 and a seal 寸; you gain something.", source: "curated" }],
  "解": [{ fa: "شاخ角 با刀 و牛 جدا می‌شود؛ باز کردن گره یعنی unravel کردن.", en: "Picture 角 separated with 刀 from 牛; a knot is being unraveled.", source: "curated" }],
  "名": [{ fa: "ماه夕 بالای دهان口؛ شب که شد، اسم خودت را صدا می‌زنی.", en: "Picture 夕 over 口 at night; call out a person's name.", source: "curated" }],
  "交": [{ fa: "دو مسیر از هم رد می‌شوند و می‌آمیزند؛ آن برخورد را 交 ببین.", en: "Picture two paths crossing and mingling; that crossing is 交.", source: "curated" }],
  "資": [{ fa: "چیزی از次 به خزانهٔ貝 اضافه می‌شود؛ دارایی جمع می‌شود.", en: "Picture something from 次 flowing into a 貝 treasury; assets accumulate.", source: "curated" }],
  "予": [{ fa: "یک دست و جعبهٔ کوچک آماده است؛ چیزی را از قبل کنار گذاشته‌ای.", en: "Picture a small prepared package ready in advance; it is set aside beforehand.", source: "curated" }],
  "向": [{ fa: "دهانهٔ口 داخل قاب冂 رو به یک سمت است؛ به همان جهت نگاه کن.", en: "Picture 口 facing one direction inside 冂; look toward that side.", source: "curated" }],
  "際": [{ fa: "یک مرز阝 کنار祭 مثل مراسمی دقیق در کنار خط؛ یک موقعیت خاص را علامت بزن.", en: "Picture 阝 beside 祭 marking a precise occasion at the boundary.", source: "curated" }],
  "査": [{ fa: "درخت木 روی صفحهٔ且 را مثل ذره‌بین بگیر؛ دقیق بررسی کن.", en: "Picture 木 used like a magnifying tool over 且; investigate carefully.", source: "curated" }],
  "勝": [{ fa: "ماه月 و قدرت力 با چند خط در هم؛ چیزی را با زور از رقیب می‌بری.", en: "Picture 月, strong strokes, and 力 combining to beat a rival.", source: "curated" }],
  "面": [{ fa: "یک سطح囗 بزرگ با چند خط قاب‌بندی شده؛ تمام صورت را یکجا ببین.", en: "Picture a large framed surface 囗; see the whole face at once.", source: "curated" }],
  "委": [{ fa: "گیاه禾 به زن女 سپرده شده؛ مسئولیت را به کسی واگذار کن.", en: "Picture 禾 entrusted to 女; hand responsibility over to someone.", source: "curated" }],
  "告": [{ fa: "چیزی روی خاک土 جلوی دهان口 بلند اعلام می‌شود؛ خبر را بگو.", en: "Picture a message on 土 announced through 口; tell the news.", source: "curated" }],
  "軍": [{ fa: "چرخ車 زیر سقف冖 پنهان است؛ یک ارتش مثل کاروان خودروهای آماده است.", en: "Picture a 車 convoy under 冖; an army waits ready to move.", source: "curated" }],
  "文": [{ fa: "یک خط‌خطی زیبا زیر سقف亠؛ نوشته و ادبیات را مثل نقش روی کاغذ ببین.", en: "Picture elegant marks under 亠; writing becomes literature.", source: "curated" }],
  "反": [{ fa: "یک دست又 در جهت مخالف می‌پیچد و丿 برمی‌گردد؛ خلاف جهت را ببین.", en: "Picture 又 turning back against the flow; the idea is anti or opposite.", source: "curated" }],
  "元": [{ fa: "دو خط二 روی پاهای儿؛ یک پایهٔ نخستین که از آن شروع می‌کنی.", en: "Picture 二 resting above 儿 like an original base; start from the beginning.", source: "curated" }],
  "重": [{ fa: "هزار 千 سنگ روی مسیر里 افتاده؛ چیزی بسیار سنگین و مهم را تصور کن.", en: "Picture 千 stacked weight on 里; the object feels heavy and important.", source: "curated" }],
  "近": [{ fa: "با راه辶 به تبر斤 نزدیک می‌شوی؛ قدم بعدی نزدیک‌تر است.", en: "Picture walking on 辶 toward 斤; every step brings you near.", source: "curated" }],
  "千": [{ fa: "ده十 را زیاد کرده‌ای تا به هزار برسد؛ یک «ده» که بزرگ شده است.", en: "Picture 十 multiplied until it reaches a thousand.", source: "curated" }],
  "考": [{ fa: "یک پیرمرد耂 زیر کمان弓 خم شده و فکر می‌کند؛ جدی فکر و بررسی کن.", en: "Picture an old thinker 耂 under a bow 弓, considering carefully.", source: "curated" }],
  "判": [{ fa: "یک نیمهٔ半 را با تیغ刂 جدا می‌کنند تا حکم روشن شود.", en: "Picture 半 being split by 刂; a judgment separates the cases.", source: "curated" }],
  "認": [{ fa: "حرف言 با تیغ忍 تحمل می‌کند؛ بعد از تأمل می‌توانی آن را به رسمیت بشناسی.", en: "Picture 言 enduring 忍; after reflection, you acknowledge it.", source: "curated" }],
  "画": [{ fa: "یک تصویر در مزرعهٔ田 داخل قاب凵 کشیده شده؛ نقاشی و طرح را ببین.", en: "Picture a drawing of 田 inside a frame 凵; that is a picture.", source: "curated" }],
  "海": [{ fa: "آب氵 کنار مادر母؛ دریا را مثل مادری بزرگ و بی‌انتها تصور کن.", en: "Picture water 氵 beside 母 as a vast, life-giving sea.", source: "curated" }],
  "参": [{ fa: "سه پرتو彡 از کنار یک آدم بزرگ大 می‌تابد؛ سه‌تایی را در صحنه نگه دار.", en: "Picture three rays 彡 around 大; keep the three-part scene in mind.", source: "curated" }],
  "売": [{ fa: "یک کالای士 زیر سقف冖 و کودک儿؛ آن را برای فروش جلوی مشتری بگذار.", en: "Picture an item 士 under 冖 with 儿 beside it, displayed for sale.", source: "curated" }],
  "利": [{ fa: "دانهٔ禾 کنار تیغ刂؛ با بریدنِ درست از محصول سود می‌گیری.", en: "Picture 禾 beside 刂; careful cutting turns the harvest into profit.", source: "curated" }],
  "組": [{ fa: "نخ糸 دور پایهٔ且 پیچیده؛ رشته‌ها را به هم بباف.", en: "Picture 糸 wound around 且; threads are assembled into one.", source: "curated" }],
  "知": [{ fa: "یک تیر矢 کنار دهان口؛ آنچه می‌دانی آمادهٔ گفتن است.", en: "Picture an arrow 矢 beside a mouth 口; what you know can be said.", source: "curated" }],
  "案": [{ fa: "یک طرح زیر خانهٔ安 و روی درخت木؛ پیشنهاد را روی میز خانه بگذار.", en: "Picture a plan resting on 安 and 木; place the suggestion on the table.", source: "curated" }],
  "道": [{ fa: "یک سر首 روی راه辶؛ سرِ مسیر را پیدا کن و راه را دنبال کن.", en: "Picture a head 首 traveling along 辶; follow the road.", source: "curated" }],
  "信": [{ fa: "یک آدم亻 کنار حرف言؛ حرف انسان را باور کن و به آن اعتماد کن.", en: "Picture a person 亻 standing beside 言; trust the person's word.", source: "curated" }],
  "策": [{ fa: "چوب竹 بالای 木 و قاب冂؛ یک برنامه را روی تخته‌ای چوبی بنویس.", en: "Picture a plan drawn from bamboo 竹 and wood 木 inside a frame.", source: "curated" }],
  "集": [{ fa: "پرنده隹 روی درخت木 فرود می‌آید و همه دورش جمع می‌شوند.", en: "Picture 隹 landing on 木 while everyone gathers around.", source: "curated" }],
  "在": [{ fa: "یک آدم亻 کنار خاک土 و خط十؛ یک شخص در یک نقطهٔ مشخص وجود دارد.", en: "Picture 亻 standing on 土 beneath 十; a person exists at a specific place.", source: "curated" }],
  "件": [{ fa: "یک آدم亻 کنار گاو牛؛ این پرونده را مثل یک مورد مشخص ببین.", en: "Picture 亻 beside 牛; isolate one specific case or item.", source: "curated" }],
  "団": [{ fa: "یک اتاق囗 با مهر寸؛ یک گروه در یک حلقهٔ بسته کنار هم است.", en: "Picture a group enclosed by 囗 and marked by 寸.", source: "curated" }],
  "別": [{ fa: "دهان口 و قدرت力 با تیغ刂 جدا می‌شوند؛ دو چیز را از هم تفکیک کن.", en: "Picture 口 and 力 split apart by 刂; separate the two.", source: "curated" }],
  "物": [{ fa: "یک گاو牛 و شکل勿 جلوی تو؛ یک شیء قابل لمس را ببین.", en: "Picture 牛 beside 勿; imagine one tangible object.", source: "curated" }],
  "側": [{ fa: "یک آدم亻 کنار則 مثل خط‌کش ایستاده؛ سمت و کنار را مشخص می‌کند.", en: "Picture 亻 standing beside 則 like a measuring rule; mark the side.", source: "curated" }],
  "任": [{ fa: "یک آدم亻 بارِ 壬 را روی شانه گرفته؛ مسئولیت را بپذیر.", en: "Picture 亻 carrying 壬 on the shoulder; accept the responsibility.", source: "curated" }],
  "引": [{ fa: "یک کمان弓 با خط丨 کشیده می‌شود؛ چیزی را به سمت خودت بکش.", en: "Picture 弓 pulled by丨; tug something toward you.", source: "curated" }],
  "使": [{ fa: "یک آدم亻 با吏 مثل مأمور در حال انجام مأموریت؛ از او استفاده می‌کنند.", en: "Picture 亻 acting as an official 吏 on assignment; the person is put to use.", source: "curated" }],
  "求": [{ fa: "دستی در آب氺 چیزی را می‌جوید؛ با تلاش آن را طلب می‌کنی.", en: "Picture a hand searching in 氺; you actively seek what you want.", source: "curated" }],
  "所": [{ fa: "یک در戸 کنار تبر斤؛ روی یک نقطهٔ مشخص توقف کن.", en: "Picture a door 戸 beside an axe 斤; stop at one specific place.", source: "curated" }],
  "次": [{ fa: "یخ冫 کنار دهان 欠 که منتظر نوبت بعد است؛ «بعدی» را ببین.", en: "Picture cold 冫 beside 欠 waiting for the next turn.", source: "curated" }],
  "半": [{ fa: "یک تکه از چیزی را دو نیم کن؛ خط‌ها نشان می‌دهند که فقط نصف مانده است.", en: "Picture one object cut in two; only half remains.", source: "curated" }],
  "品": [{ fa: "سه دهان口 کنار هم مثل سه جعبهٔ کالا؛ چند جنس کنار هم چیده شده‌اند.", en: "Picture three 口 like boxes of goods lined up together.", source: "curated" }],
  "昨": [{ fa: "خورشید日 کنار乍؛ روزی که قبلاً گذشت، یعنی دیروز.", en: "Picture 日 beside 乍; the day that has already passed is yesterday.", source: "curated" }],
  "論": [{ fa: "حرف言 روی ورقه‌های冊 و آدم人؛ استدلال را صفحه‌به‌صفحه پیش ببر.", en: "Picture 言 on pages 冊 with a person 人; build an argument page by page.", source: "curated" }],
  "計": [{ fa: "حرف言 با十 خط‌کشیده شده؛ برنامه را با عددها حساب کن.", en: "Picture 言 beside 十; calculate and plan with counted lines.", source: "curated" }],
  "死": [{ fa: "یک استخوان歹 کنار匕 افتاده؛ صحنه را به پایان زندگی گره بزن.", en: "Picture 歹 beside 匕 lying still; connect the scene with death.", source: "curated" }],
  "官": [{ fa: "یک ساختمان宀 با درِ中 و دهان口؛ اداره را مثل یک دفتر رسمی ببین.", en: "Picture a formal office under 宀 with 中 and 口 inside.", source: "curated" }],
  "増": [{ fa: "خاک土 زیر曽 روی هم انباشته می‌شود؛ هر لایه بیشتر می‌کند.", en: "Picture layers of 土 piling up under 曽; each layer increases the amount.", source: "curated" }],
  "係": [{ fa: "یک آدم亻 رشتهٔ系 را نگه داشته؛ ارتباط بین دو چیز را نشان بده.", en: "Picture 亻 holding the thread 系; it links two things.", source: "curated" }],
  "感": [{ fa: "قلب心 بعد از یک صحنهٔ پرقدرت از戈 و口 تکان می‌خورد؛ احساس شکل می‌گیرد.", en: "Picture 心 reacting to a vivid scene of 戈 and 口; emotion appears.", source: "curated" }],
  "特": [{ fa: "یک گاو牛 کنار寺؛ این حیوان را از بقیه جدا کرده‌اند، پس ویژه است.", en: "Picture one 牛 beside 寺, singled out from the herd; it is special.", source: "curated" }],
  "情": [{ fa: "قلب忄 کنار سبز و زندهٔ青؛ احساساتت رنگ می‌گیرند.", en: "Picture a heart 忄 beside vivid 青; feelings take on color.", source: "curated" }],
  "投": [{ fa: "یک دست扌 نیزهٔ殳 را پرت می‌کند؛ چیزی را به دوردست پرتاب کن.", en: "Picture a hand 扌 throwing the weapon-like 殳 into the distance.", source: "curated" }],
  "示": [{ fa: "دو خط二 و یک نقطهٔ小 مثل تابلو؛ چیزی را جلوی دیگران نشان بده.", en: "Picture 二 and 小 like a display sign; show it to others.", source: "curated" }],
  "変": [{ fa: "یک شکل亦 با قدم夂 برمی‌گردد و عوض می‌شود؛ حالت قبلی دیگر نیست.", en: "Picture 亦 turning with a foot 夂; the previous state changes.", source: "curated" }],
  "打": [{ fa: "یک دست扌 به میخ 丁 ضربه می‌زند؛ صدای یک strike را بشنو.", en: "Picture a hand 扌 hitting a 丁 peg; hear the strike.", source: "curated" }],
  "基": [{ fa: "یک پایهٔ خاکی土 زیر 其؛ fundamentals را مثل پی ساختمان ببین.", en: "Picture 其 resting on a 土 foundation; fundamentals are the base.", source: "curated" }],
  "私": [{ fa: "خوشهٔ禾 کنار شکل厶 که فقط برای خودش است؛ چیز شخصی و خصوصی.", en: "Picture 禾 beside a small private 厶; something belongs to oneself.", source: "curated" }],
  "各": [{ fa: "یک قدم夂 به دهان口 می‌رسد؛ هرکس یا هرچیز جای خودش را دارد.", en: "Picture a foot 夂 reaching 口; each person or thing has its own place.", source: "curated" }],
  "始": [{ fa: "یک زن女 کنار سکوی台؛ شروع کار را با اولین ایستگاه ببین.", en: "Picture 女 beside 台 as the first station of a process; begin there.", source: "curated" }],
  "島": [{ fa: "یک کوه山 با پرچم سفید白؛ جزیره‌ای را وسط آب تصور کن.", en: "Picture a white-topped 山 standing alone like an island.", source: "curated" }],
  "直": [{ fa: "یک چشم目 زیر خط一 و ده十؛ نگاه مستقیم و راست‌بودن را یکی کن.", en: "Picture 目 aligned under 一 and 十; direct sight becomes straightness.", source: "curated" }],
  "両": [{ fa: "دو بخش داخل قاب冂 و دو قله山؛ هر دو طرف را یکجا ببین.", en: "Picture two mountain-like parts inside 冂; both sides together.", source: "curated" }],
  "朝": [{ fa: "خورشید و ماه کنار十 و早؛ لحظه‌ای که شب به صبح تبدیل می‌شود.", en: "Picture sun and moon around 十 and 早 as night turns into morning.", source: "curated" }],
  "革": [{ fa: "چرم را روی قاب廿 و中 و十 بکش؛ یک تکه پوست آمادهٔ کار.", en: "Picture leather stretched over 廿, 中, and 十; a worked hide.", source: "curated" }]
});

const ENRICHED_PREPARED_MNEMONICS_3 = Object.freeze({
  "国": [{ fa: "یک کشور را پشت دیوارهای یک مرز چهارگوش تصور کن؛ جواهرِ 玉 مثل گنج ملی درست در مرکز خزانه نگهداری می‌شود.", en: "Imagine a country behind square borders; a 玉 jewel is guarded in the center like national treasure.", source: "curated" }],
  "本": [{ fa: "یک درخت 木 داری که یک خط روی پایه‌اش زده‌اند؛ همان نشانه به تو می‌گوید «اینجا اصلِ درخت است»، و از همین «اصل» به کتاب و بنیاد برس.", en: "Picture a 木 tree with a mark at its base; the mark says “this is the tree's origin,” linking 本 to origin and the main source.", source: "curated" }],
  "長": [{ fa: "یک آدم فوق‌العاده دراز را تصور کن که به‌خاطر قدش رهبر صف شده؛ هرچه کشیده‌تر می‌شود، بیشتر جلوی بقیه دیده می‌شود.", en: "Picture an absurdly long person who ends up leading the line because everyone can see them; length becomes the leader cue.", source: "curated" }],
  "出": [{ fa: "کوه 山 از زمین بیرون زده و راهی هم از دلش بیرون می‌آید؛ هر دو حرکت در یک جهت‌اند: بیرون.", en: "A mountain 山 rises out of the ground and a path comes out with it; both movements point outward: exit.", source: "curated" }],
  "同": [{ fa: "همه وارد یک اتاق بسته می‌شوند و فقط یک دهان، یک رمز مشترک را تکرار می‌کند؛ هرکس همان رمز را می‌گوید، پس همه «همان» هستند.", en: "Everyone enters one enclosed room and one mouth repeats the same password; anyone saying it belongs to the same group.", source: "curated" }],
  "事": [{ fa: "این یکی را مثل یک پروندهٔ اداری شلوغ ببین: چند مرحله روی هم قرار گرفته تا یک «موضوع/کار» کامل شود؛ مهم خودِ ماجراست، نه هر خط جداگانه.", en: "Picture a busy case file with several steps stacked into one complete matter; remember the whole affair, not each stroke.", source: "curated" }],
  "行": [{ fa: "دو خیابان موازی را ببین و مسافری را تصور کن که قدم‌به‌قدم میانشان جلو می‌رود؛ خودِ صحنه یعنی رفتن.", en: "Picture two parallel streets with a traveler moving between them step by step; the whole scene is going.", source: "curated" }],
  "分": [{ fa: "یک تکهٔ کیک را با刀 به چند قسمت می‌بری و هر قسمت از هم باز می‌شود؛ جدا شدنِ بخش‌ها همان 分 است.", en: "Picture a cake being split by 刀 as the pieces separate; the separation itself is 分.", source: "curated" }],
  "発": [{ fa: "یک دونده روی خط شروع ناگهان می‌جهد و از جا کنده می‌شود؛ بدنش به جلو پخش می‌شود و حرکت شروع می‌شود.", en: "Picture a runner suddenly springing off the start line; the burst forward is the cue for departure.", source: "curated" }],
  "間": [{ fa: "یک دروازهٔ 門 را می‌بندی و تنها خورشید 日 داخل آن می‌ماند؛ نور در فضای خالیِ بین دو طرف گیر افتاده است.", en: "Close a 門 gate with only the sun 日 trapped inside; the light sits in the space between the sides.", source: "curated" }],
  "対": [{ fa: "دو حریف را رو‌به‌روی هم روی یک خط فرضی بگذار؛ هیچ‌کدام کنار نمی‌روند، چون صحنه کاملاً متقابل است.", en: "Place two opponents face-to-face on an invisible line; neither gives way because the scene is directly opposed.", source: "curated" }],
  "業": [{ fa: "یک کارگاه را تصور کن که قطعاتش روی هم چیده شده تا یک حرفهٔ واقعی راه بیفتد؛ هر بخش برای انجام یک کار مشخص سر جایش است.", en: "Picture a workshop assembled piece by piece until a real profession can run; every part is in place for work.", source: "curated" }],
  "内": [{ fa: "یک آدم را می‌بینی که کاملاً داخل قاب 冂 رفته و بیرون چیزی از او نمانده؛ خودِ صحنه یعنی «داخل».", en: "Picture a person completely inside the enclosing frame 冂, with nothing left outside; the scene is inside.", source: "curated" }],
  "相": [{ fa: "یک درخت木 روبه‌روی یک چشم目 ایستاده؛ چشم درخت را بررسی می‌کند و درخت هم در نگاه مقابل قرار دارد، پس رابطه دوطرفه است.", en: "Picture a 木 tree facing an eye 目; each stands in the other's view, creating a mutual relationship.", source: "curated" }],
  "回": [{ fa: "توپ کوچکی را داخل یک قاب می‌اندازی؛ یک دور می‌چرخد، به دیواره می‌رسد و دوباره برمی‌گردد. مربع داخل مربع را با همین رفت‌وبرگشت حفظ کن.", en: "Throw a small ball inside a frame; it loops around, hits the wall, and returns. Use that loop to remember the boxed shape.", source: "curated" }],
  "場": [{ fa: "یک میدان روی خاک土 است؛ خورشید日 آن را روشن می‌کند و勿 مثل علامت بزرگِ ورودی، دقیقاً می‌گوید «اینجا محل برگزاری است».", en: "Picture a field on 土 lit by 日, with 勿 like a large entrance sign saying “this is the place.”", source: "curated" }],
  "選": [{ fa: "چند گزینه جلوی تو روی یک مسیر辶 قرار دارند؛ یکی را انتخاب می‌کنی و بقیه را پشت سر می‌گذاری.", en: "Picture several choices lined up along 辶; you select one and leave the others behind.", source: "curated" }],
  "開": [{ fa: "دو لنگهٔ 門 را با هر دو دست باز می‌کنی؛ فشار دست‌ها باعث می‌شود فضای بسته ناگهان باز شود.", en: "Push the two leaves of 門 apart with both hands; the closed space suddenly opens.", source: "curated" }],
  "明": [{ fa: "خورشید 日 از یک طرف و ماه 月 از طرف دیگر آمده‌اند؛ وقتی هر دو روشنایی می‌دهند، شب و روز هر دو روشن‌اند.", en: "The sun 日 and moon 月 arrive together; with both sources of light present, the scene becomes bright.", source: "curated" }],
  "決": [{ fa: "آب氵 پشت یک شکاف تند夬 جمع شده و ناگهان راه خودش را باز می‌کند؛ یک تصمیم هم همین‌طور مسیر را قطعی می‌کند.", en: "Water 氵 piles behind a sharp break 夬 and suddenly opens its path; a decision likewise makes the route definite.", source: "curated" }],
  "動": [{ fa: "یک وزنهٔ سنگین 重 جلوی توست و با تمام نیروی力 هلش می‌دهی؛ وقتی بالاخره راه می‌افتد، 动 را به خاطر آور.", en: "A heavy 重 weight blocks you, and you push it with all your 力; when it finally starts moving, remember 動.", source: "curated" }],
  "全": [{ fa: "یک کلاه کوچک روی سر王 قرار گرفته؛ همهٔ پادشاه‌ها باید کلاه داشته باشند، پس هیچ‌کس از مجموعه بیرون نیست و همه هستند.", en: "Picture a small hat placed on 王; every king is included, so the whole set is all there.", source: "curated" }],
  "表": [{ fa: "یک لباس衣 را روی سطح میز می‌اندازی و روی همان سطح جدول می‌کشی؛ چیزی که دیده می‌شود، رویه و سطحِ بیرونی است.", en: "Lay 衣 over a tabletop and draw a chart on the visible surface; what you see is the outside or surface.", source: "curated" }],
  "通": [{ fa: "مسافری روی راه辶 جلو می‌رود و از یک گذرگاه用 رد می‌شود؛ چیزی جلوی مسیر نایستاده، پس عبور ممکن است.", en: "A traveler moves along 辶 and passes through a passage marked by 用; nothing blocks the route, so passage is possible.", source: "curated" }],
  "最": [{ fa: "خورشید 日 بالاست و دستی از میان گزینه‌ها یکی را برمی‌دارد؛ همان موردی است که از همه بیشتر یا شدیدتر است.", en: "The sun 日 is high while a hand 取 picks one item from all the options; that item is the most extreme.", source: "curated" }],
  "現": [{ fa: "王 روبه‌روی 見 ایستاده و چیزی را که در برابر چشمش ظاهر شده می‌بیند؛ آنچه اکنون دیده می‌شود، حاضر و واقعی است.", en: "王 stands before 見 and sees what has appeared in front of the eyes; what is visible now is present and real.", source: "curated" }],
  "理": [{ fa: "یک جواهر 王 را داخل محلهٔ里 مرتب می‌کنی؛ وقتی اجزای درهم‌ریخته را سر جای منطقی‌شان می‌گذاری، نظم و منطق پیدا می‌شود.", en: "Arrange 王 inside 里; when scattered pieces are put into their logical places, order and reason emerge.", source: "curated" }],
  "調": [{ fa: "حرف 言 را کنار 周 بگذار و تصور کن نوازنده‌ای با شنیدن هر نت، صدای ساز را دقیق‌تر تنظیم می‌کند؛ تا بالاخره tone درست شود.", en: "Put 言 beside 周 and picture a musician adjusting each note until the instrument reaches the right tone.", source: "curated" }],
  "要": [{ fa: "زیر 西 یک زن 女 چیزی را محکم نگه داشته و می‌گوید «همین یکی را لازم دارم»؛ از میان همه چیز، اصل مطلب را جدا کرده است.", en: "Under 西, 女 holds one thing tightly and says, “this is the one I need”; she has isolated the essential point.", source: "curated" }],
  "制": [{ fa: "یک گاو 牛 را با پارچهٔ巾 و تیغهٔ刂 در محدوده نگه داشته‌اند؛ مرزها دقیق‌اند و حرکتش کنترل شده است.", en: "Picture 牛 kept inside a strict boundary using 巾 and 刂; its movement is controlled by a system.", source: "curated" }],
  "成": [{ fa: "کارگر آخرین ضربهٔ ابزارش را می‌زند؛ کار با همان حرکت کامل می‌شود و دیگر چیزی برای اضافه کردن نمی‌ماند.", en: "Picture a worker making the final tool stroke; with that last motion, the job becomes complete.", source: "curated" }],
  "期": [{ fa: "ماه 月 مثل صفحهٔ تقویم کنار 其 قرار گرفته؛ یک بازه را دور می‌کشی و می‌گویی «این دورهٔ من است».", en: "Picture 月 beside 其 like a calendar page; circle a span and call it your period.", source: "curated" }],
  "協": [{ fa: "یک نفر به‌تنهایی نمی‌تواند کار را جلو ببرد؛ چند نیروی力 کنار هم فشار می‌آورند و کار وقتی پیش می‌رود که با هم همکاری کنند.", en: "One person cannot move the job alone; several 力 push together, and the work advances only through cooperation.", source: "curated" }],
  "都": [{ fa: "یک مرکز شهری با مردم در者 و مرز شهری阝 شکل گرفته؛ آدم‌ها از اطراف به این نقطه جمع می‌شوند و یک شهر بزرگ می‌سازند.", en: "Picture a city center built around 者 and a boundary marker 阝; people gather there into a metropolis.", source: "curated" }],
  "統": [{ fa: "رشتهٔ 糸 همهٔ قسمت‌ها را با یک گره به充 وصل می‌کند؛ پراکندگی تمام می‌شود و همه زیر یک ارتباط کلی قرار می‌گیرند.", en: "糸 ties the parts together around 充; scattered pieces become one unified whole.", source: "curated" }],
  "機": [{ fa: "چوب木 بدنهٔ یک دستگاه را می‌سازد و幾 مثل قلبِ پیچیدهٔ آن داخلش کار می‌کند؛ سازوکار پنهان دستگاه حرکت را منتقل می‌کند.", en: "Picture 木 forming a machine's frame while 幾 works as its intricate inner mechanism, transferring motion.", source: "curated" }],
  "総": [{ fa: "چند رشتهٔ糸 را با 公 و心 یکجا جمع کرده‌ای؛ دیگر به یک بخش نگاه نمی‌کنی، بلکه کل مجموعه را می‌بینی.", en: "Gather many 糸 with 公 and 心; instead of one part, you are looking at the whole set.", source: "curated" }],
  "受": [{ fa: "یک بسته را زیر سقف冖 با هر دو دست爪 از فردی می‌گیری؛ وقتی بسته در دستت قرار گرفت، آن را پذیرفته‌ای.", en: "Receive a package with both hands 爪 under a roof 冖; once it is in your hands, you have accepted it.", source: "curated" }],
  "続": [{ fa: "نخ糸 را آن‌قدر ادامه می‌دهی تا به چیزی که برای فروش آماده کرده‌ای 売 برسد؛ رشته هرگز قطع نمی‌شود.", en: "Keep extending 糸 until it reaches the item prepared for sale 売; the thread never stops.", source: "curated" }],
  "進": [{ fa: "پرنده隹 روی مسیر辶 جلو می‌رود و هر قدمش فاصلهٔ پشت سر را بیشتر می‌کند؛ همین پیشروی است.", en: "A 隹 moves along 辶, increasing the distance behind with every step; that is advance.", source: "curated" }],
  "改": [{ fa: "ویرایشگر به متن خودش برمی‌گردد و با ضربهٔ攵 آن را اصلاح می‌کند؛ تغییر یعنی بهتر کردن چیزی که قبلاً بوده.", en: "An editor returns to their own work 己 and corrects it with 攵; change means deliberately improving the old state.", source: "curated" }],
  "数": [{ fa: "دانه‌های米 را زن女 یکی‌یکی می‌شمارد و قدم‌های夂 زمان را نشان می‌دهند؛ در پایان می‌دانی چندتا مانده است.", en: "A woman 女 counts grains of rice 米 one by one while winter steps 夂 mark the time; at the end you know the number.", source: "curated" }],
  "記": [{ fa: "در دفترت با خودت حرف می‌زنی و بعد همان حرف‌ها را می‌نویسی؛ 言 کنار 己 یعنی چیزی که برای خودت ثبت می‌کنی.", en: "You talk to yourself and then write those words in your diary; 言 beside 己 becomes a record kept for yourself.", source: "curated" }],
  "結": [{ fa: "نخ 糸 را برای خوش‌یمنی دور یک گرهٔ吉 می‌پیچی و آن را محکم می‌کنی؛ دو سر دیگر از هم جدا نمی‌شوند.", en: "Tie a 糸 thread around a 吉 good-luck knot and pull it tight; the two ends stay bound together.", source: "curated" }],
  "交": [{ fa: "یک پدر父 را زیر یک درپوش亠 می‌بینی که مواد مختلف دورش با هم قاطی شده‌اند؛ چیزهای متفاوت در یک قاب با هم مخلوط می‌شوند.", en: "Picture 父 under a 亠 lid while different ingredients swirl around him; unlike things become mixed inside one space.", source: "curated" }],
  "資": [{ fa: "هر بار «مرحلهٔ بعد» 次 را پشت سر می‌گذاری، یک سکه در صندوق貝 می‌اندازی؛ کم‌کم دارایی جمع می‌شود.", en: "Every time you pass the next step 次, you drop another coin into a 貝 treasury; resources accumulate.", source: "curated" }],
  "所": [{ fa: "کنار در戸 تبر斤 آویزان است؛ اینجا کارگاهِ مشخص توست و ابزارش همیشه در همان محل می‌ماند.", en: "An axe 斤 hangs beside a door 戸; this is your fixed workshop, and its tool always stays in that place.", source: "curated" }],
  "査": [{ fa: "بازرس زیر درخت木 یک برگهٔ且 را خط‌به‌خط بررسی می‌کند؛ هیچ جزئیاتی از نظرش جا نمی‌ماند.", en: "An inspector under a 木 tree checks a 且-like checklist line by line; nothing escapes the investigation.", source: "curated" }],
  "計": [{ fa: "یک خط‌کش روی十 گذاشته‌ای و در همان حال اندازه را با 言 بلند می‌گویی؛ اندازه‌گیری بدون عدد و بیان نتیجه کامل نیست.", en: "Place a ruler over 十 and say the measurement aloud with 言; measuring is complete only when the result is stated.", source: "curated" }],
  "感": [{ fa: "صدای صحنه‌ای شدید از戈 و口 به قلب心 می‌رسد و قلب واکنش نشان می‌دهد؛ آن واکنش همان احساس است.", en: "A vivid scene of 戈 and 口 reaches the heart 心, and the heart reacts; that reaction is emotion.", source: "curated" }]
});

const ENRICHED_PREPARED_MNEMONICS_4 = Object.freeze({
  "問": [
    {
      "fa": "یک دروازهٔ 門 را بسته‌اند و از پشت آن دهانی 口 مدام سؤال می‌پرسد؛ صدای سؤال از پشت در بیرون می‌آید و خودِ صحنه را به «پرسیدن» قفل کن.",
      "en": "A 門 gate is shut while a mouth 口 keeps calling questions from behind it; the voice coming through the gate locks the scene to asking.",
      "source": "curated"
    }
  ],
  "作": [
    {
      "fa": "یک آدم 亻 جلوی میز ایستاده و قطعه‌ای را از شکل خامش به یک وسیله تبدیل می‌کند؛ دست‌هایش مدام شکل 乍 را حرکت می‌دهند تا چیزی ساخته شود.",
      "en": "A person 亻 stands at a workbench, turning a raw piece into a finished object; repeated movements make the object, so the scene is making.",
      "source": "curated"
    }
  ],
  "取": [
    {
      "fa": "یک دست را تصور کن که گوش 耳 را می‌گیرد و با یک حرکت آن را از قفسه برمی‌دارد؛ گرفتنِ چیزی همان لحظهٔ «برداشتن» است.",
      "en": "Picture a hand grabbing an ear-shaped 耳 object and pulling it off a shelf; that decisive grab is the moment of taking.",
      "source": "curated"
    }
  ],
  "京": [
    {
      "fa": "در مرکز شهر یک برجِ بلند می‌بینی: سقف 亠 بالاست، یک درگاه 口 در میانه و برجک کوچک 小 پایین آن. همهٔ خیابان‌ها به این مرکز می‌رسند؛ این پایتخت است.",
      "en": "Picture a tall central tower: a 亠 roof on top, a 口 gate in the middle, and a small 小 tower below. Every road leads here—the capital.",
      "source": "curated"
    }
  ],
  "氏": [
    {
      "fa": "یک خاندان جلوی عکاس صف کشیده و نام خانوادگی‌شان روی یک پلاک حک شده؛ آن نشانِ مخصوصِ خاندان است که همه را زیر یک نام جمع می‌کند.",
      "en": "Picture a whole family posing for a portrait while their surname is carved on one plaque; the mark gathers everyone under one family name.",
      "source": "curated"
    }
  ],
  "八": [
    {
      "fa": "دو دست را باز کن؛ هر دست چهار انگشت دارد و با هم هشت تا می‌شوند. بازشدنِ دو طرف به شکل 八 همان شکافتنِ هشت‌تایی را نگه می‌دارد.",
      "en": "Spread two hands: four fingers on each make eight. The two sides opening apart echo the split shape of 八.",
      "source": "curated"
    }
  ],
  "六": [
    {
      "fa": "شش نفر را زیر یک سقف کوچک 亠 جا بده؛ دو نفر از هر طرفِ 八 بیرون آمده‌اند و همه با هم در همان خانه‌اند—شش.",
      "en": "Squeeze six people under a small 亠 roof, with two sides opening like 八; count the six inside the little shelter.",
      "source": "curated"
    }
  ],
  "用": [
    {
      "fa": "یک کارگر ابزار را از داخل قابش بیرون می‌کشد و همان لحظه شروع به کار می‌کند؛ خودِ به‌کارگرفتنِ ابزار را ببین، نه فقط شکل آن را.",
      "en": "A worker pulls a tool from its frame and immediately starts the job; see the tool being used, not merely the tool itself.",
      "source": "curated"
    }
  ],
  "公": [
    {
      "fa": "یک کیسهٔ خصوصی 厶 را در میدان باز می‌کنی و محتویاتش را جلوی همه می‌گذاری؛ چیزی که از حریم شخصی بیرون آمده و برای همه آشکار شده، عمومی است.",
      "en": "Open a private pouch 厶 in a public square and pour its contents out for everyone to see; what leaves private space becomes public.",
      "source": "curated"
    }
  ],
  "持": [
    {
      "fa": "یک دست 扌 محکم دستهٔ یک زنگ را کنار معبد 寺 گرفته و حاضر نیست رهایش کند؛ تا وقتی دست آن را نگه داشته، چیزی «در دست» توست.",
      "en": "A hand 扌 grips the handle of a temple 寺 bell and refuses to let go; while the hand keeps it, you hold it.",
      "source": "curated"
    }
  ],
  "平": [
    {
      "fa": "نجار یک تیرِ干 را روی سطح گذاشته و با یک حرکت آن را کاملاً تراز می‌کند؛ هر دو سر دقیقاً هم‌سطح می‌شوند و هیچ طرفی بالاتر نیست.",
      "en": "A carpenter levels a 干 beam until both ends sit at exactly the same height; neither side is higher, so the surface is flat and even.",
      "source": "curated"
    }
  ],
  "思": [
    {
      "fa": "یک مزرعهٔ 田 را وسط قلب 心 فشار می‌دهی تا تصویرش همان‌جا بماند؛ چیزی را در دل نگه می‌داری و درباره‌اش فکر می‌کنی.",
      "en": "Press a 田 field into the heart 心 so its image stays there; holding that scene in your heart is thinking.",
      "source": "curated"
    }
  ],
  "安": [
    {
      "fa": "بیرون خانه طوفان می‌وزد، اما یک زن 女 زیر سقف 宀 آرام نشسته و لبخند می‌زند؛ همین پناهِ آرام، حس امنیت و آسودگی را می‌سازد.",
      "en": "A storm rages outside, but a woman 女 sits calmly under a 宀 roof and smiles; the sheltered calm creates safety and ease.",
      "source": "curated"
    }
  ],
  "保": [
    {
      "fa": "یک آدم 亻 جلوی یک کودکِ呆 ایستاده و با دست جلوی ضربه را می‌گیرد؛ تا وقتی او سپر شده، کودک امن می‌ماند. این «محافظت» است.",
      "en": "A person 亻 steps in front of a small 呆 child and blocks an incoming blow; while the person shields it, the child stays safe. That is protection.",
      "source": "curated"
    }
  ],
  "支": [
    {
      "fa": "یک دست 又 زیر شاخه‌ای سنگین می‌رود و نمی‌گذارد بیفتد؛ تا وقتی دست آن را نگه داشته، وزن از پایین پشتیبانی می‌شود.",
      "en": "A hand 又 slides under a heavy branch and stops it from falling; the hand supports it from below.",
      "source": "curated"
    }
  ],
  "教": [
    {
      "fa": "معلمی کنار کودک 孝 ایستاده و با 攵 مسیر حل مسئله را نشان می‌دهد؛ کودک مسیر را یاد می‌گیرد و جلو می‌رود. این آموزش است.",
      "en": "A teacher stands beside a 孝 student and uses 攵 to guide the solution; the student follows and learns. That is teaching.",
      "source": "curated"
    }
  ],
  "解": [
    {
      "fa": "یک گره دور شاخ‌های 牛 پیچیده و تیغهٔ 刀 آن را می‌بُرد؛ رشته‌ها از هم باز می‌شوند تا گره کاملاً حل شود. همین «بازکردنِ گره» را حفظ کن.",
      "en": "A knot is wrapped around a 牛 horn and a 刀 blade cuts it apart; the strands come loose until the knot is fully unraveled.",
      "source": "curated"
    }
  ],
  "道": [
    {
      "fa": "یک سر 首 روی یک مسیر 辶 راه می‌افتد و قدم‌به‌قدم جلو می‌رود؛ وقتی سرِ مسافر مسیر را پیدا کند، راه همان‌جا شکل می‌گیرد.",
      "en": "A head 首 sets off along a 辶 path and moves step by step; once the traveler follows it, the road itself becomes the guide.",
      "source": "curated"
    }
  ],
  "別": [
    {
      "fa": "دو چیز، یکی شبیه 口 و دیگری شبیه 力، کنار هم گیر افتاده‌اند؛ تیغهٔ 刂 میانشان پایین می‌آید و آن‌ها را از هم جدا می‌کند.",
      "en": "Two things resembling 口 and 力 are stuck together; a 刂 blade drops between them and forces them apart.",
      "source": "curated"
    }
  ],
  "物": [
    {
      "fa": "یک گاو 牛 یک شیء عجیب را می‌کشد و تو می‌پرسی «این چیست؟»؛ هر چیز قابل اشاره‌ای که جلوی توست، یک «شیء» است.",
      "en": "A 牛 cow drags a strange object past you and you point: “What is that?” Anything you can point to is a thing.",
      "source": "curated"
    }
  ],
  "引": [
    {
      "fa": "یک کمان 弓 را می‌بینی که با خط 丨 به سمت خودت کشیده می‌شود؛ هرچه بیشتر می‌کشی، کمان بیشتر خم می‌شود.",
      "en": "Picture an 弓 bow being pulled toward you along 丨; the farther you pull, the more the bow bends.",
      "source": "curated"
    }
  ],
  "品": [
    {
      "fa": "سه جعبهٔ 口 را کنار هم در یک مغازه بچین؛ هر جعبه یک جنس دارد و مجموع ویترین پر از «کالا» شده است.",
      "en": "Line up three 口 boxes in a shop; each box contains a different item, and the whole display is a collection of goods.",
      "source": "curated"
    }
  ],
  "官": [
    {
      "fa": "یک ساختمان رسمی زیر سقف 宀 را تصور کن؛ داخلش اتاق‌های 中 و 口 پشت درهای اداری پر از پرونده‌اند و یک مقام دولتی آنجاست.",
      "en": "Picture a formal office under a 宀 roof; inside, 中 and 口 mark rooms filled with files where a government official works.",
      "source": "curated"
    }
  ],
  "係": [
    {
      "fa": "یک آدم 亻 مسئول دو سرِ یک نخ 系 است؛ نخ را بین دو طرف کشیده و نمی‌گذارد اتصال قطع شود. او همان فردِ مسئولِ ارتباط است.",
      "en": "A person 亻 is responsible for both ends of a 系 thread, keeping the line stretched between two sides so the connection cannot break.",
      "source": "curated"
    }
  ],
  "打": [
    {
      "fa": "یک دست 扌 میخ 丁 را با چکش می‌زند؛ صدای ضربه می‌آید و میخ هر بار عمیق‌تر فرو می‌رود. همان حرکت «زدن» را بازیابی کن.",
      "en": "A hand 扌 hammers a 丁 peg; each strike drives it deeper and the impact rings out. That repeated hit is 打.",
      "source": "curated"
    }
  ],
  "十": [
    {
      "fa": "ساعت دقیقاً ده را نشان می‌دهد و دو خیابان مثل یک علامت + در تقاطع به هم می‌رسند؛ عددِ ده و شکلِ تقاطع را یک صحنه کن.",
      "en": "A clock hits exactly ten as two streets meet in a clean cross; fuse the number ten with the crossing shape of 十.",
      "source": "curated"
    }
  ],
  "見": [
    {
      "fa": "یک چشم 目 ناگهان پاهای 儿 درمی‌آورد و جلو می‌دود تا از نزدیک چیزی را ببیند؛ چشم دیگر نمی‌ماند، خودش می‌رود سراغ دیدن.",
      "en": "An eye 目 suddenly grows 儿 legs and runs toward an object for a closer look; the eye itself goes to see.",
      "source": "curated"
    }
  ],
  "内": [
    {
      "fa": "یک آدم وارد قاب 冂 می‌شود، در را پشت سرش می‌بندی و بیرون هیچ بخشی از او نمی‌ماند؛ او کاملاً «داخل» است.",
      "en": "A person walks inside the enclosing frame 冂; you close the door and nothing remains outside. The person is fully inside.",
      "source": "curated"
    }
  ],
  "定": [
    {
      "fa": "زیر سقف 宀 یک پا 止 ناگهان می‌ایستد و دیگر تکان نمی‌خورد؛ انتخابی که متوقف و ثابت شده، «تصمیم قطعی» است.",
      "en": "Under a 宀 roof, a foot 止 suddenly stops and refuses to move; a choice that is fixed in place is determined.",
      "source": "curated"
    }
  ],
  "円": [
    {
      "fa": "یک سکهٔ گرد روی میز می‌چرخد و هر بار دوباره به همان نقطهٔ اطراف برمی‌گردد؛ شکلِ کاملِ دایره را با ارزش پولِ ین جفت کن.",
      "en": "A round coin spins on the table and keeps returning around the same loop; pair the complete circle with a yen coin.",
      "source": "curated"
    }
  ],
  "意": [
    {
      "fa": "صدای 音 از بالا پایین می‌آید و مستقیم در قلب 心 فرود می‌رود؛ وقتی صدا در ذهن می‌نشیند، یک ایده شکل می‌گیرد.",
      "en": "The sound 音 drops straight into the heart 心; when the sound settles in your mind, an idea takes shape.",
      "source": "curated"
    }
  ],
  "不": [
    {
      "fa": "یک تابلوی بزرگ «نه» وسط پل ایستاده و راه را می‌بندد؛ هرچه می‌خواهی رد شوی، همان «نه» جلویت را می‌گیرد.",
      "en": "A huge NO sign stands in the middle of a bridge and blocks the road; every attempt to pass meets the same negative answer.",
      "source": "curated"
    }
  ],
  "以": [
    {
      "fa": "مسافری می‌خواهد به آن طرف برسد اما فقط با یک ابزار می‌تواند از مانع عبور کند؛ ابزار در دستش همان «وسیله‌ای است که با آن» کار را انجام می‌دهد.",
      "en": "A traveler needs to cross a barrier and can do it only by using one tool; that tool is the means by which the goal is reached.",
      "source": "curated"
    }
  ],
  "正": [
    {
      "fa": "داور یک پا 止 را دقیقاً زیر خط 一 هم‌راستا می‌کند و مهر «درست» می‌زند؛ چیزی که درست سر جای خودش قرار گرفته، صحیح است.",
      "en": "A judge aligns the 止 foot exactly beneath the 一 line and stamps “correct”; what is perfectly aligned is right.",
      "source": "curated"
    }
  ],
  "改": [
    {
      "fa": "یک ویرایشگر به نوشتهٔ قدیمیِ خودش 己 برمی‌گردد و با 攵 بخش‌های مشکل را عوض می‌کند؛ متن بعد از دست‌کاری، دیگر همان قبلی نیست.",
      "en": "An editor returns to their old draft 己 and uses 攵 to change the faulty parts; after the edit, the draft is no longer the same.",
      "source": "curated"
    }
  ],
  "名": [
    {
      "fa": "شب شده و ماه 夕 بالای دهان 口 است؛ کسی از پنجره اسم تو را صدا می‌زند تا بفهمد چه کسی آنجاست. اسم، چیزی است که با دهان گفته می‌شود.",
      "en": "Night falls with 夕 above a 口 mouth; someone calls your name through the window to find out who is there. A name is spoken.",
      "source": "curated"
    }
  ],
  "海": [
    {
      "fa": "آب 氵 آن‌قدر گسترده شده که مادر 母 روی ساحل ایستاده و دیگر انتهایش را نمی‌بیند؛ موج‌ها همه‌جا را گرفته‌اند. این دریاست.",
      "en": "Water 氵 stretches so far that a mother 母 on the shore cannot see the far edge; waves fill the horizon. That is the sea.",
      "source": "curated"
    }
  ],
  "集": [
    {
      "fa": "یک پرندهٔ 隹 روی درخت 木 می‌نشیند و چند پرندهٔ دیگر از اطراف می‌آیند تا دور همان نقطه جمع شوند؛ همه در یک‌جا جمع شده‌اند.",
      "en": "A 隹 bird lands on a 木 tree, and other birds fly in until they cluster around the same spot; everyone has gathered.",
      "source": "curated"
    }
  ],
  "件": [
    {
      "fa": "یک کارمند 亻 پرونده‌ای دربارهٔ یک گاو 牛 را روی میز می‌گذارد و می‌گوید «فقط همین مورد را بررسی کنیم»؛ یک مورد مشخص، یک case است.",
      "en": "A clerk 亻 puts one 牛-related file on the desk and says, “Let us examine just this case”; one specific matter is the item at hand.",
      "source": "curated"
    }
  ],
  "団": [
    {
      "fa": "اعضای یک گروه داخل قاب 囗 دور هم فشرده شده‌اند و یک نشان 寸 وسط حلقه قرار دارد؛ مرز بسته، آدم‌ها را به یک گروه تبدیل می‌کند.",
      "en": "Members squeeze together inside the 囗 frame, with the 寸 mark at the center; the closed boundary turns them into one group.",
      "source": "curated"
    }
  ],
  "次": [
    {
      "fa": "جلوی گیشه صف کشیده‌ای؛ نفر اول جلو می‌رود و تو هنوز پشت خط منتظر نوبت بعدی می‌مانی. همین انتظار، 次 را قفل می‌کند.",
      "en": "You stand in a ticket line; the first person moves forward while you wait for the next turn. That waiting scene anchors 次.",
      "source": "curated"
    }
  ],
  "半": [
    {
      "fa": "یک سیب را دقیقاً از وسط می‌بری؛ دو نیمه روی میز می‌افتند و تو فقط یکی را برمی‌داری. چیزی که کامل نیست، نصف است.",
      "en": "Cut an apple exactly down the middle; two halves fall onto the table and you pick up just one. What remains is half.",
      "source": "curated"
    }
  ],
  "死": [
    {
      "fa": "یک پیکر بی‌حرکت کنار استخوان‌های 歹 افتاده و تیغ 匕 از دستش روی زمین مانده؛ هیچ حرکتی برنمی‌گردد و صحنه کاملاً ساکت است.",
      "en": "A motionless body lies beside the 歹 remains while a 匕 blade has fallen from its hand; nothing moves again and the scene is completely still.",
      "source": "curated"
    }
  ],
  "議": [
    {
      "fa": "چند نفر دور یک میز نشسته‌اند؛ یکی با 言 حرف می‌زند و بقیه روی یک مسئلهٔ مشترک 義 بحث می‌کنند تا به نظر مشترک برسند.",
      "en": "Several people sit around one table; one speaks with 言 while the others debate a shared issue through 義 until they can reach a view.",
      "source": "curated"
    }
  ],
  "連": [
    {
      "fa": "چند وسیلهٔ 車 پشت سر هم روی یک مسیر 辶 حرکت می‌کنند و هر کدام به قبلی وصل است؛ تا آخر مسیر، همه با هم پیش می‌روند.",
      "en": "Several 車 vehicles move one after another along a 辶 path, each linked to the one before it; they travel together to the end.",
      "source": "curated"
    }
  ],
  "部": [
    {
      "fa": "یک ساختمان بزرگ را به چند بخش جدا تقسیم کرده‌اند؛ هر بخش ورودی و کار خودش را دارد و روی درِ هر قسمت مشخص است چه دپارتمانی آنجاست.",
      "en": "A large building is divided into separate sections; each has its own entrance and job, with a clear department on every door.",
      "source": "curated"
    }
  ],
  "党": [
    {
      "fa": "چند نفر زیر سقف 宀 دور 兄 بزرگ‌تر جمع می‌شوند و یک نشان مشترک بالا می‌برند؛ جمع کوچکشان تبدیل به یک حزب یا جناح می‌شود.",
      "en": "Several people gather under a 宀 roof around the older 兄 figure and raise one shared banner; the small gathering becomes a party or faction.",
      "source": "curated"
    }
  ],
  "市": [
    {
      "fa": "در یک بازار شهری، فروشنده‌ها زیر سقف 亠 پارچه‌های 巾 را آویزان کرده‌اند و مردم بین غرفه‌ها رفت‌وآمد می‌کنند؛ این هم بازار است، هم شهر.",
      "en": "In a city market, vendors hang 巾 cloth beneath awnings like 亠 while people move between stalls; the scene is both market and town.",
      "source": "curated"
    }
  ],
  "四": [
    {
      "fa": "چهار صندلی را داخل یک اتاق قاب‌دار 囗 بچین و یکی را با علامت کوچکی مشخص کن؛ قبل از بستن در، هر چهار صندلی را بشمار.",
      "en": "Place four chairs inside a framed 囗 room and mark one with a small sign; before closing the door, count all four.",
      "source": "curated"
    }
  ],
  "場": [
    {
      "fa": "خاکِ 土 یک میدان می‌سازد، خورشید 日 آن را روشن می‌کند و 勿 کنار ورودی مثل تابلویی می‌گوید «رویداد اینجاست»؛ این همان محل برگزاری است.",
      "en": "Earth 土 forms a field, the sun 日 lights it, and 勿 stands by the entrance like a sign saying “the event is here”; this is the place.",
      "source": "curated"
    }
  ],
  "員": [
    {
      "fa": "یک کارمند جلوی در کارت عضویت خود را نشان می‌دهد؛ روی کارت یک نشان 口 و یک مهر 貝 دیده می‌شود و نگهبان او را به عنوان عضو می‌شناسد.",
      "en": "An employee shows a membership badge at the door; a 口 mark and 貝 seal appear on it, and the guard recognizes the person as a member.",
      "source": "curated"
    }
  ],
  "選": [
    {
      "fa": "چند گزینه روی یک مسیر 辶 منتظرند؛ تو یکی را با دست انتخاب می‌کنی و بقیه را در صف جا می‌گذاری. انتخاب، همان لحظهٔ جداکردن یک گزینه است.",
      "en": "Several choices wait along a 辶 path; you pick one and leave the rest in line. Choosing is the moment you separate one option from the others.",
      "source": "curated"
    }
  ],
  "全": [
    {
      "fa": "یک پادشاه 王 زیر یک تاج کوچک قرار گرفته و همهٔ افراد گروه دور او جا گرفته‌اند؛ هیچ‌کس بیرون نمانده و مجموعه کامل شده است.",
      "en": "A king 王 wears a small crown while every member of the group fits around him; no one is left out, so the whole set is complete.",
      "source": "curated"
    }
  ],
  "戦": [
    {
      "fa": "یک سرباز 戈 را بالا می‌گیرد و وارد میدان می‌شود؛ دو طرف روبه‌روی هم صف می‌کشند و اولین برخورد، نبرد را شروع می‌کند.",
      "en": "A soldier raises a 戈 and enters the field; two sides line up and the first clash begins the battle.",
      "source": "curated"
    }
  ],
  "経": [
    {
      "fa": "یک نخ 糸 را روی مسیر می‌گذاری و آن را قدم‌به‌قدم از یک نقطه به نقطهٔ دیگر می‌کشانی؛ نخ با عبور از مسیر، راه را طی می‌کند.",
      "en": "Lay a 糸 thread along a route and pull it point by point from one end to the other; as it passes through, it travels the course.",
      "source": "curated"
    }
  ],
  "外": [
    {
      "fa": "در غروب 夕 پشت مرز ایستاده‌ای و یک نشانهٔ 卜 به بیرون اشاره می‌کند؛ هرجا آن‌سوی مرز باشد، بیرون است.",
      "en": "At 夕 dusk you stand by a boundary while a 卜 sign points beyond it; everything on the far side is outside.",
      "source": "curated"
    }
  ],
  "体": [
    {
      "fa": "یک آدم 亻 کنار تنهٔ اصلیِ 本 می‌ایستد؛ ستونِ اصلیِ بدن مثل تنهٔ درخت است و همهٔ حرکت از همان بدنه انجام می‌شود.",
      "en": "A person 亻 stands beside the main trunk of 本; the body is the central trunk from which movement happens.",
      "source": "curated"
    }
  ],
  "化": [
    {
      "fa": "یک آدم 亻 جلوی یک ماسک 匕 می‌ایستد و ناگهان شکلش عوض می‌شود؛ قبل و بعد را مقایسه می‌کنی و تغییر را می‌بینی.",
      "en": "A person 亻 stands before a 匕 mask and suddenly changes form; you compare before and after and see the transformation.",
      "source": "curated"
    }
  ],
  "題": [
    {
      "fa": "یک برگهٔ امتحان باز می‌شود و سؤالِ اصلی با 是 و عنوانِ صفحهٔ 頁 مشخص است؛ چیزی که باید درباره‌اش حرف بزنی، موضوعِ برگه است.",
      "en": "An exam sheet opens with the main question marked by 是 and a page header 頁; the thing you must discuss is the topic of the sheet.",
      "source": "curated"
    }
  ],
  "首": [
    {
      "fa": "سر 首 جلوتر از بدن حرکت می‌کند و بقیهٔ بدن دنبالش می‌آید؛ چون سر در ابتدای بدن است، همان بخشِ بالاست که اول دیده می‌شود.",
      "en": "The head 首 moves ahead of the body and the rest follows; because the head leads the body, it is the part seen first.",
      "source": "curated"
    }
  ],
  "来": [
    {
      "fa": "چیزی از دور روی مسیر به سمت تو حرکت می‌کند و هر لحظه نزدیک‌تر می‌شود؛ هنوز اینجاست اما در راه است—یعنی می‌آید.",
      "en": "Something moves toward you from far away and gets closer each moment; it is on the way here, so it is coming.",
      "source": "curated"
    }
  ],
  "性": [
    {
      "fa": "قلب 忄 کنار 生 قرار گرفته و انگار ویژگیِ درونیِ یک موجود را از همان لحظهٔ تولد نشان می‌دهد؛ آن ویژگیِ درونی، «طبیعت» اوست.",
      "en": "A heart 忄 sits beside 生 and seems to reveal an inner quality from the moment life begins; that inner nature is the character's 性.",
      "source": "curated"
    }
  ],
  "的": [
    {
      "fa": "یک تیر سفیدِ 白 مستقیم به هدفِ 勺 می‌خورد و دقیقاً همان نقطه را مشخص می‌کند؛ محلِ اصابت، همان «نقطه و هدف» است.",
      "en": "A white 白 arrow hits a 勺 target exactly where intended; the point of impact becomes the marked target.",
      "source": "curated"
    }
  ],
  "制": [
    {
      "fa": "یک گاو 牛 داخل محدوده‌ای با مرزهای مشخص نگه داشته شده و تیغهٔ 刂 هر خروجی را می‌بندد؛ قانونِ سیستم، حرکت را کنترل می‌کند.",
      "en": "A 牛 cow is kept inside strict boundaries while a 刂 blade closes every exit; the system's rules control where it can move.",
      "source": "curated"
    }
  ]
});

const ENRICHED_PREPARED_MNEMONICS_5 = Object.freeze({
  "午": [
    {
      "fa": "خورشید درست بالای سرت است و یک میلهٔ عمودی وسط صحنه ایستاده؛ ساعت به ظهر رسیده و دیگر سایه‌ای به یک طرف کشیده نمی‌شود.",
      "en": "The sun is directly overhead while a vertical 午 pole stands in the middle of the scene; it is noon, with almost no shadow leaning to one side.",
      "source": "curated"
    }
  ],
  "島": [
    {
      "fa": "یک کوه 山 از آب بیرون زده و یک پرندهٔ 鳥 بالای آن نشسته؛ خشکیِ جداافتاده در میان آب، یک جزیره است.",
      "en": "A 山 mountain rises from the water with a 鳥 bird perched on top; the isolated land in the middle of the water is an island.",
      "source": "curated"
    }
  ],
  "共": [
    {
      "fa": "چند نفر دست‌هایشان را زیر یک وسیله برده‌اند و همه با هم آن را بلند می‌کنند؛ هیچ‌کس تنها نیست و کار مشترک پیش می‌رود.",
      "en": "Several people put their hands under one object and lift it together; nobody works alone, so the action is shared.",
      "source": "curated"
    }
  ],
  "加": [
    {
      "fa": "یک نفر نیروی 力 خودش را به دهان 口 می‌رساند و چیزی را داخل آن اضافه می‌کند؛ یک چیز به چیز دیگر افزوده می‌شود.",
      "en": "Someone brings 力 force to a 口 opening and adds something inside; one thing is added to another.",
      "source": "curated"
    }
  ],
  "勝": [
    {
      "fa": "دو رقیب روبه‌روی هم زور می‌آزمایند و یکی با آخرین فشار حریفش را کنار می‌زند؛ لحظه‌ای که یک طرف دست بالا را پیدا می‌کند، پیروزی است.",
      "en": "Two rivals face each other and struggle until one pushes the other aside with a final burst of force; the moment one side prevails is victory.",
      "source": "curated"
    }
  ],
  "告": [
    {
      "fa": "یک پیام را روی خاک 土 می‌گذاری و با دهان 口 آن را بلند اعلام می‌کنی؛ خبر از دهان تو به همه می‌رسد.",
      "en": "You place a message on the ground-like 土 base and announce it through a 口 mouth; the news reaches everyone by being told aloud.",
      "source": "curated"
    }
  ],
  "報": [
    {
      "fa": "یک بستهٔ خبر را دست‌به‌دست می‌فرستی تا به گیرنده برسد؛ چیزی که باید به دیگری تحویل داده شود، گزارش یا خبر است.",
      "en": "You pass a news package from hand to hand until it reaches its recipient; something delivered back as information is a report or news.",
      "source": "curated"
    }
  ],
  "家": [
    {
      "fa": "زیر یک سقف 宀، یک خوک 豕 آرام در گوشهٔ خانه خوابیده؛ همین تصویرِ حیوانِ خانگی زیر سقف، خانه و خانواده را زنده می‌کند.",
      "en": "Under a 宀 roof, a 豕 pig rests calmly in the corner; the animal under the roof makes the household scene come alive.",
      "source": "curated"
    }
  ],
  "府": [
    {
      "fa": "یک ادارهٔ رسمی زیر سایهٔ 广 باز است و کارمندها پرونده‌ها را روی میز تحویل می‌گیرند؛ ساختمانِ محلِ اداره را به «دفتر دولتی» وصل کن.",
      "en": "A formal office sits under the 广 shelter while staff receive files at the desk; turn the building scene into a government office.",
      "source": "curated"
    }
  ],
  "情": [
    {
      "fa": "قلب 忄 کنار 青 قرار گرفته و رنگِ حال‌وهوای آدم را عوض می‌کند؛ چیزی که در درونت حس می‌کنی، احساس توست.",
      "en": "A heart 忄 sits beside 青 and changes the color of the mood; what you feel inside is your emotion.",
      "source": "curated"
    }
  ],
  "昨": [
    {
      "fa": "خورشید 日 هنوز کنار توست، اما صحنه به زمانی برگشته که یک روز تمام شده؛ روزی که پشت سر گذاشته‌ای، دیروز است.",
      "en": "The 日 sun is still in the scene, but you are looking back to a day that has already ended; the day behind you is yesterday.",
      "source": "curated"
    }
  ],
  "画": [
    {
      "fa": "یک نقاشی را داخل قاب 田 و مرزِ بیرونی‌اش می‌بینی؛ هنرمند شکلِ یک صحنه را درون قاب ثبت کرده است.",
      "en": "Picture an artist drawing a 田-like scene inside a fixed outer frame; the scene captured inside the frame is a picture.",
      "source": "curated"
    }
  ],
  "示": [
    {
      "fa": "کسی یک تابلو را جلوی دیگران بلند می‌کند تا همه آن را ببینند؛ وقتی چیزی را پیش چشم دیگران می‌گذاری، داری نشان می‌دهی.",
      "en": "Someone raises a sign in front of others so everyone can see it; putting something before their eyes is to show or indicate.",
      "source": "curated"
    }
  ],
  "組": [
    {
      "fa": "نخ 糸 را دور چند قطعه می‌پیچی و آن‌ها را کنار هم نگه می‌داری؛ رشته‌ها که کنار هم قرار می‌گیرند، یک مجموعه می‌سازند.",
      "en": "You wrap 糸 thread around several pieces and hold them together; once the strands are joined, they form a set or group.",
      "source": "curated"
    }
  ],
  "認": [
    {
      "fa": "حرف 言 را بعد از چند بار بررسی می‌پذیری؛ وقتی چیزی را می‌بینی و می‌گویی «بله، همین است»، آن را شناخته‌ای.",
      "en": "After checking the 言 claim, you accept it; when you look at something and say “yes, that is it,” you recognize it.",
      "source": "curated"
    }
  ],
  "近": [
    {
      "fa": "روی مسیر 辶 قدم می‌زنی و فاصله تا تبر 斤 کمتر و کمتر می‌شود؛ هر قدم تو را نزدیک‌تر می‌کند.",
      "en": "You walk along 辶 and the distance to the 斤 axe gets smaller with every step; each step brings you nearer.",
      "source": "curated"
    }
  ],
  "重": [
    {
      "fa": "یک بارِ سنگین روی مسیر 里 افتاده و هیچ‌کس نمی‌تواند به‌راحتی آن را بلند کند؛ وزنِ زیاد، صحنه را سنگین می‌کند.",
      "en": "A heavy load lies over the 里 route and nobody can lift it easily; the weight makes the whole scene heavy.",
      "source": "curated"
    }
  ],
  "革": [
    {
      "fa": "یک تکه پوست را می‌کَنی، می‌کشی و صاف می‌کنی تا به چرم آماده تبدیل شود؛ پوستِ کارشده، همان革 است.",
      "en": "You strip, stretch, and smooth a hide until it becomes usable leather; the worked hide is 革.",
      "source": "curated"
    }
  ],
  "代": [
    {
      "fa": "یک آدم 亻 از نفر قبلی جلو می‌آید و جای او را می‌گیرد؛ وقتی یک نفر جای دیگری می‌آید، نقش‌ها عوض می‌شوند.",
      "en": "A person 亻 steps forward and takes the previous person's place; when one person replaces another, the roles change.",
      "source": "curated"
    }
  ],
  "任": [
    {
      "fa": "یک آدم 亻 یک بارِ 壬 را روی شانه می‌گذارد و مسئولیتش را قبول می‌کند؛ باری که پذیرفته‌ای دیگر روی دوش توست.",
      "en": "A person 亻 puts the 壬 load on their shoulder and accepts it; once you take the load, the responsibility is yours.",
      "source": "curated"
    }
  ],
  "使": [
    {
      "fa": "یک آدم 亻 یک مأموریت را از مقام吏 می‌گیرد و آن را اجرا می‌کند؛ وقتی از کسی برای انجام کاری استفاده می‌کنی، او به کار گرفته شده است.",
      "en": "A person 亻 receives an assignment from an 吏 official and carries it out; when someone is used for a task, they are put to work.",
      "source": "curated"
    }
  ],
  "信": [
    {
      "fa": "یک آدم 亻 حرف 言 خودش را می‌زند و تو تصمیم می‌گیری حرفش را باور کنی؛ اعتماد از پذیرفتنِ سخنِ او شروع می‌شود.",
      "en": "A person 亻 gives their 言 word and you decide to believe it; trust begins when you accept what they say.",
      "source": "curated"
    }
  ],
  "側": [
    {
      "fa": "یک آدم 亻 کنار خط‌کش یا قانون 則 ایستاده و مرز کناری را نشان می‌دهد؛ جای کنارِ چیز دیگر، سمت آن است.",
      "en": "A person 亻 stands beside a rule-like 則 marker and points to the edge; the place beside something is its side.",
      "source": "curated"
    }
  ],
  "区": [
    {
      "fa": "چند چیز داخل یک قاب 匚 از بقیه جدا شده‌اند و یک علامت درون قاب مرز را مشخص می‌کند؛ همین بخشِ جداشده یک ناحیه است.",
      "en": "Several things are separated inside a 匚 frame while a mark fixes the boundary; the separated section is a district or area.",
      "source": "curated"
    }
  ],
  "参": [
    {
      "fa": "سه پرتو 彡 دور یک آدم بزرگ دَور می‌زنند و او به سه نقطهٔ مختلف سر می‌زند؛ سه بار وارد صحنه‌شدن، حسِ مشارکت را نگه می‌دارد.",
      "en": "Three 彡 rays circle a large figure and the figure visits three places; the repeated arrival keeps the idea of taking part.",
      "source": "curated"
    }
  ],
  "向": [
    {
      "fa": "یک دهانهٔ 口 داخل قاب دارد دقیقاً به یک سمت باز می‌شود؛ هرچه آن دهانه را دنبال کنی، جهتِ رو به آن را پیدا می‌کنی.",
      "en": "A 口 opening inside a frame faces one clear direction; follow the opening and you find the direction it points toward.",
      "source": "curated"
    }
  ],
  "地": [
    {
      "fa": "یک نشانهٔ 也 روی خاک 土 ثابت مانده و تو دقیقاً همان تکه از زمین را مشخص می‌کنی؛ آن سطح و جایگاه، زمین است.",
      "en": "A 也 mark rests on 土 ground and you point to that exact patch; the surface and place underfoot is the ground.",
      "source": "curated"
    }
  ],
  "基": [
    {
      "fa": "یک سازه روی پایهٔ土 نشسته و هرچه بالا می‌رود، به همان پایه وابسته می‌ماند؛ چیزی که همه‌چیز روی آن بنا شده، بنیاد است.",
      "en": "A structure rests on a 土 foundation and stays dependent on it as it rises; what everything is built on is the foundation.",
      "source": "curated"
    }
  ],
  "増": [
    {
      "fa": "لایه‌های خاک 土 یکی‌یکی روی هم قرار می‌گیرند و توده بزرگ‌تر می‌شود؛ هر لایه مقدار بیشتری اضافه می‌کند.",
      "en": "Layers of 土 pile up one after another and the mound gets larger; each layer increases the amount.",
      "source": "curated"
    }
  ],
  "実": [
    {
      "fa": "زیر سقف 宀 می‌بینی که چیزی واقعاً آنجاست و فقط ظاهر نیست؛ وقتی چیزی درون صحنه واقعیت دارد، واقعی و عینی است.",
      "en": "Under the 宀 roof, you can see that something is truly there, not just an appearance; what is actually present is real.",
      "source": "curated"
    }
  ],
  "度": [
    {
      "fa": "یک بار بعد از بار دیگر فاصله را با دست و قدم می‌سنجی؛ هر بار عبور از همان مقدار، یک درجه یا اندازهٔ مشخص می‌سازد.",
      "en": "You measure the same distance again and again with hand and steps; each measured extent marks a degree or amount.",
      "source": "curated"
    }
  ],
  "強": [
    {
      "fa": "یک کمان 弓 محکم کشیده شده و حشرهٔ 虫 داخلش تکان نمی‌دهد؛ کشش زیاد آن را نگه می‌دارد و صحنه پرقدرت می‌شود.",
      "en": "A taut 弓 bow holds a 虫 insect in place and does not give way; the strong tension makes the scene powerful.",
      "source": "curated"
    }
  ],
  "文": [
    {
      "fa": "روی کاغذ چند خط را با نظم می‌کشی تا یک پیام شکل بگیرد؛ وقتی خط‌های منظم معنا پیدا می‌کنند، نوشتار پدید می‌آید.",
      "en": "You arrange several strokes on paper until they form a message; when ordered marks carry meaning, writing appears.",
      "source": "curated"
    }
  ],
  "書": [
    {
      "fa": "قلم 聿 را روی صفحه حرکت می‌دهی و هر کلمه را ثبت می‌کنی؛ حرکتِ قلم که اثری ماندگار می‌گذارد، نوشتن است.",
      "en": "Move the 聿 writing brush across the page and record each word; the brush leaving a lasting mark is writing.",
      "source": "curated"
    }
  ],
  "案": [
    {
      "fa": "یک ایده را روی میز می‌گذاری تا دیگران آن را بررسی کنند؛ طرحی که روی میز قرار می‌گیرد، پیشنهاد یا برنامه است.",
      "en": "You place an idea on the table for others to examine; a plan laid out for consideration is a proposal.",
      "source": "curated"
    }
  ],
  "権": [
    {
      "fa": "یک نماد را بالا نگه داشته‌ای تا دیگران بدانند چه کسی تصمیم می‌گیرد؛ توانِ تعیین کردنِ نتیجه، اختیار و اقتدار است.",
      "en": "You hold up a symbol so others know who decides; the power to determine the outcome is authority.",
      "source": "curated"
    }
  ],
  "求": [
    {
      "fa": "دستت را جلو می‌بری و در آب چیزی را جست‌وجو می‌کنی؛ تا وقتی پیدا نشده، دست از طلب‌کردن برنمی‌داری.",
      "en": "You reach into the water and search for something; until it is found, you keep seeking it.",
      "source": "curated"
    }
  ],
  "治": [
    {
      "fa": "آبِ氵 آشفته را کنار یک سکوی台 آرام می‌کنی تا جریان مرتب شود؛ وقتی آشفتگی را مهار می‌کنی، اوضاع را اداره و درمان می‌کنی.",
      "en": "You calm turbulent 氵 water beside a 台 platform until the flow settles; controlling disorder is governing or bringing it under treatment.",
      "source": "curated"
    }
  ],
  "点": [
    {
      "fa": "یک نقطهٔ روشن را با占 بالای چهار شعلهٔ灬 می‌سازی؛ یک علامت کوچک و مشخص روی صفحه، یک نقطه است.",
      "en": "A bright point forms from 占 above four 灬 flames; one small, definite mark on the page is a point.",
      "source": "curated"
    }
  ],
  "県": [
    {
      "fa": "یک چشم 目 بالای یک قاب 凵 قرار گرفته تا روی نقشه بتوانی این بخش را تشخیص بدهی؛ یک محدودهٔ اداری مشخص می‌شود.",
      "en": "A 目 eye sits over a 凵 frame so you can identify one area on a map; a specific administrative region is marked.",
      "source": "curated"
    }
  ],
  "知": [
    {
      "fa": "یک تیر 矢 کنار دهان 口 قرار دارد؛ چیزی را در ذهنت می‌فهمی و بعد می‌توانی همان دانسته را با دهانت بگویی.",
      "en": "An arrow 矢 sits beside a 口 mouth; you grasp something in your mind and then can say what you know.",
      "source": "curated"
    }
  ],
  "社": [
    {
      "fa": "نشانهٔ آیینی 礻 روی خاک 土 قرار گرفته و مردم دور آن جمع می‌شوند؛ یک نهاد یا اجتماع روی زمین خودش شکل می‌گیرد.",
      "en": "The 礻 ritual marker stands on 土 ground and people gather around it; an institution or community forms on its own ground.",
      "source": "curated"
    }
  ],
  "私": [
    {
      "fa": "خوشهٔ禾 را به یک انبار کوچکِ 厶 می‌بری که فقط برای خودت است؛ چیزی که سهم تو و نه جمع است، خصوصی است.",
      "en": "You carry a 禾 grain bundle into a small 厶 storehouse meant only for you; what belongs to you rather than the group is private.",
      "source": "curated"
    }
  ],
  "策": [
    {
      "fa": "چند قطعه بامبو 竹 و چوب 木 را کنار هم می‌چینی و روی آن راه‌حل می‌نویسی؛ وسیله‌ای که برای رسیدن به هدف چیده‌ای، یک طرح است.",
      "en": "You arrange pieces of bamboo 竹 and wood 木 and write a solution on them; an organized plan for reaching a goal is a strategy.",
      "source": "curated"
    }
  ],
  "米": [
    {
      "fa": "یک دانهٔ برنج را وسط می‌گذاری و چند خط از چهار طرف باز می‌شوند؛ دانه و پراکنده‌شدنِ اطرافش را یک تصویر واحد کن.",
      "en": "Place one grain of rice at the center while fine strokes spread from four sides; fuse the grain and its outward spread into one image.",
      "source": "curated"
    }
  ],
  "約": [
    {
      "fa": "یک نخ 糸 را دور یک قلاب勺 محکم می‌کنی و گره می‌زنی؛ قولی که بستی مثل همین گره است و باز کردنش آسان نیست.",
      "en": "Tie 糸 thread tightly around a 勺 hook; a promise is like that knot—once tied, it is not easy to undo.",
      "source": "curated"
    }
  ]
});

const ENRICHED_PREPARED_MNEMONICS_6 = Object.freeze({
  "世": [
    {
      "fa": "چند نسل پشت سر هم از یک دروازه عبور می‌کنند؛ هر نسل جای نسل قبلی می‌آید و زمان جلو می‌رود. این دنبالهٔ نسل‌ها را با «دوران/جهان» نگه دار.",
      "en": "Picture generations passing through one gate one after another; each generation replaces the previous as time moves forward. Keep that succession as the world or an era.",
      "source": "curated"
    }
  ],
  "両": [
    {
      "fa": "یک قاب冂 را در نظر بگیر که دو بخش هم‌زمان در دو طرفش قرار گرفته‌اند؛ وقتی هر دو طرف با هم حساب می‌شوند، «هر دو» را داری.",
      "en": "Picture a 冂 frame holding two sides at once; when both sides are counted together, you have both.",
      "source": "curated"
    }
  ],
  "九": [
    {
      "fa": "یک ورزشکار می‌شمارد و درست قبل از ده، عدد نه روی تابلو روشن می‌شود؛ همان یک قدمِ مانده به ده را با شکل 九 جفت کن.",
      "en": "A runner counts up and the scoreboard flashes nine just before ten; pair that one-step-before-ten moment with 九.",
      "source": "curated"
    }
  ],
  "予": [
    {
      "fa": "بسته‌ای را قبل از روز موعود آماده می‌کنی و کنار می‌گذاری؛ چیزی که از پیش برای آینده آماده شده، «از قبل/مقدماتی» است.",
      "en": "You prepare a package before the due day and set it aside; something prepared in advance is the cue for 予.",
      "source": "curated"
    }
  ],
  "務": [
    {
      "fa": "یک نیزه 矛 روی شانه‌ات است و با هر قدم 夂 باید آن را تا مقصد ببری؛ چون این کار را باید انجام دهی، تبدیل به وظیفه می‌شود.",
      "en": "A 矛 spear rests on your shoulder and you must carry it step by step with 夂 to the destination; a task you are bound to do becomes a duty.",
      "source": "curated"
    }
  ],
  "売": [
    {
      "fa": "یک فروشنده کالا را از زیر سقف بیرون می‌آورد، جلوی مشتری می‌گذارد و منتظر پرداخت می‌ماند؛ این زنجیرهٔ عرضه تا پرداخت، فروش است.",
      "en": "A seller brings an item out from under a roof, places it before a customer, and waits for payment; that sequence is selling.",
      "source": "curated"
    }
  ],
  "多": [
    {
      "fa": "یک نفر یک علامت 夕 می‌گذارد، بعد یکی دیگر و بعد یکی دیگر؛ ناگهان تعداد زیاد شده است. تکرارِ یک چیز، «زیاد» را بساز.",
      "en": "One 夕 appears, then another, then another; suddenly the number is large. Repeating the same thing creates many.",
      "source": "curated"
    }
  ],
  "百": [
    {
      "fa": "یک خط 一 بالای 白 قرار می‌گیرد و عدد کامل روی تابلو می‌شود؛ آن خط اضافه را به صد وصل کن تا از 白 جدا بماند.",
      "en": "A 一 line is placed above 白 and the complete number appears on the board; keep that extra line as the cue for one hundred and distinguish it from 白.",
      "source": "curated"
    }
  ],
  "立": [
    {
      "fa": "یک نفر پاهایش را روی زمین ثابت می‌کند، کمرش را صاف می‌کند و دیگر حرکت نمی‌کند؛ همین لحظهٔ ثابت‌شدن، ایستادن است.",
      "en": "A person plants their feet on the ground, straightens up, and stops moving; that moment of becoming upright is standing.",
      "source": "curated"
    }
  ],
  "話": [
    {
      "fa": "یک گوینده با 言 حرف می‌زند و زبان 舌 مدام در دهانش حرکت می‌کند؛ صدای پیوستهٔ زبان، گفتار و صحبت را می‌سازد.",
      "en": "A speaker talks with 言 while the 舌 tongue keeps moving; the continuous flow from the tongue becomes speech and conversation.",
      "source": "curated"
    }
  ],
  "調": [
    {
      "fa": "یک نوازنده نت را می‌شنود، پیچ ساز را کمی می‌چرخاند و دوباره می‌نوازد تا صدای دقیق به دست آید؛ این چرخهٔ ریزتنظیم، تنظیم‌کردن است.",
      "en": "A musician hears a note, turns the instrument slightly, and plays again until the exact sound is right; that repeated fine-tuning is adjustment.",
      "source": "curated"
    }
  ],
  "論": [
    {
      "fa": "دو نفر ورقه‌به‌ورقه روی مسئله حرف می‌زنند و هر ادعا را با دلیل جلو می‌برند؛ وقتی حرف‌ها منظم و سنجیده می‌شوند، بحث و استدلال شکل می‌گیرد.",
      "en": "Two people discuss a problem page by page and move each claim forward with reasons; organized, reasoned speech becomes an argument or discussion.",
      "source": "curated"
    }
  ],
  "院": [
    {
      "fa": "از درِ یک مؤسسه عبور می‌کنی و وارد حیاطی کامل و محصور می‌شوی؛ ساختمان و محوطهٔ وابسته به هم یک مجموعهٔ رسمی می‌سازند.",
      "en": "You pass through an institution's entrance into a complete enclosed courtyard; the building and its grounds form one formal institution.",
      "source": "curated"
    }
  ],
  "際": [
    {
      "fa": "دو طرفِ یک مرز دقیقاً به هم می‌رسند و کنار آن مراسمی در حال برگزاری است؛ لحظهٔ تماسِ دو محدوده، مرز و موقعیت را تداعی می‌کند.",
      "en": "Two sides meet exactly at a boundary while a ceremony takes place there; the point where regions meet evokes a boundary or occasion.",
      "source": "curated"
    }
  ],
  "面": [
    {
      "fa": "یک سطح صاف جلوی صورتت قرار دارد؛ وقتی تمام سطح را یکجا می‌بینی، هم «رویه» را داری هم چهره را. همین سطحِ رو‌به‌رو را به 面 قفل کن.",
      "en": "A flat surface is directly in front of your face; seeing the whole surface gives you both the face and the surface. Lock onto that front-facing plane for 面.",
      "source": "curated"
    }
  ],
  "領": [
    {
      "fa": "یک مقام令 فرمانی می‌دهد و بخش مشخصی از سرزمین 頁 تحت همان فرمان قرار می‌گیرد؛ محدوده‌ای که زیر اختیار اوست، قلمرو است.",
      "en": "An official 令 gives an order and a defined territory under 頁 comes under that command; the area under someone's control is a domain or territory.",
      "source": "curated"
    }
  ],
  "高": [
    {
      "fa": "از پایین به برجی نگاه می‌کنی که سقفش 亠 بالاتر از همه است؛ پنجرهٔ口 هم از سطح خیابان دور شده. فاصلهٔ زیاد از زمین، بلندی را می‌سازد.",
      "en": "You look up at a tower whose 亠 roof is higher than everything around it; even its 口 window is far above street level. The distance from the ground creates height.",
      "source": "curated"
    }
  ]
});

export const CURATED_PREPARED_MNEMONICS = Object.freeze({
  ...BASE_CURATED_PREPARED_MNEMONICS,
  ...ENRICHED_PREPARED_MNEMONICS_1,
  ...ENRICHED_PREPARED_MNEMONICS_2,
  ...ENRICHED_PREPARED_MNEMONICS_3,
  ...ENRICHED_PREPARED_MNEMONICS_4,
  ...ENRICHED_PREPARED_MNEMONICS_5,
  ...ENRICHED_PREPARED_MNEMONICS_6,
});

const FA_SCENE_CUES = /(?:تصور|ببین|داخل|کنار|روبه|ایستاده|می‌بینی|می‌زنی|می‌گذاری|می‌کنی|می‌شود|جمع|حرکت|می‌رود|می‌رسد|می‌گیرد|می‌شمارد|می‌پیچی|می‌شنوی|بساز|نگه|هل|باز|بسته|پرتاب|ضربه|بررسی|صف|میز|دست|می‌چسبانی|می‌دوانی|می‌کشی|شکل|مثل|خط|خورشید|ماه|آتش|آب|درخت|تپه|کوه|رود|مزرعه|دهان|چشم|گوش|پا|آدم|کودک|زن|مرد|جوانه|سقف|دروازه|تبر|نخ|جواهر|برنج)/;
const EN_SCENE_CUES = /(?:Picture|Imagine|Put|Place|Lay|Close|Open|Push|Throw|Tie|Gather|Move|Walk|Stand|Hold|Receive|Check|Wrap|Count|Pick|Arrange|Under|Beside|Behind|Inside|Facing|Run|Reach|Drop|Guard|Press|Spring|See|Set|Build|Work|Mark|Watch|Keep|Cut|Pull|Pass|Leave|Choose|Carry|Stack|shape|looks like|line|sun|moon|fire|water|tree|mound|mountain|river|field|mouth|eye|ear|hand|foot|person|child|woman|man|sprout|roof|gate|axe|thread|jewel|rice)/i;
const FA_ACTION_CUES = /(?:می‌دود|می‌دواند|می‌کشد|می‌بُرد|می‌برد|می‌گذارد|می‌زند|می‌افتد|می‌ایستد|می‌گیرد|می‌چرخد|می‌رسد|می‌آید|می‌ماند|می‌ریزد|می‌پرند|می‌وزد|باز می‌شوند|جمع شوند|جمع می‌شوند|حرکت می‌کنند|جلو می‌رود|جدا می‌کند|کنترل می‌کند|شروع می‌کند|منتظر می‌مانی|انتخاب می‌کنی|رد شوی|جا می‌گذاری|بسته‌ای|باز می‌کنی|می‌گردد|می‌نشیند|می‌خواهد|می‌دهد|می‌سازد|ساخته شود|فرو می‌رود|مقایسه می‌کنی)/;
const EN_ACTION_CUES = /(?:runs|run|pulls|cuts|carries|moves|walks|stands|holds|hits|drops|spins|reaches|comes|stays|falls|flies|blows|gathers|separates|controls|starts|waits|pick|leave|cross|blocks|change|changes|drives|travels|returns|opens|closes|shows|works|turns|sits|asks|calls|keeps|becomes|builds|made|moves|compares)/i;

const GENERATED_TEMPLATE_PATTERNS = [
  /یک تصویر واحد از/,
  /شکل «[^»]+» را به یک تصویر/,
  /Picture the visual anchors/i,
  /Turn the shape of/i
];

export function scorePreparedMnemonic(entry, character = "", components = []) {
  const fa = cleanText(entry?.fa, 600);
  const en = cleanText(entry?.en, 600);
  const source = entry?.source === "curated" || entry?.source === "generated" ? entry.source : "invalid";
  const genericTemplate = GENERATED_TEMPLATE_PATTERNS.some(pattern => pattern.test(fa) || pattern.test(en));
  const componentList = [...new Set((Array.isArray(components) ? components : []).map(value => cleanText(value, 2)).filter(Boolean))];
  const componentConnected = componentList.length === 0 || componentList.some(component => fa.includes(component) || en.includes(component));
  return {
    source,
    valid: Boolean(fa && en && source !== "invalid"),
    minLength: fa.length >= 20 && en.length >= 20,
    concreteAnchorFa: FA_SCENE_CUES.test(fa),
    concreteAnchorEn: EN_SCENE_CUES.test(en),
    actionSceneFa: FA_SCENE_CUES.test(fa) && FA_ACTION_CUES.test(fa),
    actionSceneEn: EN_SCENE_CUES.test(en) && EN_ACTION_CUES.test(en),
    characterConnected: Boolean(character) && (fa.includes(character) || en.includes(character)),
    componentConnected,
    genericTemplate
  };
}

export function preparedMnemonicQualityReport(catalog = [], componentResolver = null) {
  const items = Array.isArray(catalog) ? catalog.filter(item => String(item?.character ?? "").trim()) : [];
  const curated = items.filter(item => CURATED_PREPARED_MNEMONICS[String(item.character)]?.[0]);
  const scores = curated.map(item => {
    const character = String(item.character);
    const components = componentResolver?.(character) ?? [];
    return scorePreparedMnemonic(CURATED_PREPARED_MNEMONICS[character]?.[0], character, components);
  });
  const count = scores.length;
  const rate = (key) => count ? scores.filter(score => Boolean(score[key])).length / count : 0;
  const criticalFailures = scores.filter(score => !score.valid || !score.minLength || score.source !== "curated").length;
  const genericTemplateLeaks = scores.filter(score => score.genericTemplate).length;
  const concreteAnchorFa = scores.filter(score => score.concreteAnchorFa).length;
  const concreteAnchorEn = scores.filter(score => score.concreteAnchorEn).length;
  const actionSceneFa = scores.filter(score => score.actionSceneFa).length;
  const actionSceneEn = scores.filter(score => score.actionSceneEn).length;
  return {
    total: items.length,
    curated: count,
    generated: Math.max(0, items.length - count),
    criticalFailures,
    genericTemplateLeaks,
    concreteAnchorFa,
    concreteAnchorEn,
    concreteAnchorFaRate: rate("concreteAnchorFa"),
    concreteAnchorEnRate: rate("concreteAnchorEn"),
    actionSceneFa,
    actionSceneEn,
    actionSceneFaRate: rate("actionSceneFa"),
    actionSceneEnRate: rate("actionSceneEn"),
    characterConnectedRate: rate("characterConnected"),
    componentConnectedRate: rate("componentConnected"),
    passes: criticalFailures === 0 &&
      genericTemplateLeaks === 0 &&
      rate("concreteAnchorFa") >= 0.8 &&
      rate("concreteAnchorEn") >= 0.9
  };
};

const cleanText = (value, max = 120) =>
  String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

const firstMeaning = (item) => {
  const values = Array.isArray(item?.meanings) ? item.meanings : Array.isArray(item?.meaning) ? item.meaning : [];
  return cleanText(values.find(Boolean) || "this meaning", 90);
};

export function buildPreparedMnemonic(item, components = []) {
  const character = cleanText(item?.character ?? item?.id, 4);
  if (!character) return { fa: "", en: "", source: "generated" };
  const curated = CURATED_PREPARED_MNEMONICS[character]?.[0];
  if (curated) return { ...curated };

  const meaning = firstMeaning(item);
  const anchors = [...new Set((Array.isArray(components) ? components : []).map(value => cleanText(value, 2)).filter(Boolean))]
    .filter(value => value !== character)
    .slice(0, 4);

  const anchorText = anchors.length ? anchors.join("・") : character;
  const fa = anchors.length
    ? `یک تصویر واحد از «${anchorText}» بساز و آن را مستقیم به معنی «${meaning}» وصل کن؛ هر بار که این شکل را می‌بینی، همان معنی را به یاد بیاور.`
    : `شکل «${character}» را به یک تصویر ذهنی واضح برای معنی «${meaning}» تبدیل کن؛ شکل کانجی را بخشی از همان تصویر بدان.`;
  const en = anchors.length
    ? `Picture the visual anchors ${anchorText} as one scene and connect that scene directly to “${meaning}”; seeing the shape should bring the meaning back.`
    : `Turn the shape of ${character} into one clear mental image for “${meaning}”; make the character itself part of that image.`;

  return { fa: cleanText(fa, 600), en: cleanText(en, 600), source: "generated" };
}

export function buildPreparedMnemonicEntries(catalog = [], componentResolver = null) {
  return (Array.isArray(catalog) ? catalog : [])
    .filter(item => String(item?.character ?? "").trim())
    .map(item => ({
      character: String(item.character),
      suggestion: buildPreparedMnemonic(item, componentResolver?.(item.character) ?? [])
    }));
}

export function preparedMnemonicCoverage(catalog = []) {
  const total = Array.isArray(catalog) ? catalog.filter(item => String(item?.character ?? "").trim()).length : 0;
  const curated = Object.keys(CURATED_PREPARED_MNEMONICS).length;
  return { total, curated, generated: Math.max(0, total - curated), coverage: total ? (total / total) : 0 };
}
