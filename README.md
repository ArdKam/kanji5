# Kanji 5

یک PWA شخصی برای یادگیری ۲۱۳۶ کانجی Jōyō ژاپنی، روزانه ۵ کانجی جدید، با مرور فاصله‌دار تطبیقی بر پایهٔ FSRS.

## ویژگی‌ها
- پوشش هر ۲۱۳۶ کانجی Jōyō بر اساس رتبهٔ newspaper frequency
- ۵ کانجی جدید در روز (قابل تنظیم)
- مرورهای due قبل/در کنار کانجی‌های جدید
- چهار امتیاز Again / Hard / Good / Easy
- FSRS با retention هدف 90% و fuzzing
- نگهداری پیشرفت در localStorage
- Active Recall برای معنی و خوانش
- تمرین آموزشی تطبیقی برای Meaning، Reading، Production، Vocabulary و Context
- انتخاب adaptive بین کانجی‌های دیده‌شده بر اساس weakness، stage، recency و coverage
- انتخاب adaptive نوع تمرین بر اساس عملکرد قبلی
- ثبت جداگانهٔ عملکرد هر mode برای هر کانجی
- Smart distractors بر پایهٔ شباهت خوانش و معنی، stroke، grade، frequency و سابقهٔ خطا
- تمرین Context مبتنی بر جملهٔ ژاپنی و ترجمهٔ انگلیسی، با cache و fallback ایمن
- نمایش On'yomi / Kun'yomi، معنی، تعداد stroke و رتبهٔ فراوانی
- بارگذاری lazy نمونه‌های واژگانی از kanjiapi.dev فقط هنگام نیاز
- قابلیت نصب به‌صورت PWA
- همگام‌سازی اختیاری پیشرفت با Supabase

## Education v1.4
- مدل state آموزشی شامل `new`، `exposed`، `learning`، `reinforcing` و `mastered`
- ثبت `exposedAt` برای اولین مواجهه بدون نیاز به پاسخ دادن
- grading جداگانه برای معنی و خوانش با پشتیبانی Hiragana / Romaji
- تولید Romaji canonical برای مقایسهٔ پایدار خوانش‌ها
- انتخاب adaptive کانجی از بین موارد دیده‌شده و جلوگیری از تکرار فوری مورد قبلی
- fallback ایمن به تمرین‌های محلی Meaning / Reading / Production در صورت در دسترس نبودن APIهای خارجی
- Cache محلی برای Vocabulary و Context

## v1.5
- Active Recall با یادگیری component-level و scheduler اختصاصی
- جداسازی pure recall core از UI/orchestration
- persistence مبتنی بر snapshot و transaction با recovery/reconciliation
- sync چندلایه برای education، FSRS و state با merge/replay قطعی
- Supabase sync با optimistic concurrency، locking و retry
- network adapter مستقل برای KanjiAPI/Tatoeba و coalescing در service worker
- تست‌های architecture، persistence، sync lifecycle، network و browser smoke

## v1.6 — Adaptive Session Intelligence
v1.6 لایهٔ session را از یک dashboard صرف به یک چرخهٔ adaptive کامل تبدیل می‌کند:

- **Session Dashboard:** شمارنده‌های due/new/mastered، goal progress، streak، review count، active mode plan و session summary
- **Session Persistence & Resume:** شناسهٔ پایدار session، snapshot طرح، `remainingModes` و status برای resume بعد از reload یا خروج ناخواسته
- **Adaptive Session Engine:** ساخت plan اولیه، انتخاب mode بعدی بر اساس وضعیت جلسه و مصرف mode فقط پس از موفقیت در resolve شدن محتوای تمرین
- **Live Rebalancing:** تغییر plan در میانهٔ جلسه بر اساس feedback همان session، بدون از دست دادن remainder اصلی
- **Session-scoped Feedback:** ثبت نتیجهٔ educational و اتصال authoritative feedback به session؛ نتیجهٔ `نمی‌دانم` همچنان outcome آموزشی است و rating مستقیم FSRS نیست
- **Session Analytics:** خلاصهٔ session و تاریخچهٔ mode-level برای تحلیل عملکرد و trend
- **Long-term Skill Profile:** تجمیع sessionهای کامل برای پنج مهارت Meaning، Reading، Production، Vocabulary و Context
- **Temporal Skill Profile:** نگهداری `recentAttempts`، `recentAccuracy` و `momentum` بر پایهٔ سه session اخیر
- **Profile-aware Planning:** استفاده از accuracy، recent accuracy و momentum در امتیازدهی modeها و اولویت‌بندی plan بعدی
- **Durable Sync Core:** merge/replay لایهٔ v1.6 برای session history، component state و profile-aware state بدون انتقال منطق merge به transport
- **Offline Runtime Contract:** تمام runtimeهای v1.6 در service worker precache شده‌اند و CI عدم mutation در checkout را بررسی می‌کند

### v1.6 release contract
قبل از اعلام release، این لایه‌ها باید همگی سبز باشند:

1. syntax و pure-core tests
2. session / feedback / analytics / skill-profile / sync contracts
3. browser E2E و persistence/resume behavior
4. committed-tree immutability و runtime wiring
5. release contract شامل نسخهٔ package، مستندات و CI wiring v1.6

## v1.7 — Adaptive Attribute Recall
v1.7 adaptive recall را از سطح card/session به سطح attribute یادگیری ارتقا می‌دهد، بدون جایگزین‌کردن FSRS یا شکستن جریان learning-first.

- **Adaptive Decision Core:** مدل‌سازی و رتبه‌بندی مستقل Meaning، Reading، Production، Vocabulary و Context بر اساس weakness و uncertainty
- **Adaptive Recall Integration:** انتخاب attribute ضعیف‌تر برای Active Recall با حفظ قرارداد backward-compatible فعلی
- **Session Continuity:** حفظ intent و plan تطبیقی در reload و اتصال آن به lifecycle موجود session
- **Learning UX:** نمایش attribute در حال تمرین و reason کوتاه و evidence-gated برای readingهای کمتر رایج
- **Evaluation & Tuning:** اندازه‌گیری accuracy/uncertainty/recovery، مقایسه با baseline پایدار و تولید توصیه‌های tuning فقط پس از کافی‌بودن evidence
- **Browser coverage:** پوشش E2E برای رفتار adaptive recall و session continuity

## Release status

**v1.7.0 — release-ready implementation.** P0-A/P0-B/P0-C، P1 و P2 کامل و پس از merge روی `main` اعتبارسنجی شده‌اند. CI مربوط به v1.6 و v1.7 سبز است و نسخهٔ package برابر `1.7.0` است.

Production/vocabulary/context recall modes عمداً تا زمانی که exercise واقعی learner-facing و grader معتبر برای آن‌ها وجود نداشته باشد gated باقی می‌مانند.

## منابع
- Jōyō/KANJIDIC2 dataset: jkindrix/japanese-language-data
- KANJIDIC2/EDRDG license: CC BY-SA 4.0
- FSRS: ts-fsrs (MIT)
- Example words: kanjiapi.dev / EDRDG-based data
- Context sentences: Tatoeba API

## نسخهٔ ۱.۳
- بهبود performance، storage bridge و cache invalidation
- رفع مشکلات loading shell و wiring نسخهٔ PWA

## نسخهٔ ۱.۲
- 🧠 Active Recall قبل از نمایش پاسخ
- 🎯 انتخاب adaptive بین Meaning و Reading
- 📈 ثبت جداگانهٔ موفقیت در Meaning و Reading
- 🔄 Progressive reveal با examples اختیاری
- ♻️ invalidation خودکار dataset cache پس از تغییر نسخه

## نسخهٔ ۱.۱
- 🔊 تلفظ کانجی، On'yomi/Kun'yomi و واژه‌های نمونه با Web Speech API
- 📊 آمار: کل مرورها، دقت، مرورهای ۷ روز اخیر، وضعیت کارت‌ها
- 🔥 رشتهٔ روزانه (streak) با رکورد طولانی‌ترین رشته
- هدف تعداد مرور روزانه، قابل تنظیم، با نوار پیشرفت جدا
- تشخیص Leech (کانجی‌های پرخطا) با آستانهٔ قابل تنظیم و نشان روی کارت
- میان‌برهای صفحه‌کلید: Space برای نمایش پاسخ، ۱–۴ برای Again/Hard/Good/Easy
